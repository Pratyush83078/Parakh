# PAIMANA repository plan

This file is the working plan for making the SIH 26103 project easier to understand, verify, and maintain. It records the current evidence and the order of cleanup. Update it as phases are completed; keep implementation details in the code and durable reference material in `docs/`.

## Project purpose

SIH 26103 asks for an open-source decision-support system that can identify infrastructure projects at risk of cost escalation, schedule delay, or implementation trouble. It should help monitoring teams decide which projects need attention and explain the evidence behind an alert.

This repository is a prototype that turns MoSPI monthly Flash Report PDFs into a project dashboard. The current flow is:

1. `src/pdf_extracter.py` extracts report tables into monthly CSVs under `data/raw/`.
2. `src/data_loader.py`, `src/features.py`, `src/labels.py`, and `src/pipeline.py` clean monthly records, build a panel, derive indicators, calculate a transparent risk score, and label later cost or schedule changes.
3. `src/model_train.py` compares logistic regression with gradient boosting; `src/export_for_backend.py` writes a latest-project snapshot and portfolio KPIs.
4. The Next.js App Router app in `app/` serves the dashboard and JSON endpoints. `lib/dataEngine.js` reads the generated JSON files.

The current prototype is useful for demonstrating data extraction, descriptive risk scoring, and an experimental early-warning workflow. Treat predictions as decision support for human review, not as verified forecasts or automatic intervention recommendations.

## Verified starting point

- The active web stack is Next.js 15 App Router, React 19, and JavaScript. API handlers are under `app/api/`; the app reads local JSON snapshots. `package.json` is the source of truth for commands and dependencies.
- The analysis stack is Python with pandas, NumPy, pdfplumber, scikit-learn, and Parquet support. `requirements.txt` is the dependency source of truth.
- Four monthly source PDFs are currently present, April through July 2026. This is not evidence of a two-decade historical training set.
- `src/run_all.py` calls `build_full_panel(horizon=1, velocity_window=1)`. The labels compare against the next observed project snapshot, so describe the forecast window as the next available monthly report until the cadence and validation support a more precise claim.
- The repository includes duplicate timestamp-suffixed generated snapshots and model files. Classify and compare them before removing anything.
- The root README and multiple guides describe an older Express + Vite architecture, React 18, 30-day predictions, 7,497 records, or specific model scores. Verify each numerical or capability claim from the current code and reproducible outputs before retaining it.
- `backend/` and `frontend/` are ignored by Git; the tracked application is the root Next.js app. Do not describe ignored folders as the active stack without confirming their role.
- `.agents/skills/` is ignored by `.gitignore`, while `skills-lock.json` is tracked. Determine which skills are actually needed and portable before pruning or changing the lock file.

## Measured facts (2026-09-27, from `data/processed/full_panel.parquet`)

Use these numbers in docs and the pitch. Re-measure after every pipeline change, and put n beside every metric.

- Panel: **7,497 rows = 2,059 unique projects x 4 months** (Apr 1,962 / May 1,968 / Jun 1,819 / Jul 1,748). 17 ministries.
- `cost_revised_up_label` (next report): 5,438 labelled rows, **76 positives (1.4%)**. A 20% project-held-out test set has about 13 positives, so its ROC-AUC has roughly +/-0.1 uncertainty.
- `schedule_slipped_label` (next report): 4,504 labelled rows, 928 positives (20.6%).
- The rule-based `risk_score` alone, on the whole labelled panel: ROC-AUC **0.53** (slip) and **0.61** (cost). The best single raw feature for slip is `elapsed_frac` (ROC 0.70).
- Re-measured with `venv/bin/python src/model_train.py` on 2026-09-27:

  | Target | Split | n test (pos) | LogReg ROC / PR | GBoost ROC / PR |
  |---|---|---|---|---|
  | cost_revised_up | project-held-out | 1,076 (13) | 0.768 / 0.049 | 0.830 / 0.078 |
  | cost_revised_up | temporal (test = Jun) | Jun rows | **0.397 / 0.034** | **0.328 / 0.033** |
  | schedule_slipped | project-held-out | 904 (192) | 0.782 / 0.405 | 0.804 / 0.527 |
  | schedule_slipped | temporal (test = Jun) | Jun rows | 0.719 / 0.342 | 0.745 / 0.368 |

  **The cost model does not generalise forward in time** (temporal ROC below 0.5). Do not demo it as a working forecaster. The slip model does hold up (0.75 temporal against 0.53 for the rule score), and that gap is the honest answer to PS dimension (b).
  `docs/DATA_LEAKAGE_AUDIT_AND_TRUE_METRICS.md` reports only the group split and calls 0.078 PR-AUC "extraordinarily good". Rewrite it with the temporal row.
