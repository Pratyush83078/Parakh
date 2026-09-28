"""Generate an isolated, reproducible PAIMANA extraction and quality audit.

This writes candidate CSVs and a report manifest under
data/raw/paimana_phase1_candidate/ without changing the active monthly CSVs.
OCMS PDFs are listed as deferred rather than silently ignored.
"""
from __future__ import annotations

import csv
import hashlib
import json
import sys
from pathlib import Path

import pdfplumber

BASE_DIR = Path(__file__).resolve().parent.parent
PDF_DIR = BASE_DIR / "data" / "pdfs"
OUTPUT_DIR = BASE_DIR / "data" / "raw" / "paimana_phase1_candidate"
sys.path.insert(0, str(BASE_DIR / "src"))

from pdf_extracter import PARSER_VERSION, _family_and_title, extract_report
from report_utils import month_tag_from_filename


def main() -> int:
    pdfs = sorted(PDF_DIR.rglob("*.pdf"))
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    reports, deferred, errors = [], [], []

    for pdf_path in pdfs:
        source = pdf_path.relative_to(BASE_DIR).as_posix()
        month = month_tag_from_filename(pdf_path.name)
        try:
            with pdfplumber.open(pdf_path) as pdf:
                family, _ = _family_and_title(pdf)
            if family == "ocms":
                deferred.append({"source_pdf": source, "report_month": month,
                                 "reason": "OCMS pass deferred by user priority"})
                continue
            if family != "paimana":
                errors.append({"source_pdf": source, "error": "unrecognized_report_format"})
                continue

            rows, quality = extract_report(str(pdf_path), month)
            quality["source_pdf"] = source
            quality["sha256"] = hashlib.sha256(pdf_path.read_bytes()).hexdigest()
            for row in rows:
                row["source_pdf"] = source
            reports.append(quality)
            if not rows or quality["errors"]:
                errors.append({"source_pdf": source, "error": quality["errors"] or ["no_rows_extracted"]})
                continue
            output_csv = OUTPUT_DIR / f"{month}.csv"
            with output_csv.open("w", newline="", encoding="utf-8") as handle:
                writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
                writer.writeheader()
                writer.writerows(rows)
            print(f"{quality['status']}: {source} — {len(rows)} rows, "
                  f"{quality['rows_review_required']} flagged")
        except Exception as exc:  # Record every input outcome in the manifest.
            errors.append({"source_pdf": source, "error": f"{type(exc).__name__}: {exc}"})

    crosswalk = {}
    csv_paths = sorted(OUTPUT_DIR.glob("*.csv"))
    for path in csv_paths:
        with path.open(newline="", encoding="utf-8") as handle:
            for row in csv.DictReader(handle):
                legacy, official = row.get("legacy_ocms_code"), row.get("project_code")
                if legacy and official:
                    crosswalk.setdefault(legacy, set()).add(official)
    ambiguous = {code: sorted(ids) for code, ids in crosswalk.items() if len(ids) > 1}
    for report in reports:
        output_csv = OUTPUT_DIR / f"{report['report_month']}.csv"
        if not output_csv.exists():
            continue
        with output_csv.open(newline="", encoding="utf-8") as handle:
            rows = list(csv.DictReader(handle))
            fields = list(rows[0]) if rows else []
        flagged = 0
        for row in rows:
            legacy = row.get("legacy_ocms_code")
            if legacy in ambiguous:
                warning_set = set(filter(None, row.get("quality_warnings", "").split(";")))
                warning_set.add("ambiguous_legacy_ocms_reference")
                row["quality_warnings"] = ";".join(sorted(warning_set))
                row["quality_status"] = "REVIEW_REQUIRED"
                flagged += 1
        with output_csv.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=fields)
            writer.writeheader()
            writer.writerows(rows)
        report["ambiguous_legacy_ocms_references"] = {
            code: ambiguous[code] for code in sorted({r.get("legacy_ocms_code") for r in rows} & ambiguous.keys())
        }
        report["rows_review_required"] = sum(r["quality_status"] != "VERIFIED" for r in rows)
        report["warning_counts"]["ambiguous_legacy_ocms_reference"] = flagged
        report["warning_counts"] = {k: v for k, v in report["warning_counts"].items() if v}
        if report["rows_review_required"]:
            report["status"] = "REVIEW_REQUIRED"

    manifest = {
        "parser_version": PARSER_VERSION,
        "scope": "PAIMANA only; OCMS deferred",
        "discovered_pdf_count": len(pdfs),
        "paimana_report_count": len(reports),
        "deferred_reports": deferred,
        "ambiguous_legacy_ocms_references": ambiguous,
        "failed_report_count": len(errors),
        "failed_reports": errors,
        "reports": reports,
    }
    (OUTPUT_DIR / "extraction_quality.json").write_text(
        json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Quality manifest: {OUTPUT_DIR / 'extraction_quality.json'}")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
