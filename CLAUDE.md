# PAIMANA repository plan

This file records current verified project facts and operating guidance for the SIH 26103 prototype. It is not the canonical user-facing documentation; see `docs/README.md`. Update it as phases are completed; keep implementation details in the code and durable reference material in `docs/`.

## Project purpose

SIH 26103 asks for an open-source decision-support system that can identify infrastructure projects at risk of cost escalation, schedule delay, or implementation trouble. It should help monitoring teams decide which projects need attention and explain the evidence behind an alert.

This repository is a prototype that turns MoSPI monthly Flash Report PDFs into a project dashboard. The current flow is:

1. `src/pdf_extracter.py` extracts report tables into monthly CSVs under `data/raw/`.
2. `src/data_loader.py`, `src/features.py`, `src/labels.py`, and `src/pipeline.py` clean monthly records, build a panel, derive indicators, calculate a transparent risk score, and label later cost or schedule changes.
3. `src/model_train.py` compares logistic regression with gradient boosting; `src/export_for_backend.py` writes a latest-project snapshot and portfolio KPIs.
4. The Next.js App Router app in `app/` serves the dashboard and JSON endpoints. `lib/dataEngine.js` reads the generated JSON files.

The current prototype is useful for demonstrating data extraction, descriptive risk scoring, and an experimental early-warning workflow. Treat predictions as decision support for human review, not as verified forecasts or automatic intervention recommendations.

## Verified starting point (2026-09-29)

- Active web stack: Next.js App Router, React 19, JavaScript. Python pipeline: pandas, NumPy, pdfplumber, scikit-learn, and Parquet. `package.json` and `requirements.txt` are dependency sources of truth.
- Seventeen source PDFs are present under `data/pdfs/` (March 2025–July 2026). `data/raw/extraction_quality.json` is the per-report extraction audit; cached rows are reused only when the source hash and parser version match.
- The full generated panel has 25,116 rows across 17 report months and 3,950 official-ID histories; latest July 2026 snapshot has 1,775 projects. The source audit records 25,180 extracted rows, 915 review-flagged rows, 10 report outputs `REVIEW_REQUIRED`, 7 `VERIFIED`, and no failed reports.
- Four OCMS reports (March–June 2025) remain review-required because legacy fields are missing and revised-cost reconciliation is unresolved. Do not describe them as verified.
- `src/run_all.py` builds a one-report-ahead target from the next observed project snapshot. Do not call this a 30-day forecast.
- Training evaluation cohort: 18,257 verified labeled project-month rows / 3,794 projects for each target. Schedule uses 3 ordered test months; cost has one (June 2026) because earlier months do not meet the configured positive-event threshold.
- Temporal selected results in `data/processed/model_metrics.json`: schedule gradient boosting mean ROC-AUC 0.777 / PR-AUC 0.376; cost logistic regression June ROC-AUC 0.672 / PR-AUC 0.131 (72 positives of 1,732). Outputs are uncalibrated; cost evidence is one test month and not decision-ready.
- The deterministic rule score exposes five weighted signals and their coverage. The selected models use permutation importance globally; SHAP is not implemented.
- Read [the documentation hub](docs/README.md), and keep Kimi design notes separate from technical truth claims.

## Credibility risks

- Keep unverified rows out of verified risk results and surface review warnings with report/page provenance.
- Never imply live MoSPI integration, calibrated event probabilities, a measured intervention effect, or official alert dispatch.
- Use generated metric and extraction artifacts as sources of exact values; update docs when those artifacts change.

## Mapping to the problem statement

| PS item | Current evidence | Remaining work |
|---|---|---|
| (a), (b) | Rule score and two model families evaluated on project-group and time-ordered splits; details in `model_metrics.json` | Extend time-forward evidence and uncertainty analysis |
| (c) | Not implemented | Compare CUF-only inputs with engineered features |
| (d) | Portfolio watchlist highlights rule bands | Add reviewed, logged changes in model ranking |
| (e) | Ministry/state peer context is in the app | Validate comparability by project size, age, and scope |
| (f) | Rule-score contributors and global permutation signals are visible | Evaluate per-project explanations only if they improve fidelity |
| (g) | Next.js dashboard reads generated snapshots and displays evidence limits | Continue usability and quality-state improvements |
| (h) | No assistant | Consider only for a grounded user need and citations |
| (i) | Root README and maintained docs provide local run guidance | Deployment packaging and pilot operations remain |

## Open-source tech choices (add only when the step needs them)

