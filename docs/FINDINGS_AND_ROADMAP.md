# Findings and roadmap

Written 2026-09-27 on branch `testing` from a code and data audit. Every number here comes from `python src/checker.py` or `python src/model_train.py`. Re-run both after any pipeline change and update this file.

## 1. The problem, in one paragraph

MoSPI's PAIMANA portal tracks about 1,981 central infrastructure projects worth ₹150 crore or more. Each month it publishes a Flash Report with every project's cost, spending, progress and completion dates. Today officials learn about a cost increase or a delay only when it appears in a report. SIH 26103 asks for an open-source tool that **warns earlier**, **explains why**, and **tests honestly whether ML beats simple statistics**.

## 2. What we build (scope for 4 PDFs)

| Piece | What it does | Status |
|---|---|---|
| PDF extractor + cleaner | Flash Report PDF → one CSV row per project per month | April matches official totals exactly (see 3.1) |
| Data checks | Stop the pipeline when data is wrong | New: `src/checker.py` |
| Rule risk score (0 to 100) | Transparent "how bad is it now" score | Works, but weights are hand-picked |
| Schedule-slip model | Chance the completion date moves in the next report | **Usable**: 0.77 ROC-AUC on a later month (0.84 on held-out projects) |
| Cost-revision model | Chance the cost goes up in the next report | **Not usable yet**: 0.44 on a later month (0.88 on held-out projects, but only 13 test positives) |

Current numbers always live in `data/processed/model_metrics.json`.
| Dashboard | Watchlist, project detail, benchmarks | Works. Fake claims removed from the homepage |

With 4 months of data the honest pitch is: *"the rule score describes today, the slip model gives a real early warning, and here is exactly how much ML adds."* That answers PS dimension (b) directly.

## 3. Problems found

### 3.1 Data and extraction (`src/pdf_extracter.py`, `src/checker.py`)

- **Fixed: April now reconciles exactly with the official totals** (1,981 projects; ₹37.13 / 42.78 / 20.36 lakh cr; all +0.0%). Two root causes, both fixed in `src/data_loader.py`:
  1. About 134 expenditure cells per month had the page footer (`523.61 visit: https://paimana-proj...`) or a neighbouring value (`139.77 10762.01`) glued on, and `float()` blanked them. The cleaner now takes the first number. The exact reconciliation confirms the first number is the right one.
  2. For 24 NHAI/MoRTH/AAI rows the extractor put the agency name or `-` in `project_code`, and the real 6-digit code shifted into `legacy_ocms_code` or `pmgid`. Those rows collided as "duplicates" and 19 were dropped. The code is now recovered from whichever column holds it.
  - Also removed a stray `data/raw/April2026.csv 14-22-01-494.csv` copy. The loader now reads only `MonthYYYY.csv` files.
  - Still open, in the extractor itself: sector headings sometimes get glued onto the first project name (for example "Aviation & Aviation Infrastructure Construction of…"), leaving `sector` empty for about 318 April rows.
- Column positions are hardcoded x-coordinates (`COLS`). A layout change in a new month breaks extraction silently. Add a per-page header check.
- `approval_date, start_date = orig_and_revised("approval_date")` assumes the start date is the bracketed value. Verify on one page.
- Checker warnings: 82 rows where revised cost is under 50% of original (a column swap?), 130 revised dates earlier than the original, 112 progress drops month to month, 13 rows under ₹150 cr, 32 rows spending over 150% of revised cost.
- 311 projects leave the report between April and July (completed or dropped). This biases the labels: projects that finish never get a "slip" label.

### 3.2 Labels and features (`src/labels.py`, `src/features.py`)

- **Fixed:** projects with no revised completion date had `NaT` and were dropped from the schedule label, so the slip model only learned from projects that had already slipped. Labels now use the effective date (`revised_doc` or `target_doc`) and match the future row by calendar month, not row position. **Re-run the pipeline. All metrics will change.**
- Still open: `doc_pushed_flag` and `cost_revision_flag` in `features.py` use the raw revised columns (same NaT issue).
- `expected_progress_pct` assumes linear progress. Real projects follow an S-curve.
- `agency_avg_overrun` has no values in April (no prior months), so the model sees it only from May onward.

### 3.3 Models (`src/model_train.py`)

- The cost model has 13 positives in its test set. Any ROC-AUC on 13 positives carries roughly ±0.1 uncertainty.
- The saved model is trained on 80% of the data, not refit on all of it.
- The probabilities are not calibrated, so "72% risk" in the UI is not a real 72%.
- **Fixed:** metrics are now written to `data/processed/model_metrics.json` together with the rule-score baseline. The UI reads only that file.

### 3.4 Export and API (`src/export_for_backend.py`)

