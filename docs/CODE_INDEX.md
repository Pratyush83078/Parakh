# Code and data index

## Data pipeline

- `src/pdf_extracter.py` — monthly PDF discovery and table extraction
- `src/data_loader.py`, `src/pipeline.py` — normalization and project-month panel
- `src/features.py`, `src/labels.py` — rule score, features, and next-report targets
- `src/model_train.py` — model comparison and evaluation artifacts
- `src/export_for_backend.py`, `src/run_all.py` — snapshot export and pipeline entry point

## Web app

- `app/` — Next.js App Router pages and API routes
- `components/` — reusable dashboard and project views
- `lib/` — data access and presentation helpers
- `styles/` — existing visual system

## Generated data

- `data/processed/latest_snapshot.json` — latest project rows used by the app
- `data/processed/model_metrics.json` — model selection and evaluation data
- `data/processed/portfolio_kpis.json` — generated portfolio aggregates
- Per-report extraction quality outputs — outcomes, warnings, and reconciliation checks

Generated files may change when the pipeline is rerun. Start with the root README and the [documentation hub](README.md).
