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

try:  # Optional at import time; declared in requirements.txt.
    from xgboost import XGBClassifier
except ImportError:  # pragma: no cover
    XGBClassifier = None

try:  # Optional at import time; declared in requirements.txt.
    import shap
except ImportError:  # pragma: no cover
    shap = None

FEATURES = [
    "original_cost_cr", "months_since_approval", "approval_to_target_m",
    "approval_elapsed_frac", "progress_gap", "expenditure_util_pct",
    "spend_vs_progress_gap", "doc_already_slipped", "doc_slip_months_so_far",
    "progress_velocity", "cost_revision_count_cum", "doc_revision_count_cum",
    "agency_avg_overrun",
]

SHAP_TOP_K = 5
EARLY_STOPPING_ROUNDS = 40
SHAP_EXPORT_PATH = Path("data/processed/shap_explanations.json")


class _EarlyStoppedModel:
    """Imputer + early-stopped XGBoost with the estimator API used here."""

    def __init__(self, imputer, classifier):
        self.imputer = imputer
        self.classifier = classifier

    def predict(self, X):
        return self.classifier.predict(self.imputer.transform(X))

    def predict_proba(self, X):
        return self.classifier.predict_proba(self.imputer.transform(X))


def _pipeline(kind):
    steps = [("imputer", SimpleImputer(strategy="median"))]
    if kind == "logistic_regression":
        steps.extend([
            ("scaler", StandardScaler()),
            # No class reweighting: retain prevalence-based probabilities.
            ("clf", LogisticRegression(max_iter=1000, random_state=42)),
        ])
    elif kind == "xgboost":
        if XGBClassifier is None:
            raise ImportError("xgboost is required for the 'xgboost' model kind")
        steps.append(("clf", XGBClassifier(
            # Modest regularisation for a small tabular panel; CPU only.
            n_estimators=400, learning_rate=0.05, max_depth=3,
            min_child_weight=5, subsample=0.9, colsample_bytree=0.9,
            reg_lambda=1.0, tree_method="hist", eval_metric="logloss",
            random_state=42, n_jobs=4, verbosity=0,
        )))
    else:
        steps.append(("clf", GradientBoostingClassifier(random_state=42)))
    return Pipeline(steps)


def _fit_model(kind, X_train, y_train, X_val=None, y_val=None):
    """Fit one model; xgboost may early-stop on the temporal validation slice.

    The group-held-out and production fits are unchanged (full 400 rounds);
    only the ordered monthly evaluation passes a validation slice, and only
    when that slice has both classes.
    """
    pipeline = _pipeline(kind)
    can_stop = (kind == "xgboost" and X_val is not None and len(X_val) > 0
                and y_val is not None and y_val.nunique() == 2)
    if not can_stop:
        return pipeline.fit(X_train, y_train)
    imputer = pipeline.named_steps["imputer"]
    classifier = XGBClassifier(**{
        **pipeline.named_steps["clf"].get_params(),
        "early_stopping_rounds": EARLY_STOPPING_ROUNDS,
    })
    classifier.fit(
        imputer.fit_transform(X_train), y_train,
        eval_set=[(imputer.transform(X_val), y_val)],
        verbose=False,
    )
    return _EarlyStoppedModel(imputer, classifier)


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


def _importance(model, X, y, feature_names=None):
    if len(X) < 20 or y.nunique() != 2 or int(y.sum()) < 5:
        return {}
    result = permutation_importance(
        model, X, y, scoring="average_precision", n_repeats=3, random_state=42,
    )
    names = list(X.columns) if hasattr(X, "columns") else list(feature_names or [])
    ranked = sorted(zip(names, result.importances_mean), key=lambda item: item[1], reverse=True)
    return {name: round(float(score), 4) for name, score in ranked[:8]}


def _positive_class_values(shap_values):
    """Reduce shap output shapes to a (n_rows, n_features) positive-class array."""
    if isinstance(shap_values, list):  # old shap: [class0, class1]
        shap_values = shap_values[1]
    if isinstance(shap_values, np.ndarray) and shap_values.ndim == 3:  # new shap
        shap_values = shap_values[:, :, -1]
    return shap_values


def _shap_explanations(pipeline, data, features, months):
    """Per-project SHAP drivers from the production xgboost model.

    Explanations are attached to each project's latest verified report row so
    the dossier can answer "why does the model say this *now*". Returns the
    per-project payload plus the global mean |SHAP| importance.
    """
    if shap is None:
        return {}, {}
    classifier = pipeline.named_steps["clf"]
    imputer = pipeline.named_steps["imputer"]
    X_imputed = imputer.transform(data[features])
    frame = pd.DataFrame(X_imputed, columns=features)
    background = shap.sample(frame, min(100, len(frame)), random_state=42)
    explainer = shap.TreeExplainer(
        classifier, data=background, feature_perturbation="interventional",
    )
    values = _positive_class_values(explainer.shap_values(frame))
    if values is None:
        return {}, {}

    mean_abs = np.abs(values).mean(axis=0)
    global_importance = {
        name: round(float(score), 4)
        for name, score in sorted(zip(features, mean_abs), key=lambda item: item[1], reverse=True)
    }

    positions = _latest_report_positions(data, months)
    if not positions:
        return {}, {}

    code_series = data["project_code"].astype(str).reset_index(drop=True)
    month_series = pd.to_datetime(data["report_month_dt"]).dt.strftime("%Y-%m").reset_index(drop=True)
    proba = classifier.predict_proba(X_imputed)[:, 1]
    base_value = explainer.expected_value
    if isinstance(base_value, (list, np.ndarray)):
        base_value = base_value[-1]

    explanations = {}
    for position in positions:
        row = values[position]
        top = sorted(zip(features, row), key=lambda item: abs(item[1]), reverse=True)[:SHAP_TOP_K]
        explanations[code_series.iloc[position]] = {
            "report_month": month_series.iloc[position],
            "risk_probability": round(float(proba[position]), 4),
            "base_value": round(float(base_value), 4),
            "top_drivers": [
                {
                    "feature": name,
                    "shap": round(float(value), 4),
                    # Imputed value: what the model actually saw for this row.
                    "value": round(float(frame[name].iloc[position]), 4),
                }
                for name, value in top
            ],
        }
    return explanations, global_importance


