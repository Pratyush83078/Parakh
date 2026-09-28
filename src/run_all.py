"""
Master PAIMANA End-to-End Orchestrator
======================================
This script automates the full data-to-AI pipeline:
  Step 1: Converts all PDF flash reports in data/pdfs/ into data/raw/*.csv
  Step 2: Cleans & builds the multi-month panel with risk scoring (pipeline.py)
  Step 3: Trains ML models for Cost Overrun & Schedule Slip (model_train.py)
  Step 4: Exports latest snapshot & portfolio KPIs for the backend (export_for_backend.py)
  Step 5: Pings the Node.js backend to hot-reload data if it's running

Usage:
  python src/run_all.py             # Runs end-to-end (extracts new PDFs, reuses existing CSVs)
  python src/run_all.py --force-pdf # Forces re-extraction of all PDFs from scratch
"""

import sys
import os
import time
import urllib.request
import urllib.error
import csv
import hashlib
import json
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
PDF_DIR = BASE_DIR / "data" / "pdfs"
RAW_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"

# Import internal modules
sys.path.append(str(BASE_DIR / "src"))
from pdf_extracter import PARSER_VERSION, extract_report
from pipeline import build_full_panel
from model_train import train_and_compare
from export_for_backend import export_latest_snapshot
from report_utils import month_tag_from_filename


def parse_month_from_filename(filename: str) -> str:
    """Extract a canonical month-year tag without depending on filename prefixes."""
    return month_tag_from_filename(filename)


def step1_extract_all_pdfs(force: bool = False):
    print("\n========================================================")
    print("STEP 1: BATCH EXTRACTING PDFS ➔ RAW CSVS")
    print("========================================================")

    PDF_DIR.mkdir(parents=True, exist_ok=True)
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    pdf_files = sorted(PDF_DIR.rglob("*.pdf"))
    if not pdf_files:
        print(f"[Warning] No PDFs found in {PDF_DIR}. Checking for existing CSVs in {RAW_DIR}...")
        return

    print(f"Found {len(pdf_files)} PDF(s) under {PDF_DIR}")
    previous_manifest = {}
    manifest_path = RAW_DIR / "extraction_quality.json"
    if manifest_path.exists():
        try:
            previous_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            previous_manifest = {}
    previous_by_pdf = {row.get("source_pdf"): row for row in previous_manifest.get("reports", [])}
    reports = []
    staged = []

    for pdf_path in pdf_files:
        month_tag = parse_month_from_filename(pdf_path.name)
        out_csv = RAW_DIR / f"{month_tag}.csv"
        source_name = pdf_path.relative_to(BASE_DIR).as_posix()
        pdf_hash = hashlib.sha256(pdf_path.read_bytes()).hexdigest()

        cached = previous_by_pdf.get(source_name)
        if (out_csv.exists() and not force and cached
                and cached.get("sha256") == pdf_hash
                and cached.get("parser_version") == PARSER_VERSION
                and cached.get("status") in {"VERIFIED", "REVIEW_REQUIRED"}):
            print(f"  ✓ {source_name} unchanged; reusing {out_csv.name}")
            reports.append(cached)
            continue

        print(f"  ➔ Extracting {source_name} ({month_tag})...")
        t0 = time.time()
        try:
            records, quality = extract_report(str(pdf_path), month_tag)
            quality["source_pdf"] = source_name
            quality["sha256"] = pdf_hash
            if not records:
                quality["status"] = "FAILED"
                if "ongoing_project_table_not_found_or_empty" not in quality["errors"]:
                    quality["errors"].append("no_rows_extracted")
            else:
                staged.append((out_csv, records))
            reports.append(quality)
            elapsed = time.time() - t0
            print(f"    {quality['status']}: {len(records)} rows, "
                  f"{quality['rows_review_required']} flagged, {elapsed:.1f}s")
        except Exception as e:
            reports.append({"source_pdf": source_name, "report_month": month_tag,
                            "parser_version": PARSER_VERSION, "sha256": pdf_hash,
                            "status": "FAILED", "errors": [f"{type(e).__name__}: {e}"]})
            print(f"    FAILED: {e}")

    # Do not partially replace the existing monthly dataset if any input report failed.
    manifest = {"parser_version": PARSER_VERSION, "reports": reports,
                "pdf_count": len(pdf_files),
                "failed_reports": sum(row.get("status") == "FAILED" for row in reports)}
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    if manifest["failed_reports"]:
        print(f"Extraction stopped: {manifest['failed_reports']} report(s) failed. "
              f"See {manifest_path.relative_to(BASE_DIR)}; existing monthly CSVs were preserved.")
        return False

    # CSV replacement begins only after every source report has a parsed result.
    for out_csv, records in staged:
        with open(out_csv, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=list(records[0].keys()))
            writer.writeheader()
            writer.writerows(records)
    return True


