# SIH 26103 presentation brief

Use this evidence brief when preparing or revising the six-slide SIH idea submission. Keep every claim aligned with the checked-in prototype and the dated source report. The user will provide the registered team name and Team ID later; keep placeholders until then.

## The case to make

**Working product name:** PARAKH, matching the active app metadata. Use it as a name; do not invent an acronym expansion.

**One-line idea:** Add an evidence-first early-warning layer to MoSPI's monthly infrastructure project reports: show which project records merit review, what changed, and how reliable the underlying evidence is.

**Proposal copy (2 sentences):** PARAKH turns monthly PAIMANA Flash Reports into a searchable project portfolio, combining a transparent current-risk score with experimental estimates of cost or schedule changes by the next monthly report. Its distinguishing direction is to make data checks, source evidence, model limits, and human review part of the warning workflow, so a risk score is a prompt to investigate rather than an unexplained verdict.

**Audience:** MoSPI/IPMD monitoring analysts, line ministry and department reviewers, and project administrators who need to prioritize monthly follow-up.

The project addresses SIH 26103's request for prediction, comparison with conventional methods, use of current CUF fields, risk prioritization, and early-warning decision support. The pitch should make clear that this is a working prototype and research direction, not a production MoSPI service.

## Verified evidence

| Evidence | Verified value | How to say it |
|---|---:|---|
| Official PAIMANA April 2026 report | 1,981 ongoing projects across 17 line ministries/departments | Dated portfolio scale, not today's live count |
| April 2026 original cost | ₹37,12,662 crore = ₹37.13 lakh crore | Reported total |
| April 2026 revised cost | ₹42,78,402 crore = ₹42.78 lakh crore | Reported total |
| April 2026 expenditure | ₹20,36,107 crore = ₹20.36 lakh crore; 47.59% of revised cost | Reported total, not a forecast |
| Prototype source data | Four monthly reports: April–July 2026 | The repository does not contain the historic two-decade OCMS series |
| Current panel | 7,590 project-month rows; 2,074 unique projects across four reports | Generated prototype data, not the current PAIMANA portfolio size |
| Latest prototype snapshot | July 2026; 1,775 projects | Clearly label the report month |
| April reconciliation (`src/checker.py`) | 1,981 projects and all three cost/expenditure totals match the official report to the displayed precision (0.0% difference) | Evidence that the April extraction reconciles at portfolio level; it does not prove every field is correct |
| Quality checker output | 0 hard failures; 7 warning categories | The checker is a separate script today, not a gate wired into `src/run_all.py` |

The checked-in April PDF is `data/pdfs/FlashReport_April2026.pdf`. Its first pages identify the report as a MoSPI PAIMANA Flash Report for April 2026 and show the portfolio totals. The checker compares the extracted panel against those figures.

### Model evidence: show the weak result too

The checked-in `data/processed/model_metrics.json` records a single chronological holdout on June 2026 rows, with the next report in July. It is not a multi-year prospective evaluation.

| Target, June → July holdout | Gradient boosting | Logistic regression | What follows |
|---|---:|---:|---|
| Schedule-date change; 1,732 labelled rows, 268 positives | ROC-AUC 0.767; PR-AUC 0.342 | ROC-AUC 0.728; PR-AUC 0.280 | Promising prototype signal, still one held-out month |
| Cost revision; 1,732 labelled rows, 72 positives | ROC-AUC 0.436; PR-AUC 0.039 | ROC-AUC 0.503; PR-AUC 0.044 | Not suitable for cost-risk decisions today |

The schedule result is preliminary. The cost model is weak. The saved probabilities are not calibrated. Do not turn these metrics into a broad accuracy claim, promise a dependable percentage probability, or imply the system is ready to recommend or dispatch interventions. Group-separated results are a different evaluation question; do not present them as time-forward performance.

## What exists and what is proposed

**In the prototype:** `pdfplumber` report extraction; pandas-based cleaning and panel construction; a weighted 0–100 rule score; logistic regression and gradient boosting experiments; JSON exports; a Next.js dashboard/API with project search, risk bands, project records, and ministry summaries; and a separate data checker.

**Still to build or validate:** run the checker as a required pipeline gate; attach report/page provenance to individual fields; detect layout/schema changes; create an explicit human review queue for warnings; calibrate or suppress probabilities; add historical reports; repeat chronological evaluation over multiple windows; compare CUF-only fields with engineered features; and track whether a reviewer accepted, dismissed, or acted on a warning.

