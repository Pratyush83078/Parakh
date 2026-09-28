# Project improvement roadmap

Status snapshot: 29 September 2026. This tracks product work; exact counts and metrics live in generated artifacts and linked docs.

## Foundation in place

- The current checkout contains all 17 source reports: four OCMS (March–June 2025) and thirteen PAIMANA (July 2025–July 2026). The full extraction run can be reproduced from `data/pdfs/` and its hash-checked CSV cache.
- The pipeline records a per-report outcome, preserves parseable warned rows, and exports PDF/page provenance. Current run: 25,180 extracted rows; 915 warning rows; 10 reports `REVIEW_REQUIRED`, 7 `VERIFIED`.
- The dashboard presents separate current-state rule scores and next-report model rankings, source references, signal coverage, and caveats.

## Phase 1 — trustworthy source data

Continue auditing each supported report layout. The four OCMS revised-cost reconciliations remain unresolved, so those outputs stay review-required. Newly added PDFs need a manifest entry, source-page spot checks, and report-level reconciliation. Match projects across months by official ID only.

## Phase 2 — dual engines

The deterministic engine describes current reported pressure using visible rule components; missing inputs are excluded and remaining weights renormalized. The model engine compares logistic regression and gradient boosting using project-group and chronological holdouts. Schedule performance is preliminary; the latest cost model is weak. Outputs are uncalibrated rankings, not reliable individual probabilities. Repeat time-forward evaluation over more transitions before operational claims.

## Phase 3 — reviewer workflow

1. Add a row-level review queue with warning, source PDF/page, extracted value, and disposition.
2. Record interventions and outcomes so warnings can be evaluated against decisions.
3. Add authentication and roles before storing reviewer actions; define notification ownership and escalation rules first.
4. Pilot with analysts and measure review time, false alerts, and lead time before claiming impact.

## Later, evidence-dependent work

Evaluate SHAP or other per-project explanations against the rule drivers already visible. Evaluate additional models, including proposed non-generative models, on the same held-out protocol before adding dependencies. Month-range controls, assistants, notifications, and visual polish follow trustworthy review workflows.

## References

- [Architecture](docs/01_ARCHITECTURE_AND_FLOW.md) · [Model methodology](docs/02_MODEL_AND_METHODOLOGY.md) · [Extraction audit](docs/PAIMANA_EXTRACTION_PHASE1_AUDIT.md) · [Dashboard guide](docs/03_DASHBOARD_AND_METRICS_GUIDE.md)