def step2_run_pipeline():
    print("\n========================================================")
    print("STEP 2: CLEANING PANEL & COMPUTING RISK SCORES")
    print("========================================================")
    t0 = time.time()
    df = build_full_panel(horizon=1, velocity_window=1)
    out_parquet = PROCESSED_DIR / "full_panel.parquet"
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    df.to_parquet(out_parquet, index=False)

    print(f"Total panel rows: {len(df)}")
    print("\nRisk Band Distribution:")
    for band, count in df["risk_band"].value_counts().items():
        pct = (count / len(df)) * 100
        print(f"  - {band:8s}: {count:5d} ({pct:.1f}%)")

    print(f"\nLabel Summary:")
    print(f"  - Cost revisions recorded:     {(df['cost_revised_up_label'] == 1).sum()} projects")
    print(f"  - Schedule slippages recorded: {(df['schedule_slipped_label'] == 1).sum()} projects")
    print(f"Panel saved to {out_parquet} ({time.time() - t0:.1f}s)")
    return df


def step3_train_models(df):
    print("\n========================================================")
    print("STEP 3: TRAINING EARLY-WARNING AI / ML MODELS")
    print("========================================================")
    t0 = time.time()
    print("\n[A] Training Cost Overrun Predictor...")
    cost_res = train_and_compare(df, "cost_revised_up_label")

    print("\n[B] Training Schedule Slip Predictor...")
    sched_res = train_and_compare(df, "schedule_slipped_label")

    print(f"\nModel training completed in {time.time() - t0:.1f}s")

    # Single source of truth for every accuracy number shown in the UI and docs.
    months = sorted(df["report_month_dt"].dropna().dt.strftime("%Y-%m").unique())
    metrics = {
        "generated_by": "src/run_all.py step 3",
        "months": months,
        "horizon": "next monthly report",
        "evaluation": {
            "training_rows": "scoring_eligible rows with quality_status=VERIFIED and observed next-report labels",
            "project_holdout": "five 80/20 GroupShuffleSplit runs; project IDs do not cross each split",
            "ordered_holdout": "up to the latest three labeled months; train strictly before each test month",
            "selection": "target-specific model with highest mean ordered-test PR-AUC",
            "probabilities_calibrated": False,
            "timeline_proxy": "approval date to target date; reports do not provide a consistent construction start date",
            "global_explanation": "permutation importance on the latest eligible ordered holdout; predictive signal, not causation",
        },
        "cost_revised_up_label": cost_res,
        "schedule_slipped_label": sched_res,
    }
    import json
    with open(PROCESSED_DIR / "model_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)
    print("Wrote data/processed/model_metrics.json")
    return cost_res, sched_res


def step4_export_backend():
    print("\n========================================================")
    print("STEP 4: EXPORTING LATEST SNAPSHOT & KPIS FOR DASHBOARD")
    print("========================================================")
    t0 = time.time()
    export_latest_snapshot()
    print(f"Export completed in {time.time() - t0:.1f}s")


def step5_reload_backend():
    print("\n========================================================")
    print("STEP 5: NOTIFYING NEXT.JS FULL-STACK SERVER")
    print("========================================================")
    ports = [3000, 5001]
    reloaded = False
    for port in ports:
        url = f"http://localhost:{port}/api/reload"
        try:
            req = urllib.request.Request(url, data=b"{}", headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=2) as response:
                if response.status == 200:
                    print(f"  ✓ Next.js server on port {port} successfully reloaded fresh data in-memory!")
                    reloaded = True
                    break
        except Exception:
            continue
    if not reloaded:
        print("  ℹ Next.js server is not currently running on port 3000.")
        print("    (Start it anytime from project root with: npm run dev)")


def main():
    force_pdf = "--force-pdf" in sys.argv
    start_total = time.time()

    print("########################################################")
    print("    PAIMANA AI-POWERED PROJECT MONITORING MASTER RUN")
    print("########################################################")

    # Step 1: Batch PDFs
    if not step1_extract_all_pdfs(force=force_pdf):
        sys.exit(1)

    # Step 2: Build Master Panel
    df = step2_run_pipeline()

    # Step 3: Train Machine Learning Models
    step3_train_models(df)

    # Step 4: Export JSONs for Backend
    step4_export_backend()

    # Step 5: Hot-reload Backend if running
    step5_reload_backend()

    total_time = time.time() - start_total
    print("\n========================================================")
    print(f"🎉 MASTER PIPELINE FINISHED SUCCESSFULLY IN {total_time:.1f}s!")
    print("Backend data is up-to-date and ready for the Dashboard UI.")
    print("========================================================\n")


if __name__ == "__main__":
    main()
