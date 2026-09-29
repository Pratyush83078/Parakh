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
| Prototype source data | 17 monthly reports: March 2025–July 2026, covering OCMS and PAIMANA formats | The repository does not contain the historic two-decade OCMS series |
| Current panel | 25,116 identified project-month rows; 3,950 official-ID histories | Generated prototype data, not the current live PAIMANA portfolio |
| Latest prototype snapshot | July 2026; 1,775 projects | Clearly label the report month |
| April reconciliation (`src/checker.py`) | 1,981 projects and all three cost/expenditure totals match the official report to the displayed precision (0.0% difference) | Evidence that the April extraction reconciles at portfolio level; it does not prove every field is correct |
| Quality checker output | Across the 17-report panel: 24,257 `VERIFIED`, 859 `REVIEW_REQUIRED`, 24,436 scoring-eligible rows; 0 hard failures and 7 warning categories | Review flags are signals to inspect, not proof of extraction error. Training uses `VERIFIED` rows. The checker is still separate from the main run pipeline. |

The checked-in April PDF is `data/pdfs/FlashReport_April2026.pdf`. Its first pages identify the report as a MoSPI PAIMANA Flash Report for April 2026 and show the portfolio totals. The checker compares the extracted panel against those figures.

### Model evidence: show the weak result too

The checked-in `data/processed/model_metrics.json` records a single chronological holdout on June 2026 rows, with the next report in July. It is not a multi-year prospective evaluation.

| Target and ordered test window | Gradient boosting | Logistic regression | What follows |
|---|---:|---:|---|
| Schedule-date change; April–June 2026 test months, 268 positive cases in June | Mean ROC-AUC 0.777; mean PR-AUC 0.376 | Mean ROC-AUC 0.762; mean PR-AUC 0.340 | Preliminary ranking signal across three test months |
| Cost revision; June 2026 test, 1,732 rows and 72 positives | ROC-AUC 0.704; PR-AUC 0.076 | ROC-AUC 0.672; PR-AUC 0.131 | Weak, imbalanced evidence from one test month; not suitable for cost-risk decisions |

The schedule result is preliminary. The cost model is weak and has only one eligible ordered test month. The saved probabilities are not calibrated. Do not turn these metrics into a broad accuracy claim, promise a dependable percentage probability, or imply the system is ready to recommend or dispatch interventions. Group-separated results are a different evaluation question; do not present them as time-forward performance.

## What exists and what is proposed

**In the prototype:** `pdfplumber` report extraction; pandas-based cleaning and panel construction; row-level source PDF/page references; a separate quality checker with `VERIFIED` and `REVIEW_REQUIRED` states; a weighted 0–100 rule score; logistic regression and gradient boosting experiments; JSON exports; and a Next.js dashboard/API with project search, risk bands, project records, and ministry summaries.

**Still to build or validate:** run the checker as a required pipeline gate; expose source-page evidence and changed fields in the review interface; harden layout/schema change handling; create an explicit human review queue for warnings; calibrate or suppress probabilities; add older reports; repeat chronological evaluation over multiple windows; compare CUF-only fields with engineered features; and track whether a reviewer accepted, dismissed, or acted on a warning.

Treat the review queue and intervention history as the proposed operating workflow, not existing buttons or integrations. The dashboard does not send official alerts and is not a live MoSPI feed.

## Distinguishing insight

Most monitoring dashboards start with a score. PARAKH's sharper question is: **should this project record be trusted enough to score, and what evidence should a reviewer inspect?** The pipeline already has a separate checker and can reproduce the April portfolio totals, while its warning output shows the need for field-level review. The distinctive next step is to connect validation warnings and report provenance to the project watchlist before operational users act on model output.

Quality warnings are signals for investigation, not confirmed extraction defects. The current 17-report panel run flags 1 out-of-range progress value, 47 rows below ₹150 crore, 273 rows with expenditure over 150% of revised cost, 161 rows where revised cost is below half of original, 444 revised completion dates earlier than original targets, 237 month-to-month progress drops greater than one point, and 2,222 project histories with a skipped report month. Categories can overlap; some patterns may reflect real project changes. Do not call them errors without source-page review.

## Six-slide story in the supplied template

The supplied SIH 2026 deck has six allowed slides including the title page. Slide 7 is an instruction slide that explicitly may be removed for submission. Keep the six existing content pointers and their order; delete only that final instruction slide.

1. **Title page** — PARAKH; Problem Statement ID 26103; exact SIH title; Smart Automation; Software; placeholders for registered team name and Team ID.
2. **Proposed solution** — open with “A warning is useful only when its evidence can be trusted.” Show dated April 2026 scale (1,981 projects, 17 ministries/departments, ₹42.78 lakh crore revised cost) with a direct MoSPI report link; explain the target workflow in two sentences; diagram monthly reports → validate and trace → assess cost/schedule separately → human review, with “inconsistent record → hold for review” visible. State pilot measures without promising an improvement percentage. Separate working prototype components from the review queue still to build.
3. **Technical approach** — editable flow: 17 report months (March 2025–July 2026) → extraction with row-level source/page references → quality status → rule/logistic/gradient-boosting comparisons → source-linked review workflow. Show panel size and quality status, schedule results across three ordered test months, and the one-month cost result. Label PR-AUC as rare-event ranking, not accuracy; probabilities are uncalibrated and model drivers are predictive signals, not causes. Treat XGBoost and SHAP as conditional next validation.
4. **Feasibility and viability** — show technical, economic and operational feasibility plus a four-week build path. Surface unresolved legacy reconciliations, changing PDF layouts, thin cost-model evidence and uncalibrated probabilities as risks, with planned controls and human review.
5. **Impact and benefits** — explain how a source-linked review queue may help analysts prioritize attention. Use the inspection-triage analogy; authorized officials decide what to do. Define pilot measures (precision@K within staff capacity, warning lead time, reviewer effort/disposition) and say explicitly that savings or delay reduction have not been measured.
6. **Research and references** — cite the SIH 26103 brief, dated MoSPI April report, PAIMANA portal, prototype source and evaluation artifacts. Keep the repository URL pending public-access confirmation; team name, Team ID and demo URL remain placeholders.

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