- The project count falls month by month (1,968 to 1,748). Completed or dropped projects leave the report, which is survivorship bias for the labels.
- Official April 2026 totals from the PS text (use them as an extraction reconciliation target): 1,981 projects, original cost Rs 37.13 lakh cr, revised Rs 42.78 lakh cr, expenditure Rs 20.36 lakh cr. Our April extract has 1,962 rows, so find the missing 19.

## Credibility risks to fix before any demo

1. DONE: removed `components/BacktestSection.jsx` (fabricated "7 to 8 months advance warning" for USBRL, WDFC, MTHL). Check the other home-page sections (`#public-accuracy`, `#deployment`, `WhatIfSimulator`) for the same kind of invented claim.
2. The docs quote three different ROC-AUCs (0.886, 0.88, 0.830) and "SIH 2025". Publish only numbers that `src/model_train.py` prints for the current data.
3. UI numbers should come from a generated `data/processed/metrics.json`, not literals in JSX.

## Mapping to the problem statement

| PS item | Status in this repo | Next step |
|---|---|---|
| (a) statistical and predictive models | Rule score, LogReg, and GradientBoosting exist | Add a baseline table with CIs |
| (b) does ML beat conventional statistics? | Not reported side by side | Rule score vs LogReg vs GBoost on the same project-held-out and time-ordered splits |
| (c) CUF fields vs extra variables | Missing | Ablation: raw CUF fields only vs + engineered features (later, + external data) |
| Outcomes a, b, c (cost/time models, risk score) | Prototype | Calibrate probabilities, show n and uncertainty |
| d (early warning alerts) | Rule-band alerts only | Alert on rising predicted risk between months |
| e, f (benchmarking, cost drivers) | Partial (peer cohort, primary driver) | Tie the driver view to model importance, not only the rule weights |
| g (dashboard) | Exists | Remove hardcoded claims |
| h (LLM assistant) | Missing | Only with grounded tool calls and project-code citations (open-weights model via Ollama) |
| i (docs and deployment) | Docs inconsistent, no deploy | This cleanup + one Dockerfile |

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
- Compare predictive models with a simple baseline using project-separated and time-ordered evaluation. Report class balance, PR-AUC, ROC-AUC, calibration, evaluation dates, and sample size. Avoid claiming generalization from four monthly reports without supporting evidence.
- Separate observed status and rule-based risk from model probabilities in both UI and docs. Explain the time horizon, uncertainty, and data limitations beside each prediction.
- Do not add an LLM to make the prototype appear more advanced. Consider one only for a specific, testable user need, using grounded project data and visible citations.

## Cleanup plan

### 1. Establish an inventory and evidence ledger

- Trace the runnable app, pipeline entry points, imports, scripts, generated outputs, and ignored folders.
- For each documentation claim about architecture, data volume, dates, model performance, or completed features, record the supporting code/output or mark it unverified.
- Identify duplicate, obsolete, empty, and contradictory documents. Preserve history until each file is mapped to a canonical replacement or explicitly marked archival.

**Done when:** there is a concise inventory showing the active architecture, source data, generated artifacts, and the disposition of every tracked Markdown file.

### 2. Repair the documentation hierarchy

Target a small beginner-friendly set:

- `README.md`: what the prototype does, limitations, setup, run steps, and links to deeper docs.
- `docs/README.md`: a short reading guide for newcomers and contributors.
- `docs/architecture.md`: verified data flow, directory map, and current stack.
- `docs/data-and-modeling.md`: field provenance, labels, features, risk-score rules, evaluation method, metrics, and limitations.
- `docs/sih-26103.md`: requirement mapping, implemented/demo/planned status, and an honest demo narrative.
- `docs/operations.md`: reproducible pipeline, expected inputs/outputs, validation, and troubleshooting.

