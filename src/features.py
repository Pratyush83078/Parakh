import pandas as pd
import numpy as np

def month_diff(d1, d2):
    if pd.isna(d1) or pd.isna(d2):
        return np.nan
    return (d2.year - d1.year) * 12 + (d2.month - d1.month)

def add_snapshot_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    # These reports provide approval dates consistently, but not construction
    # start dates. Keep that distinction visible in feature names and use the
    # approval date only as a documented timeline proxy.
    df["months_since_approval"] = df.apply(
        lambda r: month_diff(r["approval_date"], r["report_month_dt"]), axis=1)
    df["approval_to_target_m"] = df.apply(
        lambda r: month_diff(r["approval_date"], r["target_doc"]), axis=1)

    # A simple linear timeline proxy, not a contractual baseline schedule.
    safe_duration = df["approval_to_target_m"].replace(0, np.nan).clip(lower=1)
    df["approval_elapsed_frac"] = (df["months_since_approval"] / safe_duration).clip(lower=0, upper=10.0)
    df["expected_progress_pct"] = (df["approval_elapsed_frac"] * 100).clip(upper=100.0)
    df["progress_gap"] = df["physical_progress_pct"] - df["expected_progress_pct"]

    # Safe cost ratios
    safe_original_cost = df["original_cost_cr"].replace(0, np.nan)
    df["cost_overrun_ratio_so_far"] = (
        (df["revised_cost_cr"] - df["original_cost_cr"]) / safe_original_cost
    ).clip(lower=-1.0, upper=20.0)

    safe_revised_cost = df["revised_cost_cr"].replace(0, np.nan)
    df["expenditure_util_pct"] = (
        100.0 * df["cumulative_expenditure_cr"] / safe_revised_cost
    ).clip(lower=0.0, upper=500.0)
    df["spend_vs_progress_gap"] = (
        df["expenditure_util_pct"] - df["physical_progress_pct"]
    ).clip(lower=-100.0, upper=500.0)

    df["doc_slip_months_so_far"] = df.apply(
        lambda r: month_diff(r["target_doc"], r["revised_doc"])
        if pd.notna(r["revised_doc"]) else 0, axis=1)
    df["doc_already_slipped"] = (df["doc_slip_months_so_far"].fillna(0) > 0).astype(int)
    return df

def add_velocity_features(df: pd.DataFrame, window: int = 3) -> pd.DataFrame:
    identity = "project_key" if "project_key" in df else "project_code"
    df = df.sort_values([identity, "report_month_dt"]).copy()
    g = df.groupby(identity)

    df["progress_pct_prev"] = g["physical_progress_pct"].shift(window)
    df["progress_velocity"] = (
        (df["physical_progress_pct"] - df["progress_pct_prev"]) / window
    )

    df["revised_cost_prev"] = g["revised_cost_cr"].shift(1)
    df["cost_revision_flag"] = (df["revised_cost_cr"] > df["revised_cost_prev"]).astype(int)
    df["cost_revision_count_cum"] = g["cost_revision_flag"].cumsum()

    df["revised_doc_prev"] = g["revised_doc"].shift(1)
    df["doc_pushed_flag"] = (df["revised_doc"] > df["revised_doc_prev"]).astype(int)
    df["doc_revision_count_cum"] = g["doc_pushed_flag"].cumsum()

    # Time-aware expanding mean per agency using strictly prior reporting months (Zero Leakage)
    # Agency average at month T = average performance of projects under that agency strictly BEFORE month T.
    # Never includes the current or future reporting months.
    agency_hist_means = {}
    for dt in sorted(df["report_month_dt"].dropna().unique()):
        prior = df[df["report_month_dt"] < dt]
        if len(prior) == 0:
            agency_hist_means[dt] = {}
        else:
            agency_hist_means[dt] = prior.groupby("agency")["cost_overrun_ratio_so_far"].mean().to_dict()

    df["agency_avg_overrun"] = df.apply(
        lambda r: agency_hist_means.get(r["report_month_dt"], {}).get(r["agency"], np.nan),
        axis=1
    )
    return df

def compute_risk_score(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # Explainable rule components bounded 0 to 1 using explicit thresholds.
    # 1. Cost overrun ratio: 0% to 50%+ escalation
    cost_risk = (df["cost_overrun_ratio_so_far"].clip(lower=0, upper=0.50) / 0.50)
    # 2. Schedule slip: 0 to 36 months of delay
    schedule_risk = (df["doc_slip_months_so_far"].clip(lower=0, upper=36) / 36.0)
    # 3. Physical progress gap: negative gap (behind expected progress) 0 to 40%
    progress_risk = ((-df["progress_gap"]).clip(lower=0, upper=40) / 40.0)
    # 4. Expenditure ahead of progress: expenditure util exceeding progress by 0 to 40%
    spend_risk = (df["spend_vs_progress_gap"].clip(lower=0, upper=40) / 40.0)
    # 5. Repeated project timeline / budget revisions: 0 to 3+ revisions
    revisions_total = df["cost_revision_count_cum"].fillna(0) + df["doc_revision_count_cum"].fillna(0)
    revision_risk = (revisions_total.clip(upper=3) / 3.0)

    # Keep missing signals unknown. Renormalize the documented weights over
    # observed components and publish coverage so a missing revised cost cannot
    # silently become zero cost risk.
    weights = {
        "Cost Escalation": 0.30,
        "Schedule Delay": 0.25,
        "Slow Physical Progress": 0.20,
        "Excessive Expenditure": 0.15,
        "Repeated Revisions": 0.10,
    }
    components = pd.DataFrame({
        "Cost Escalation": cost_risk,
        "Schedule Delay": schedule_risk,
        "Slow Physical Progress": progress_risk,
        "Excessive Expenditure": spend_risk,
        "Repeated Revisions": revision_risk,
    }, index=df.index)
    weights_by_component = pd.Series(weights)
    observed_weight = components.notna().mul(weights_by_component).sum(axis=1)
    weighted_risk = components.fillna(0).mul(weights_by_component).sum(axis=1)
    df["risk_coverage_pct"] = (observed_weight / sum(weights.values()) * 100).round(1)
    df["risk_score"] = (100.0 * weighted_risk / observed_weight.replace(0, np.nan))
    df["risk_score"] = df["risk_score"].round(1)
    if "scoring_eligible" in df:
        df.loc[~df["scoring_eligible"].fillna(False), "risk_score"] = np.nan

    df["risk_band"] = pd.cut(
        df["risk_score"],
        bins=[-1, 25, 50, 75, 101],
        labels=["Low", "Medium", "High", "Critical"]
    )

    # Identify primary risk driver for dashboard explainability
    risk_matrix = components.mul(weights_by_component)
    df["primary_risk_driver"] = risk_matrix.idxmax(axis=1)
    if "scoring_eligible" in df:
        df.loc[~df["scoring_eligible"].fillna(False), "primary_risk_driver"] = None

    return df

def add_sector_dummies(df: pd.DataFrame) -> pd.DataFrame:
    df = pd.get_dummies(df, columns=["sector"], prefix="sector", dummy_na=True)
    return df