def _latest_report_positions(data, months):
    """Row positions of each project's latest report, preferring the newest month."""
    frame = data[["project_code", "report_month_dt"]].copy().reset_index(drop=True)
    frame["position"] = np.arange(len(frame))
    if months is not None and len(months):
        latest = pd.Timestamp(months[-1])
        latest_rows = frame[pd.to_datetime(frame["report_month_dt"]) == latest]
        if len(latest_rows):
            return sorted(int(p) for p in latest_rows["position"])
    # Fallback: each project's last chronologically sorted row.
    ordered = frame.sort_values("report_month_dt").groupby("project_code", as_index=False).tail(1)
    return sorted(int(p) for p in ordered["position"])


def _merge_shap_export(target, explanations):
    """Persist per-project explanations for both targets in one JSON file."""
    payload = {}
    if SHAP_EXPORT_PATH.exists():
        try:
            payload = json.loads(SHAP_EXPORT_PATH.read_text())
        except (json.JSONDecodeError, OSError):
            payload = {}
    payload[target] = explanations
    SHAP_EXPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    SHAP_EXPORT_PATH.write_text(json.dumps(payload, indent=2))


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
    model_names = ("logistic_regression", "gradient_boosting", "xgboost")
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
            model = _fit_model(name, X_train, y_train)
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
            model = _fit_model(name, X_train, y_train, X_val=X_test, y_val=y_test)
            probability = model.predict_proba(X_test)[:, 1]
            temporal_rows[name].append({**_metrics(y_test, probability), "test_month": row["test_month"]})
            if test_month == months[-1]:
                if hasattr(model, "classifier"):
                    # Early-stopped xgboost wrapper: score the fitted classifier
                    # on the same imputed matrix it predicts from.
                    importance_by_model[name] = _importance(
                        model.classifier, model.imputer.transform(X_test), y_test,
                        feature_names=features,
                    )
                else:
                    importance_by_model[name] = _importance(model, X_test, y_test)
        temporal_months.append(row)

    # Train deployable estimators on every eligible labeled row only after all
    # holdout measurements are complete.
    production_features = _available_features(data[FEATURES])
    production_models = {}
    for name in model_names:
        production_model = _pipeline(name).fit(data[production_features], y)
        production_models[name] = production_model
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
    explanations, shap_global = ({}, {})
    if selected_model == "xgboost" and production_models.get("xgboost") is not None:
        explanations, shap_global = _shap_explanations(
            production_models["xgboost"], data, production_features, months,
        )
        if explanations:
            _merge_shap_export(target, explanations)
    temporal_summary = {
        "test_month": temporal_months[-1]["test_month"] if temporal_months else None,
        "months": temporal_months,
        "models": temporal_model_summary,
        "rule_score": temporal_rule_summary,
        **temporal_model_summary,
        "rule_score_roc_auc": temporal_rule_summary.get("roc_auc"),
        "selected_model_permutation_importance": importance_by_model.get(selected_model, {}),
        "shap_global_importance": shap_global,
        "xgboost_early_stopping_rounds": EARLY_STOPPING_ROUNDS if XGBClassifier is not None else None,
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
    if explanations:
        print(f"  SHAP: {len(explanations)} project explanations -> {SHAP_EXPORT_PATH}")
    return result


if __name__ == "__main__":
    panel = pd.read_parquet("data/processed/full_panel.parquet")
    results = {target: train_and_compare(panel, target) for target in
               ("cost_revised_up_label", "schedule_slipped_label")}
    # Same envelope as src/run_all.py step 3, so the frontend can consume the
    # standalone output too (it reads metrics.months / metrics.horizon).
    metrics = {
        "generated_by": "src/model_train.py",
        "months": sorted(
            panel["report_month_dt"].dropna().dt.strftime("%Y-%m").unique()
        ),
        "horizon": "next monthly report",
        "evaluation": {
            "training_rows": "scoring_eligible rows with quality_status=VERIFIED and observed next-report labels",
            "project_holdout": "five 80/20 GroupShuffleSplit runs; project IDs do not cross each split",
            "ordered_holdout": "up to the latest three labeled months; train strictly before each test month",
            "selection": "target-specific model with highest mean ordered-test PR-AUC",
            "probabilities_calibrated": False,
            "timeline_proxy": "approval date to target date; reports do not provide a consistent construction start date",
            "global_explanation": "permutation importance plus global mean |SHAP| on the production xgboost model; predictive signal, not causation",
        },
        **results,
    }
    Path("data/processed/model_metrics.json").write_text(json.dumps(metrics, indent=2))