Merge repeated material into these sources of truth. Move only superseded material with historical value to `docs/archive/`, label it as historical, and remove obsolete duplicates only after links and unique facts are handled. Keep visual design reference only if the implemented UI still uses it.

**Done when:** each active guide has one clear audience and purpose, links resolve, and current claims match the code and reproducible artifacts.

### 3. Clarify the repository layout and artifact policy

Suggested direction, subject to import and run-path checks:

```text
app/                  Next.js pages and route handlers
components/           reusable UI
hooks/ lib/ styles/   client hooks, domain/data helpers, and styles
analysis/              Python extraction, feature, model, and export pipeline
data/pdfs/             source reports (tracking policy to be decided)
data/raw/              extracted monthly CSVs
data/processed/        canonical generated panels, metrics, and model artifacts
docs/                  maintained contributor and SIH documentation
```

Before moving files, check imports, path assumptions, scripts, deploy behavior, and Git history. Remove timestamp-suffixed duplicates only after comparing their contents and confirming the canonical artifact. Decide explicitly which source PDFs and generated outputs belong in Git; do not silently delete data or add a database just to make the tree look cleaner.

**Done when:** the tree has one obvious active app and one obvious analysis pipeline, generated artifacts have a documented policy, and documented commands still point to tracked files.

### 4. Reduce agent-skill noise

DONE 2026-09-27: 53 skills cut to 9 (13 MB to 2.8 MB). Kept: `code-review`, `diagnosing-bugs`, `tdd`, `impeccable` (frontend quality), `vercel-react-best-practices`, `kill-ai-slop`, `ponytail` (simplicity), `not-ai` (doc prose), `handoff` (context resets). The other 44 are in `.agents/skills-archive/` (gitignored, restore with `mv`). `skills-lock.json` still lists all of them, so decide whether to trim it.

Original instructions: audit the local `.agents/skills/` inventory and lock file by actual use in this project. Keep only skills that materially help recurring work here, such as focused code review, debugging, frontend quality, and agent-document writing. Remove duplicate or unrelated personal workflow skills from the project-local set only after confirming they are not shared setup; keep optional skills outside always-loaded project guidance. Do not copy full skill instructions into `CLAUDE.md`.

**Done when:** the retained skill set is short, each skill has a concrete project use, and lock/config references agree with the files that are intentionally maintained.

### 5. Verify the cleaned project

- Run the documented setup/build and pipeline commands in a clean environment where practical.
- Check that pipeline output counts and schema are consistent with the input reports.
- Exercise the dashboard and API against the newly generated canonical snapshot.
- Check documentation links, names, dates, metrics, and demo claims against the resulting app and data.

**Done when:** a newcomer can follow the README, regenerate data, launch the current app, and understand what is measured versus predicted without encountering contradictory instructions.

## Tool fit: repo agents vs browser agents

Use a repo agent (Codex, GitLab Duo, Claude Code) for repository inspection, GitLab MRs/CI/issues, Python/JavaScript changes, documentation consolidation, data-pipeline reasoning, and repeatable command-line checks. Antigravity may be a better fit for hands-on browser exploration and visual review if its browser-control workflow is available in the user's setup: checking responsive layouts, clicking through the full judge demo, and capturing screenshots of UI issues. Keep code fixes and factual/model audits tied to repository evidence; browser appearance alone cannot validate data quality or prediction claims.

## Working-context discipline

Use this file and the maintained docs as the project memory. Re-open the relevant source when a fact matters; do not rely on stale chat recollection. Keep summaries focused on decisions, verified facts, and unfinished work. If the conversation becomes long enough that context loss could affect the work, tell the user and offer a compact handoff summary for a new chat. I cannot reliably report an exact remaining context-window count from this workspace.

Context savers: do not read `docs/archive/`, `data/processed/*.json`, `package-lock.json`, PDFs, or `.agents/skills-archive/` unless the task needs them. Work on one cleanup phase per chat.

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
- NEXT (new chat, phase 2 docs): 21 Markdown files, about 34k words. Merge them into the 6 target docs listed in phase 2. `docs/archive/` is gitignored, so moving a doc there untracks it. Either un-ignore it or delete files and rely on git history.
