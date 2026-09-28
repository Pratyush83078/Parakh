import pandas as pd


def build_labels(df, horizon=1):
    """Label whether a project's cost or completion date changes `horizon` months later.

    Fixes over the previous version:
    - Uses the *effective* completion date (revised if present, else original target) and
      the effective cost. Before, projects with no revised date had NaT and were silently
      dropped from the schedule label, so the model only ever saw already-slipped projects.
    - Matches the future row by calendar month, not by row position, so a project that
      skips a report is not compared against the wrong month.
    """
    df = df.sort_values(["project_code", "report_month_dt"]).copy()
    df["effective_doc"] = df["revised_doc"].fillna(df["target_doc"])
    df["effective_cost_cr"] = df["revised_cost_cr"].fillna(df["original_cost_cr"])

    future = df[["project_code", "report_month_dt", "effective_doc", "effective_cost_cr"]].copy()
    future["report_month_dt"] = future["report_month_dt"] - pd.DateOffset(months=horizon)
    future = future.rename(columns={"effective_doc": "doc_future", "effective_cost_cr": "cost_future"})
    df = df.merge(future, on=["project_code", "report_month_dt"], how="left")

    has_cost = df["cost_future"].notna() & df["effective_cost_cr"].notna()
    has_doc = df["doc_future"].notna() & df["effective_doc"].notna()
    df["cost_revised_up_label"] = (df["cost_future"] > df["effective_cost_cr"] * 1.001).astype("Int64").where(has_cost)
    df["schedule_slipped_label"] = (df["doc_future"] > df["effective_doc"]).astype("Int64").where(has_doc)
    return df
