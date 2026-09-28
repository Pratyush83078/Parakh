# Project status checklist

Updated 29 September 2026. This tracks current capabilities and the next meaningful work; it does not assign speculative completion percentages.

## Available in the prototype

- [x] Extract monthly OCMS and PAIMANA PDF reports with per-report quality outcomes and source provenance.
- [x] Preserve parseable warning rows while keeping review-required data out of verified risk outputs.
- [x] Build a project-month panel using official IDs for longitudinal matching.
- [x] Calculate a deterministic current-state score, component drivers, and available-signal coverage.
- [x] Compare logistic regression and gradient boosting for next-report cost and schedule events using project-group and chronological evaluations.
- [x] Serve generated portfolio, project, benchmark, model-evidence, and source-page information in the Next.js app.
- [x] Show model caveats and source PDF/page links in project views; document the evidence in “How it works.”

## Known limits

- [ ] Resolve OCMS revised-cost reconciliation before verifying those reports.
- [ ] Repeat chronological model evaluation over multiple future report transitions; cost prediction is currently weak and probabilities are uncalibrated.
- [ ] Add a reviewer interface to resolve row warnings and record a disposition.
- [ ] Add authentication and roles before storing real reviewer actions.
- [ ] Record interventions and outcomes before making impact claims or sending notifications.

## Later, evidence-dependent work

- [ ] Assess SHAP or another explanation method against existing rule drivers and permutation importance.
- [ ] Evaluate additional models, including any proposed non-generative model, only on the same held-out protocol and only if it improves evidence.
- [ ] Add month-range controls, notification workflows, or an assistant after data review and user roles are established.
- [ ] Polish animations and layout without obscuring provenance, quality state, or model limitations.

See [the roadmap](PROJECT_IMPROVEMENT_ROADMAP.md) and [documentation hub](docs/README.md) for details.
