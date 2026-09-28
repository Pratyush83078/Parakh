# Current findings and next steps

Last reviewed: 29 September 2026. Generated artifacts under `data/processed/` are the source of exact values.

## Evidence

- **Reports:** all 17 source PDFs are present, covering March 2025 through July 2026: four OCMS and thirteen PAIMANA.
- **Extraction:** current run has 25,180 rows, 915 warning rows, 10 `REVIEW_REQUIRED` outputs, and 7 `VERIFIED` outputs. The four OCMS revised-cost reconciliations remain unresolved. See the [report audit](PAIMANA_EXTRACTION_PHASE1_AUDIT.md).
- **Training cohort:** 18,257 verified, scoring-eligible labeled project-month rows and 3,794 projects per target.
- **Chronological holdout:** June 2026 predicting July 2026. Schedule gradient boosting averages ROC-AUC 0.777, PR-AUC 0.376 across April–June (268 positives / 1,732 rows in June). Cost logistic regression: ROC-AUC 0.672, PR-AUC 0.131 (72 positives / 1,732 rows); a single temporal month, so still weak evidence for decisions. Scores are uncalibrated.
- **Explanations:** rule components and coverage are shown; global predictive signals use permutation importance. SHAP is not currently used.

## Decisions and priorities

1. Keep warned rows visible and keep unverified data out of verified risk results. Treat warnings as review evidence, not automatic proof of extraction error.
2. Do not guess cross-month identity when official IDs are missing or ambiguous.
3. Keep the current-state rule score distinct from experimental next-report model rankings. Neither makes an intervention decision.
4. Resolve OCMS reconciliation and improve row-level review evidence.
5. Extend repeated chronological evaluation before presenting models as decision-ready.
6. Build reviewer disposition and intervention tracking before authentication and notifications.

Do not claim live MoSPI integration, calibrated probabilities, measured impact, or production readiness. See the [project roadmap](../PROJECT_IMPROVEMENT_ROADMAP.md), [model methodology](02_MODEL_AND_METHODOLOGY.md), and [dashboard guide](03_DASHBOARD_AND_METRICS_GUIDE.md).