- **Fixed:** portfolio KPIs used each project's *last seen* row, so the 311 projects that left the report were still counted and totals mixed months (2,059 projects). The export now uses the latest report month only and records `report_month`.

### 3.5 Fake or unsupported claims in the site

Removed from `app/page.jsx`: the "18 months to 2 months" CAG quote, "F1 94.8% / ROC 0.886 / 6 months earlier", the MoSPI OCMS / PMO PRAGATI / NITI Aayog / NIC Cloud "partner" strip, the hardcoded ₹34.8L Cr / +₹4.92L Cr / 14.4% figures, the "alert dispatched to PMO" button, the "100% NIC compliant / bare-metal / VPC" deployment cards, "real-time surveillance", and the fabricated backtest section.

**Still to audit:** `components/WhatIfSimulator.jsx` (hand-typed USBRL/MTHL presets), `components/charts/SupermemoryBarChart.jsx` and `BenchmarkDualLineChart.jsx` (probably invented series; now unused on the homepage), `app/about`, `app/benchmarks`, `lib/intelligence.js` (`getConfidenceScore`), and the `layout.jsx` metadata ("Radar").

### 3.6 Repo hygiene

- About 34k words across 21 Markdown files, contradicting each other (three different ROC-AUCs, "SIH 2025", Express + Vite stack). The target is the 6-doc set in `CLAUDE.md`.
- `frontend/` and `backend/` are ignored leftovers of the old Express + Vite app. Delete them locally.
- `docs/archive/` is gitignored, so anything moved there drops out of git.

## 4. Data-quality checks (what `src/checker.py` enforces)

| Check | Level |
|---|---|
| No duplicate project + month | FAIL |
| Progress within 0 to 100, cost > 0 | FAIL |
| April totals within 2% of official MoSPI figures | FAIL |
| Missing key fields < 5% | WARN |
| Cost ≥ ₹150 cr, spending ≤ 150% of revised cost, revised cost ≥ 50% of original | WARN |
| Start < target date, revised date ≥ target date | WARN |
| Progress does not drop month to month; no skipped months | WARN |

Next: make `run_all.py` call the checker and stop the export on FAIL. Store the source PDF and page number per row (provenance), so every number in the UI can be traced back to a report page.

## 5. Tech stack

**Now (4 PDFs, keep it small):** pdfplumber, pandas, Parquet, scikit-learn, Next.js 15, Recharts. That is enough. Do not add a database, a message queue or cloud services.

Add only when a step needs it:

| Need | Tool (open source) | Why |
|---|---|---|
| Honest probabilities | `CalibratedClassifierCV` (sklearn) | "70% risk" should mean 70% |
| Per-project reasons | SHAP | Replace hand-picked "main driver" with model evidence |
| Stronger baseline | Logistic regression on raw CUF fields only | PS (c): CUF-only vs engineered features |
| Time to slip | `lifelines` (Cox / Kaplan–Meier) | Uses projects that have not slipped *yet* instead of dropping them |
| Uncertainty | Bootstrap CIs (numpy) | Show ± next to every metric |
| Tests | `pytest` on the extractor and labels | Catch silent layout breaks |
| More history (biggest lever) | Older reports from paimana-proj.mospi.gov.in | More months = more positives = trustworthy cost model |
| Large history later | DuckDB | Only if Parquet on disk becomes slow |
| LLM assistant (PS h) | Ollama + an open-weights model, tool calls over the snapshot JSON, cites project codes | Only after the data is trustworthy |
| Deploy (PS i) | One Dockerfile (Python build step + `next start`) | Judges can run it |

## 6. Feature plan mapped to the PS outcomes

| PS outcome | Feature | Priority |
|---|---|---|
| a, b | Slip and cost models with a rule-score baseline table, n and CIs | 1 |
| c | Ablation: CUF fields only vs + engineered features | 1 |
| d | Early-warning alert when predicted risk *rises* between two reports | 2 |
| e | Peer benchmarking (same ministry and size band) | 2 (partial) |
| f | Cost-escalation drivers from SHAP, not rule weights | 3 |
| g | Dashboard showing only generated numbers, with a "last updated" month | 1 (in progress) |
| h | Grounded LLM assistant | 4 |
| i | README, Docker, reproducible `run_all.py` | 2 |

## 7. Next steps, in order

1. Done: label fix and reconciliation fix, re-run on 2026-09-27.
2. Fail `run_all.py` when `checker.py` fails. Add reconciliation targets for May to July from the official reports.
3. Fix the sector-heading bleed in the extractor (needs a PDF re-run, about 2+ minutes per PDF).
4. Audit the remaining UI files in 3.5.
5. Consolidate the docs (phase 2 in `CLAUDE.md`).