- Keep: pdfplumber, pandas, parquet, scikit-learn, Next.js 15, Recharts.
- Data quality: plain pandas checks and a reconciliation test against official totals. No validation framework yet.
- Biggest model-quality lever: **more months of data**. Add older reports from https://paimana-proj.mospi.gov.in/ReportPage to `data/pdfs/`.
- Later, when justified: `CalibratedClassifierCV` (already in sklearn), `lifelines` for time-to-slip survival models, SHAP for per-project reasons, DuckDB if history grows large, Ollama for the assistant.

## Product and technical direction

Keep the hackathon prototype small and open-source. Prefer the existing Next.js + Python pipeline unless a measured need justifies another service, database, cloud dependency, or LLM. The immediate gains should come from trustworthy data and clear explanations:

- Preserve provenance for each record: source PDF, report month, extraction date, and relevant source page/table where feasible.
- Validate required fields, identifiers, duplicate project-month rows, date order, numeric ranges, missingness, and extraction totals. Report failures clearly and stop exports when input data is unsafe.
- Keep derived files reproducible from source inputs. Establish one canonical copy of each generated output and make data/artifact tracking intentional.
- Compare predictive models with a simple baseline using project-separated and time-ordered evaluation. Report class balance, PR-AUC, ROC-AUC, calibration, evaluation dates, and sample size. Avoid claiming generalization from the current small number of ordered test windows without supporting evidence.
- Separate observed status and rule-based risk from model probabilities in both UI and docs. Explain the time horizon, uncertainty, and data limitations beside each prediction.
- Do not add an LLM to make the prototype appear more advanced. Consider one only for a specific, testable user need, using grounded project data and visible citations.

## Documentation status

The maintained references are the root `README.md`, `docs/README.md`, architecture, model methodology, dashboard guide, extraction audit, SIH capability brief, and design system. Older overlapping technical notes now point to those canonical documents. Preserve `kimi.md` and `kimi_idea.md` unless the user requests design-note edits.

For new work, update the relevant canonical doc rather than copying long explanations into another checklist. Remove stale metrics and unsupported claims when discovered.

## Commands and shell notes

```bash
python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
python src/run_all.py      # PDFs -> panel -> models -> JSON for the web app
python src/checker.py      # data sanity report
npm install && npm run dev # http://localhost:3000, API at /api/health and /api/kpis
```

In agent shells, run `export GIT_PAGER=cat PAGER=cat` before git commands (an interactive pager hangs the shell). Use absolute paths, because new shells may start in another directory.

## Progress log

- 2026-09-27: Measured the facts above and found the fabricated backtest.
- 2026-09-27 (Duo): re-ran `model_train.py` (the cost temporal result is above). Removed the backtest section, its sidebar link and its component. `git rm`'d 7 `* 14-21-48-*` duplicate artifacts (a macOS copy of the same run; the pipeline writes only the unsuffixed names). Parked 44 skills. These changes are staged, not committed. Root `node_modules` is missing, so run `npm install && npm run build` before committing.
- 2026-09-27 (Duo, round 2): wrote `docs/FINDINGS_AND_ROADMAP.md` (the full issue list, tech stack, data checks, feature plan). Rebuilt `app/page.jsx` from real data only and added a model-evaluation table that reads `data/processed/model_metrics.json`. Widened the content gap in `styles/Supermemory.css`. Fixed the label NaT bug and the month matching in `src/labels.py`. The export now uses the latest month only. Rewrote `src/checker.py` (the April expenditure reconciliation FAILs at −14.6%). NOT YET RE-RUN: metrics in the JSON are from before the label fix.
- 2026-09-27 (Duo, round 3): pipeline re-run. April reconciles exactly (1,981 / 37.13 / 42.78 / 20.36). Fixes in `data_loader.py`: first-number parsing and 6-digit code recovery. Panel is now 7,590 rows, 2,074 projects (Apr 1,981 / May 1,987 / Jun 1,847 / Jul 1,775) (the "7,497 / 2,059 / 1,962" facts above are superseded). Slip GBoost 0.84 held-out / 0.77 temporal; cost 0.88 held-out / 0.44 temporal (13 test positives). The metrics JSON is regenerated by the pipeline.
- Agent shell note: heredocs and commands longer than about 2 minutes (a full PDF scan) time out here. Ask the user to run long commands.
- 2026-09-29: refreshed the README and canonical documentation around the current extraction manifest, model metrics, source-PDF availability, and frontend evidence labels; compressed overlapping historical guides into pointers. The visual design notes were preserved.
