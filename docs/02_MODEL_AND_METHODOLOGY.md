# Model methodology

The prototype separates current condition from future-event ranking. Exact generated values are in [`model_metrics.json`](../data/processed/model_metrics.json); rerun the pipeline before quoting them after a data or code change.

## Engine 1: current-state rule score

The deterministic score combines cost escalation, schedule delay, physical-progress gap, expenditure-to-progress divergence, and revision history using explicit weights in `src/features.py`. The dashboard shows component contributions and coverage. If an input is missing, it is excluded and the available weights are renormalized; this is disclosed in the project view. The score describes reported condition and is not a probability of failure.

## Engine 2: next-report event ranking

Two binary targets are built from a project's next available monthly record:

- `cost_revised_up_label`: revised cost increases beyond the label threshold.
- `schedule_slipped_label`: revised completion date moves later.

The pipeline compares logistic regression and gradient boosting with project-group and chronological evaluations. June 2026 is the latest temporal test month, predicting July 2026. That month has 1,732 rows: 72 cost events and 268 schedule events. Schedule evaluation also averages April–June test months; cost evaluation has only June because earlier months lack enough positives for the configured evaluation.

| Target | Selected model | June holdout ROC-AUC | PR-AUC | Event rate | Interpretation |
|---|---|---:|---:|---:|---|
| Cost revision | Logistic regression | 0.672 | 0.131 | 4.2% | One test month; weak evidence, not decision-ready |
| Schedule slip | Gradient boosting | 0.777 | 0.376 | 18.1% mean | Preliminary ranking signal across three test months |

The metrics artifact also contains group-held-out comparisons. Those test generalization to unseen projects, not performance on future months. ROC-AUC measures ranking discrimination; PR-AUC should be read against the event rate, especially for rare cost events. Neither metric establishes calibrated probabilities or intervention impact.

## Inputs and explanations

Features are derived from reported project cost, expenditure, dates, progress, month-to-month changes, and revision history. The deterministic engine explains a score through its rule components. The predictive model currently exposes global permutation-importance signals; it does not currently use SHAP for per-project attribution. Do not describe model feature importance as a causal reason.

## Data eligibility and limitations

Only verified, scoring-eligible rows are exported as verified risk results. Rows with quality warnings remain visible but are marked; missing official IDs are excluded from the longitudinal model panel. Results depend on the available report history and extraction quality. Current outputs are uncalibrated ranking scores, not reliable individual probabilities.

The most valuable next model work is additional audited history and repeated time-forward validation, followed by uncertainty estimates and calibration checks. Try another algorithm or explainability package only if it improves held-out evidence and remains understandable.
