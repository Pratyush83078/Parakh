# Dashboard guide

This guide describes the current local prototype. Values shown by the app come from generated artifacts in `data/processed/`; refresh them with `python3 src/run_all.py` after changing source reports or the pipeline.

## Main views

- **Portfolio:** browse the latest generated project snapshot, search and filter project records, and inspect summary indicators.
- **Project detail:** review reported project fields, the deterministic score and its component coverage, selected-model rankings, and source PDF/page evidence when available.
- **Benchmarks:** compare generated project and ministry aggregates for the available report snapshot.
- **How it works:** explains extraction and validation, the two risk engines, and the current evaluation evidence and limits.

## Reading the values

- **Risk score and band:** deterministic weighted description of current reported conditions. It is not a predicted probability.
- **Coverage:** share of rule-engine inputs available for the score. Missing components are excluded and remaining weights renormalized.
- **Model score:** selected model's uncalibrated output for a possible next-report event. Treat it as a ranking signal, not a promise that an event has that percentage chance.
- **Model quality:** ROC-AUC describes pairwise ranking; PR-AUC must be interpreted alongside the event rate. Group-held-out metrics and chronological metrics answer different questions. Schedule metrics average three ordered test months (April–June 2026); cost metrics have one eligible test month (June 2026). Both use next-report outcomes, with June labels observed in July.
- **Quality status:** `VERIFIED` means the report passed configured checks; `REVIEW_REQUIRED` means warnings or reconciliation gaps need inspection. A warning is evidence to review, not automatically a confirmed extraction error.
- **Source evidence:** where a project row includes source PDF and page, use the link to open that report page and compare the displayed values directly.

## Evidence and API artifacts

Primary artifacts include `latest_snapshot.json`, `model_metrics.json`, `portfolio_kpis.json`, and the per-report extraction quality outputs under `data/processed/`. The project source route serves only PDFs resolved inside `data/pdfs/`.

For the full metric definitions and current results, see [Model methodology](02_MODEL_AND_METHODOLOGY.md). For extraction statuses, see [the audit](PAIMANA_EXTRACTION_PHASE1_AUDIT.md).
