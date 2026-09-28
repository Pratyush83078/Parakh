# PARAKH

PARAKH is a research prototype for reviewing central infrastructure project reports. It turns monthly PDFs into a source-linked project panel, applies transparent data checks and a deterministic current-state score, and compares experimental models that rank possible next-report cost or schedule changes.

This is not a live MoSPI service or an automated decision system. Model scores are uncalibrated, the cost signal is weak, and some source rows still require review.

## Current data

The repository contains all 17 source PDFs currently used by the prototype, covering March 2025 through July 2026: four legacy OCMS reports and thirteen PAIMANA reports. The extraction quality manifest records report outcomes, warnings, counts, and source pages. See [the audit](docs/PAIMANA_EXTRACTION_PHASE1_AUDIT.md) and [current model methodology](docs/02_MODEL_AND_METHODOLOGY.md) before using or quoting results.

## Run locally

Requirements: Python 3.9+ and Node.js 20+.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 src/run_all.py

npm install
npm run dev
```

Open <http://localhost:3000>. The pipeline scans PDFs under `data/pdfs/` recursively and writes generated files under `data/raw/` and `data/processed/`. Review the report-level quality outputs after adding a PDF; an extraction result is not automatically verified just because it parsed.

## Read next

- [Architecture and data flow](docs/01_ARCHITECTURE_AND_FLOW.md)
- [Model methodology and evaluation](docs/02_MODEL_AND_METHODOLOGY.md)
- [Dashboard guide](docs/03_DASHBOARD_AND_METRICS_GUIDE.md)
- [Extraction audit](docs/PAIMANA_EXTRACTION_PHASE1_AUDIT.md)
- [SIH 26103 brief](docs/05_SIH_COMPLIANCE_AND_PITCH.md)
- [Project roadmap](PROJECT_IMPROVEMENT_ROADMAP.md)

## Stack

Python, pdfplumber, pandas, scikit-learn, Next.js App Router, React, and Recharts. See `requirements.txt` and `package.json` for the dependency lists.
