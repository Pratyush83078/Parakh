# SIH 26103: capability and evidence

PARAKH is a working research prototype for reviewing central infrastructure project reports. It is not a live MoSPI service, and it does not dispatch government alerts or recommend interventions.

## What the prototype demonstrates

- Ingestion of the 17 PDFs currently in the repository, spanning OCMS and PAIMANA layouts, with report outcomes and row-level source references.
- A visible quality state that preserves parseable warnings and identifies outputs requiring review. Four OCMS revised-cost reconciliations remain unresolved.
- A deterministic current-state score with component signals and missing-input coverage.
- Experimental next-report cost and schedule rankings, evaluated against both unseen-project and chronological splits.
- A Next.js interface for portfolio search, project inspection, ministry comparisons, and source report/page review.

## Evidence and limits to state plainly

The latest chronological holdout is June 2026 predicting July. Schedule gradient boosting averages ROC-AUC 0.777 and PR-AUC 0.376 across three ordered test months. The June month itself has 1,732 rows and 268 positive schedule events. Cost logistic regression has ROC-AUC 0.672 and PR-AUC 0.131 on that June test (72 positive events); this is one month only and is not decision-ready evidence. Model outputs are uncalibrated rankings, not dependable probabilities.

The rule score is interpretable but its weights are explicit design choices. Rule drivers show which configured signals contribute; they do not prove real-world causes. Quality flags require human review. No pilot impact has been measured.

## Next work

Resolve source-data reconciliation, repeat chronological model evaluation over more months, add a reviewer disposition flow, and track intervention outcomes. Authentication and notifications should follow defined reviewer roles and escalation rules. Consider new explainability or model packages only when held-out evidence justifies them.

For implementation and exact generated values, see [architecture](01_ARCHITECTURE_AND_FLOW.md), [model methodology](02_MODEL_AND_METHODOLOGY.md), [extraction audit](PAIMANA_EXTRACTION_PHASE1_AUDIT.md), and [project roadmap](../PROJECT_IMPROVEMENT_ROADMAP.md).
