# How the SIH 26103 PPT is built

The deck is **generated, not hand-drawn**, so the slides and the evidence can never
disagree. One command:

```bash
venv/bin/python src/make_ppt.py
```

| Output | What it is |
|---|---|
| [PARAKH_SIH26103_Idea_Submission_FINAL.pptx](docs/presentation/PARAKH_SIH26103_Idea_Submission_FINAL.pptx) | the 6-slide submission deck **← submit this one** |
| [deck_preview.html](docs/presentation/deck_preview.html) | the same slides as HTML, for reviewing without PowerPoint |
| [SIH2026-Idea-Presentation-Format.pptx](docs/presentation/templates/SIH2026-Idea-Presentation-Format.pptx) | the vendored official template the script fills |

## Four steps to submit

1. **Fill your details** in the block at the top of [make_ppt.py](src/make_ppt.py):
   `TEAM_NAME`, `TEAM_ID`, `REPO_URL`, `DEMO_URL`. The team name also lands in the
   template's own oval on slides 2–6.
2. **Re-run** the script if any data artifact changed — every number is re-read from
   disk on each run.
3. **Export to PDF.** SIH accepts only PDF. Open the `.pptx` in ONLYOFFICE
   (installed) or PowerPoint → *Export / Save as → PDF*.
4. **Do not rename the section headings.** They are the template's mandated idea
   pointers. Slide 7 of the template (the instruction page) is already removed by
   the script, as the template allows.

## Why the deck is shaped this way

**It answers the brief, not our prototype.** Problem statement 26103 asks for
monitoring to move from *descriptive* reporting to *predictive and prescriptive*
decision support, names two technical demands — comparison of AI/ML against
conventional statistics **(b)**, and attribution of performance to the current CUF
fields versus fields not yet captured **(c)** — and lists nine expected outcomes
**(a)–(i)**. A jury scores against that list, so the deck is built to be ticked off:
slide 3 is labelled `(a)` `(b)` `(c)` and slide 5 is the nine outcomes with an
honest status against each.

**It fills the official template instead of replacing it.** The template requires
the idea-detail pointers to stay, so each pointer phrase is reused **as the slide
heading** (`PROPOSED SOLUTION`, `HOW IT ADDRESSES THE PROBLEM`,
`INNOVATION AND UNIQUENESS OF THE SOLUTION`, `TECHNOLOGIES TO BE USED`,
`METHODOLOGY AND PROCESS FOR IMPLEMENTATION`, `FEASIBILITY`, `CHALLENGES AND RISKS`,
`IMPACT`, `BENEFITS`, `REFERENCES`). The SIH banner, blue footer, slide numbers and
logo placement are untouched; no grey prompt text is left on any slide.

**Slides stay sparse, the argument moves to the notes.** Every slide carries a
speaker script in the `.pptx` notes pane (View → Notes). The slide is what the jury
reads in ten seconds; the notes are what you say.

## The idea in one paragraph

PAIMANA already tells MoSPI what happened across ~2,000 projects worth
₹42.78 lakh crore. PARAKH is the layer that says what is about to change, why, and
what to do about it — on the same monthly data, with no new field entry for any
project administrator. It predicts **drift, not failure**: a project rarely
collapses, its clocks separate. It measures the gap between
**time vs progress**, **money vs progress** and **promise vs record**, ranks by the
widest gap, and puts an **evidence gate** in front of every score so a record that
fails validation is held rather than silently predicted on.

## Slide by slide

**1 · TITLE PAGE** — PARAKH (परख), *from monthly report to monthly decision*, the
required problem-statement fields, and a proof-of-feasibility strip.
*Say:* "परख is the assay you run on something to find out what it is really made
of. We assay the evidence, then forecast the drift."

**2 · IDEA TITLE + PROPOSED SOLUTION** — three columns, one per pointer: the
six-step pipeline (monthly update → verify and trace → pair T→T+1 → predict →
explain and prescribe → early-warning queue), the three questions it answers per
project (what will change, why, what next), and five uniqueness claims. Anchored by
the **three clocks** band at the bottom.
*Say:* the clocks are the original part — slow down here.

**3 · TECHNICAL APPROACH** — the six-step methodology strip, the open-source stack,
and the brief's two demands answered head-on:

- **(a)** cost-escalation model · schedule-delay model · composite risk score, one
  monthly report ahead.
