"""Train and evaluate the explainable early-warning models."""
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.impute import SimpleImputer
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, brier_score_loss, roc_auc_score
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

FEATURES = [
    "original_cost_cr", "months_since_approval", "approval_to_target_m",
    "approval_elapsed_frac", "progress_gap", "expenditure_util_pct",
    "spend_vs_progress_gap", "doc_already_slipped", "doc_slip_months_so_far",
    "progress_velocity", "cost_revision_count_cum", "doc_revision_count_cum",
    "agency_avg_overrun",
]


def _pipeline(kind):
    steps = [("imputer", SimpleImputer(strategy="median"))]
    if kind == "logistic_regression":
        steps.extend([
            ("scaler", StandardScaler()),
            # No class reweighting: retain prevalence-based probabilities.
            ("clf", LogisticRegression(max_iter=1000, random_state=42)),
        ])
    else:
        steps.append(("clf", GradientBoostingClassifier(random_state=42)))
    return Pipeline(steps)


def _metrics(y, probability, *, is_probability=True):
    prevalence = float(y.mean())
    result = {
        "roc_auc": round(float(roc_auc_score(y, probability)), 3) if y.nunique() == 2 else None,
        "pr_auc": round(float(average_precision_score(y, probability)), 3),
        "positive_rate": round(prevalence, 4),
        "pr_lift_over_prevalence": round(float(average_precision_score(y, probability) / prevalence), 2)
        if prevalence else None,
    }
    if is_probability:
        result["brier_score"] = round(float(brier_score_loss(y, probability)), 4)
    return result


def _mean_metrics(rows):
    keys = ("roc_auc", "pr_auc", "positive_rate", "pr_lift_over_prevalence", "brier_score")
    result = {}
    for key in keys:
        values = [row[key] for row in rows if row.get(key) is not None]
        if values:
            result[key] = round(float(np.mean(values)), 3)
            if len(values) > 1:
                result[f"{key}_std"] = round(float(np.std(values, ddof=1)), 3)
    return result


def _eligible_data(df, target):
    data = df.copy()
    numeric = data.select_dtypes(include=[np.number]).columns
    data.loc[:, numeric] = data.loc[:, numeric].replace([np.inf, -np.inf], np.nan)
    data = data.dropna(subset=[target]).copy()
    if "scoring_eligible" in data:
        data = data[data["scoring_eligible"].fillna(False)]
    # Unverified extraction rows stay in the project data, but do not train the
    # model. This makes the training cohort auditable from quality_status.
    if "quality_status" in data:
        data = data[data["quality_status"].eq("VERIFIED")]
    return data


def _available_features(frame):
    return [column for column in FEATURES if column in frame and frame[column].notna().any()]


def _importance(model, X, y):
    if len(X) < 20 or y.nunique() != 2 or int(y.sum()) < 5:
        return {}
    result = permutation_importance(
        model, X, y, scoring="average_precision", n_repeats=3, random_state=42,
    )
    ranked = sorted(zip(X.columns, result.importances_mean), key=lambda item: item[1], reverse=True)
    return {name: round(float(score), 4) for name, score in ranked[:8]}


