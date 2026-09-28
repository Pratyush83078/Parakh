import pandas as pd
import numpy as np
import joblib
import json
from pathlib import Path

def export_latest_snapshot():
    df = pd.read_parquet("data/processed/full_panel.parquet")
    df = df.replace([np.inf, -np.inf], np.nan)
    # Only projects present in the latest report. Projects that dropped out earlier
    # (completed or removed) must not inflate the live portfolio totals.
    latest_month = df["report_month_dt"].max()
    latest = df[df["report_month_dt"] == latest_month].copy()

    # Core metadata & monitoring metrics
    base_cols = [
        "project_code", "project_name", "agency", "state", "ministry",
        "report_month_dt", "original_cost_cr", "revised_cost_cr",
        "cumulative_expenditure_cr", "physical_progress_pct",
        "cost_overrun_ratio_so_far", "doc_slip_months_so_far",
        "progress_gap", "risk_score", "risk_band", "primary_risk_driver"
    ]
    # Filter available columns
    available_cols = [c for c in base_cols if c in latest.columns]
    export = latest[available_cols].copy()

    # Predict early warning risk probabilities
    for target in ["cost_revised_up_label", "schedule_slipped_label"]:
        model_file = f"data/processed/{target}_gradient_boosting.joblib"
        if Path(model_file).exists():
            model = joblib.load(model_file)
            feat_df = latest[model.feature_names_in_]
            proba = model.predict_proba(feat_df)[:, 1]
            export[f"{target}_pred_proba"] = proba.round(4)
            export[f"{target.replace('_label', '')}_risk_pct"] = (proba * 100).round(1)

    out_file = "data/processed/latest_snapshot.json"
    export.to_json(out_file, orient="records", date_format="iso", indent=2)
    print(f"Exported {len(export)} projects to {out_file}")

    # Generate high-level KPI summary for dashboard overview
    kpi_summary = {
        "report_month": str(latest_month)[:7],
        "total_projects": int(len(export)),
        "projects_left_since_first_report": int(df["project_code"].nunique() - len(export)),
        "unique_projects_all_reports": int(df["project_code"].nunique()),
        "panel_rows": int(len(df)),
        "projects_per_month": {
            str(m)[:7]: int(n) for m, n in df.groupby("report_month_dt")["project_code"].nunique().sort_index().items()
        },
        "total_original_cost_cr": round(float(export["original_cost_cr"].sum()), 2),
        "total_revised_cost_cr": round(float(export["revised_cost_cr"].sum()), 2),
        "total_expenditure_cr": round(float(export["cumulative_expenditure_cr"].sum()), 2),
        "total_cost_overrun_cr": round(float((export["revised_cost_cr"] - export["original_cost_cr"]).clip(lower=0).sum()), 2),
        "risk_band_counts": export["risk_band"].value_counts().to_dict(),
        "primary_risk_drivers": export["primary_risk_driver"].value_counts().to_dict() if "primary_risk_driver" in export.columns else {},
    }
    kpi_file = "data/processed/portfolio_kpis.json"
    with open(kpi_file, "w") as f:
        json.dump(kpi_summary, f, indent=2)
    print(f"Exported portfolio KPIs to {kpi_file}")

if __name__ == "__main__":
    export_latest_snapshot()