Treat the review queue and intervention history as the proposed operating workflow, not existing buttons or integrations. The dashboard does not send official alerts and is not a live MoSPI feed.

## Distinguishing insight

Most monitoring dashboards start with a score. PARAKH's sharper question is: **should this project record be trusted enough to score, and what evidence should a reviewer inspect?** The pipeline already has a separate checker and can reproduce the April portfolio totals, while its warning output shows the need for field-level review. The distinctive next step is to connect validation warnings and report provenance to the project watchlist before operational users act on model output.

Quality warnings are signals for investigation, not confirmed extraction defects. In the current run they include 84 rows where revised cost is below half of original, 131 revised completion dates earlier than original targets, 112 progress drops greater than one point, 35 rows with expenditure over 150% of revised cost, 13 rows below the ₹150 crore threshold, 4 target dates before start dates, and 8 project histories with a skipped report month. Some can be legitimate project changes; do not call them errors without source-page review.

## Six-slide story in the supplied template

The supplied SIH 2026 deck has six allowed slides including the title page. Slide 7 is an instruction slide that explicitly may be removed for submission. Keep the six existing content pointers and their order; delete only that final instruction slide.

1. **Title page** — PARAKH; Problem Statement ID 26103; exact SIH title; Smart Automation; Software; placeholders for registered team name and Team ID.
2. **Idea title / proposed solution** — two-sentence idea, target audience, prototype scope (four reports, July snapshot), and the distinction between an existing searchable dashboard and the planned evidence/review workflow.
3. **Technical approach** — editable flow: MoSPI PDFs → coordinate extraction and cleaning → data checks / evidence → current rule score + next-report model experiments → Next.js project review. Name only dependencies actually used. Include a compact, dated evaluation note: schedule model 0.767 ROC-AUC / 0.342 PR-AUC; cost model 0.436 / 0.039 on the June-to-July temporal holdout.
4. **Feasibility and viability** — current Python/Next.js stack is open-source and runs locally; no external API, paid LLM, or new database is required for this prototype. Risks: only four months, fragile PDF layouts, unresolved warning rows, one temporal holdout, weak cost model, and human adoption. Controls: historical reports, per-report schema and totals checks, page-level evidence, repeated time-forward evaluation, visible uncertainty, and analyst review. Mark proposed controls as next work.
5. **Impact and benefits** — show dated portfolio scale (April: 1,981 projects / ₹42.78 lakh crore revised cost) and what the prototype changes today (searchable, ranked review). Analogy: an inspection triage board points an analyst to a project and its evidence; it does not approve action. Benefits are intended, not measured. State that reviewer time, warning lead time, and false-alert rate need a pilot baseline.
6. **Research and references** — cite the official MoSPI April report and PAIMANA report page; SIH 26103 problem brief; prototype source and metric artifact. Put direct, readable source names and links on the slide and source details in speaker notes.

## Technical and visual guidance

- Keep the exact template, six-slide limit, blue SIH footer, and original section order. Use the template's provided font styles and logos.
- Prefer short phrases, one editable architecture diagram, and a genuine prototype screenshot if a current screenshot can be included without making the slide crowded.
- Separate **implemented now** from **proposed next** visually and in wording.
- Explain model inputs in plain terms: project cost and dates, reported progress, expenditure, and how those values change between reports. Avoid ML jargon where the reviewer needs a user-facing meaning.
- Never use the following as established facts: twenty years ingested; all PAIMANA projects updated live; “30 days earlier”; calibrated risk percentages; reliable cost-risk prediction; real PMO/Ministry dispatch; saved money, reduced delays, or environmental gains without a measured pilot.

## Sources

- MoSPI, *Project Assessment, Infrastructure Monitoring and Analytics for Nation-building (PAIMANA), Flash Report, April 2026*, especially pp. 1–3 and Table 6. Repository copy: `data/pdfs/FlashReport_April2026.pdf`. Official report page: <https://paimana-proj.mospi.gov.in/ReportPage>.
- MoSPI PAIMANA public dashboard: <https://ipm.mospi.gov.in/Home/PublicDashboard>.
- SIH 2026, Problem Statement 26103, MoSPI / Data Informatics & Innovation Division (DIID), as supplied in the user's brief.
- Prototype evidence: `src/checker.py`, `src/model_train.py`, `data/processed/model_metrics.json`, and `data/processed/portfolio_kpis.json`.