def train_and_compare(df, target):
    data = _eligible_data(df, target)
    if data.empty:
        raise ValueError(f"No verified, scoring-eligible rows have labels for {target}")
    group_column = "project_key" if "project_key" in data else "project_code"
    groups = data[group_column].astype(str)
    y = data[target].astype(int)

    # Choose features from training data, so wholly empty columns never reach
    # sklearn's imputer and cannot create misleading zero-information inputs.
    group_splits = GroupShuffleSplit(n_splits=5, test_size=0.2, random_state=42)
    model_names = ("logistic_regression", "gradient_boosting")
    group_scores = {name: [] for name in model_names}
    rule_scores = []
    split_sizes = []

    for train_idx, test_idx in group_splits.split(data, y, groups=groups):
        train, test = data.iloc[train_idx], data.iloc[test_idx]
        features = _available_features(train[FEATURES])
        X_train, X_test = train[features], test[features]
        y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
        split_sizes.append({
            "n_test_projects": int(groups.iloc[test_idx].nunique()),
            "n_test_rows": int(len(test_idx)),
            "n_test_positives": int(y_test.sum()),
        })
        rule_scores.append(_metrics(y_test, test["risk_score"].fillna(0), is_probability=False))
        for name in model_names:
            model = _pipeline(name).fit(X_train, y_train)
            group_scores[name].append(_metrics(y_test, model.predict_proba(X_test)[:, 1]))

    # The ordered test mimics deployment on already-known projects: the model
    # only sees earlier reports, then scores each of the last three labeled months.
    months = sorted(data["report_month_dt"].dropna().unique())
    temporal_rows = {name: [] for name in model_names}
    temporal_months = []
    importance_by_model = {}
    for test_month in months[-3:]:
        train = data[data["report_month_dt"] < test_month]
        test = data[data["report_month_dt"] == test_month]
        if (len(train) < 50 or train[target].nunique() < 2
                or test[target].nunique() < 2 or int(test[target].sum()) < 5):
            continue
        features = _available_features(train[FEATURES])
        X_train, X_test = train[features], test[features]
        y_train, y_test = train[target].astype(int), test[target].astype(int)
        row = {"test_month": pd.Timestamp(test_month).strftime("%Y-%m"),
               "n_test_rows": int(len(test)), "n_test_positives": int(y_test.sum()),
               "positive_rate": round(float(y_test.mean()), 4)}
        rule = _metrics(y_test, test["risk_score"].fillna(0), is_probability=False)
        row["rule_score"] = rule
        for name in model_names:
            model = _pipeline(name).fit(X_train, y_train)
            probability = model.predict_proba(X_test)[:, 1]
            temporal_rows[name].append({**_metrics(y_test, probability), "test_month": row["test_month"]})
            if test_month == months[-1]:
                importance_by_model[name] = _importance(model, X_test, y_test)
        temporal_months.append(row)

    # Train deployable estimators on every eligible labeled row only after all
    # holdout measurements are complete.
    production_features = _available_features(data[FEATURES])
    for name in model_names:
        production_model = _pipeline(name).fit(data[production_features], y)
        joblib.dump(production_model, f"data/processed/{target}_{name}.joblib")

    group_model_summary = {name: _mean_metrics(group_scores[name]) for name in model_names}
    group_rule_summary = _mean_metrics(rule_scores)
    group_summary = {
        **(split_sizes[-1] if split_sizes else {}),
        "n_splits": len(split_sizes),
        "n_rows_used": int(len(data)),
        "n_projects_used": int(groups.nunique()),
        "n_positive_labels": int(y.sum()),
        "positive_rate": round(float(y.mean()), 4),
        "models": group_model_summary,
        "rule_score": group_rule_summary,
        # Keep direct keys used by the existing dashboard while making the
        # nested, explicitly named structure available to new consumers.
        **group_model_summary,
        "rule_score_roc_auc": group_rule_summary.get("roc_auc"),
    }
    temporal_model_summary = {name: _mean_metrics(rows) for name, rows in temporal_rows.items()}
    temporal_rule_summary = _mean_metrics([row["rule_score"] for row in temporal_months])
    selected_model = max(
        model_names,
        key=lambda name: temporal_model_summary.get(name, {}).get("pr_auc", -1),
    )
    temporal_summary = {
        "test_month": temporal_months[-1]["test_month"] if temporal_months else None,
        "months": temporal_months,
        "models": temporal_model_summary,
        "rule_score": temporal_rule_summary,
        **temporal_model_summary,
        "rule_score_roc_auc": temporal_rule_summary.get("roc_auc"),
        "selected_model_permutation_importance": importance_by_model.get(selected_model, {}),
    }
    result = {
        "n_rows_excluded_unverified_or_ineligible": int(
            len(df.dropna(subset=[target])) - len(data)
        ),
        "selected_model": selected_model,
        "features": production_features,
        "group_split": group_summary,
        "temporal_split": temporal_summary,
    }
    print(f"\n[{target}] verified cohort: {len(data)} rows, {groups.nunique()} projects, "
          f"{int(y.sum())} positive labels ({y.mean():.2%}); "
          f"features: {', '.join(production_features)}")
    for name in model_names:
        summary = group_summary["models"][name]
        print(f"  {name}: project-held-out ROC-AUC={summary.get('roc_auc')}, "
              f"PR-AUC={summary.get('pr_auc')} (prevalence={summary.get('positive_rate')})")
    if temporal_months:
        selected = temporal_summary["models"][selected_model]
        print(f"  ordered holdout through {temporal_summary['test_month']}: "
              f"{selected.get('roc_auc')} ROC-AUC, {selected.get('pr_auc')} PR-AUC "
              f"(selected: {selected_model})")
    return result


if __name__ == "__main__":
    panel = pd.read_parquet("data/processed/full_panel.parquet")
    results = {target: train_and_compare(panel, target) for target in
               ("cost_revised_up_label", "schedule_slipped_label")}
    Path("data/processed/model_metrics.json").write_text(json.dumps(results, indent=2))
