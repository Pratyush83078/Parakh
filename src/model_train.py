import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.metrics import roc_auc_score, average_precision_score, classification_report
import joblib

from sklearn.model_selection import GroupShuffleSplit
import json

FEATURES = [
    "original_cost_cr", "planned_duration_m", "age_m", "elapsed_frac",
    "progress_gap", "expenditure_util_pct", "spend_vs_progress_gap",
    "doc_already_slipped", "doc_slip_months_so_far", "progress_velocity",
    "cost_revision_count_cum", "doc_revision_count_cum", "agency_avg_overrun",
]

def train_and_compare(df, target):
    # Handle infinite values safely and drop rows without target labels
    df_clean = df.replace([np.inf, -np.inf], np.nan)
    data = df_clean.dropna(subset=[target]).copy()
    X = data[FEATURES]
    y = data[target].astype(int)
    groups = data["project_code"]

    # 1. LEAK-FREE GROUP VALIDATION: No project appears in both train and test
    gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_idx, test_idx = next(gss.split(X, y, groups=groups))

    X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
    y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

    # Verify zero project leakage
    train_projects = set(groups.iloc[train_idx])
    test_projects = set(groups.iloc[test_idx])
    overlap = train_projects.intersection(test_projects)
    assert len(overlap) == 0, f"Critical Leakage: {len(overlap)} projects overlap!"

    print(f"\n[LEAK-FREE GROUP VALIDATION] Evaluated on {len(test_projects)} completely unseen projects:")
    print(f"  - Training records: {len(X_train)} ({len(train_projects)} projects, {y_train.sum()} positives)")
    print(f"  - Testing records:  {len(X_test)} ({len(test_projects)} projects, {y_test.sum()} positives)")

    models = [
        (
            "logistic_regression",
            Pipeline([
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler()),
                ("clf", LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42)),
            ]),
        ),
        (
            "gradient_boosting",
            Pipeline([
                ("imputer", SimpleImputer(strategy="median")),
                ("clf", GradientBoostingClassifier(random_state=42)),
            ]),
        ),
    ]

    results = {"group_split": {}, "temporal_split": {}}
    for name, model in models:
        model.fit(X_train, y_train)
        proba = model.predict_proba(X_test)[:, 1]
        auc = roc_auc_score(y_test, proba)
        ap = average_precision_score(y_test, proba)
        results["group_split"][name] = {"roc_auc": round(auc, 3), "pr_auc": round(ap, 3)}

        print(f"\n=== {name.upper()} (GroupSplit) === | ROC-AUC: {auc:.3f} | PR-AUC: {ap:.3f}")
        y_pred = model.predict(X_test)
        print(classification_report(y_test, y_pred, digits=3))

        model_path = f"data/processed/{target}_{name}.joblib"
        joblib.dump(model, model_path)
        print(f"Saved model to {model_path}")

    # 2. TEMPORAL VALIDATION: Train on older months, evaluate on latest labeled month
    months = sorted(data["report_month_dt"].dropna().unique())
    if len(months) >= 2:
        latest_month = months[-1]
        t_train_mask = data["report_month_dt"] < latest_month
        t_test_mask = data["report_month_dt"] == latest_month

        X_t_train, y_t_train = data.loc[t_train_mask, FEATURES], data.loc[t_train_mask, target].astype(int)
        X_t_test, y_t_test = data.loc[t_test_mask, FEATURES], data.loc[t_test_mask, target].astype(int)

        if y_t_train.sum() > 0 and y_t_test.sum() > 0:
            print(f"\n[TEMPORAL SPLIT] Train: < {str(latest_month)[:10]} | Test: {str(latest_month)[:10]}")
            for name, model in models:
                model.fit(X_t_train, y_t_train)
                t_proba = model.predict_proba(X_t_test)[:, 1]
                t_auc = roc_auc_score(y_t_test, t_proba)
                t_ap = average_precision_score(y_t_test, t_proba)
                results["temporal_split"][name] = {"roc_auc": round(t_auc, 3), "pr_auc": round(t_ap, 3)}
                print(f"  - {name:20s} | Temporal ROC-AUC: {t_auc:.3f} | Temporal PR-AUC: {t_ap:.3f}")

    return results

if __name__ == "__main__":
    df = pd.read_parquet("data/processed/full_panel.parquet")
    print("==================================================")
    print("1. COST OVERRUN EARLY-WARNING MODEL")
    print("==================================================")
    train_and_compare(df, "cost_revised_up_label")

    print("\n==================================================")
    print("2. SCHEDULE SLIP EARLY-WARNING MODEL")
    print("==================================================")
    train_and_compare(df, "schedule_slipped_label")