- **(b)** AI/ML versus conventional statistics on identical folds:

  | Outcome, next report | Base rate | Conventional | ML | Shipped |
  |---|---|---|---|---|
  | Cost revised upward | 4.2% | Logistic regression ROC 0.67 · PR 0.13 | XGBoost ROC 0.81 · PR 0.12 | Logistic regression |
  | Completion date moves | 18.1% | Rule-based score ROC 0.57 | XGBoost ROC 0.79 · PR 0.39 | XGBoost |

  **Verdict: ML wins where events are frequent; on rare cost revisions the simpler
  model generalises better, so we ship whichever the strict holdout selects.**
- **(c)** the CUF already carries usable signal as *trajectories* (timeline used
  36%, agency overrun record 23%, delay so far 10%, spend ahead of work 6% of mean
  |SHAP|), plus the ablation plan that tells MoSPI which new field is worth adding.

**4 · FEASIBILITY AND VIABILITY** — technical / economic / operational / data-and-
governance feasibility, a pilot path, a six-row risk→strategy table, the 30-day
finale plan, and the honesty strip (*what we do not claim*).

**5 · IMPACT AND BENEFITS** — the brief's **nine expected outcomes** mapped to
modules with `● working / ◐ in build / ○ finale`, what already works in the
submitted prototype, the audiences, five benefits, the pilot scorecard and the
one-sentence success test.

**6 · RESEARCH AND REFERENCES** — the MoSPI April 2026 report and PAIMANA
dashboard, the OCMS→PAIMANA history, SIH 26103, five method references, the
prototype evidence, open-source/deployment standards and the closing line.

## Where every number comes from

| Slide | Artifact | Field |
|---|---|---|
| 3, 5 | `data/processed/model_metrics.json` | `*_label.temporal_split`, `group_split`, `shap_global_importance` |
| 2, 5 | `data/processed/portfolio_kpis.json` | `total_projects`, `risk_band_counts`, `unique_projects_all_reports` |
| 1, 3, 4, 6 | `data/raw/extraction_quality.json` | `pdf_count`, `rows_extracted`, `rows_review_required`, `reconciliation`, `official_totals` |

The April 2026 portfolio figures (1,981 projects; ₹37.13 / ₹42.78 / ₹20.36 lakh
crore) are read from that report's own `official_totals` block. Scale facts that
come from the brief itself — 17 ministries, 22 sectors, ₹150 crore floor, OCMS
since 2006, MoSPI·DIID and IPMD — are constants at the top of the script.

## If the jury pushes back

- **"Another dashboard?"** The interface is the smallest part. The contribution is
  the three-clock drift measure, the evidence gate, and validation that reports the
  conventional baseline beside the model.
- **"Does AI actually help?"** Where events are frequent, clearly — the ML ranking
  lifts precision 2.2× over the base rate on schedule changes. Where they are rare
  (4.2% cost revisions) we ship the simpler model and say so. That is the honest
  answer to dimension (b) of the brief.
- **"Why should we trust the numbers?"** Ordered month-by-month holdout, project-
  disjoint splits, the conventional method scored on identical folds, and
  extraction that reconciles to the report's own printed totals.
- **"What if the PDF extraction is wrong?"** Records that fail reconciliation are
  held, every value keeps its source page, and no unverified row trains a model.
- **"Which new field should we add to the CUF?"** That is what the ablation plan
  is for: add non-CUF context one block at a time and publish the marginal lift, so
  the department learns what each new field buys before mandating it.
- **"Is a score a probability?"** No, and the product says so — it is a ranking for
  human review; calibration is finale work.
- **"Who acts?"** Authorised officials. PARAKH ranks and explains; it never acts.

## Never claim

- No live MoSPI integration, no automatic alerts, no dispatch, no write-back.
- No measured savings, no reduced delays, no environmental gain — none measured.
- No calibrated probabilities, no "accuracy" percentage, no causal claims from
  attribution.
- Never present unseen-project (group-held-out) numbers as the headline without the
  ordered-month ones beside them.

## Regenerating after a data change

```bash
venv/bin/python src/run_all.py     # rebuilds panel + metrics + KPIs
venv/bin/python src/make_ppt.py    # re-reads them and rewrites the deck
```

Each run prints a layout report — shape bounds, estimated text overflow, text boxes
overlapping each other or a table. A clean run ends with `layout warnings: none`.
