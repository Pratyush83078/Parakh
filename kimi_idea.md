# kimi_idea.md — Parakh landing, design v2 ("exceptional, not generic")

> Context handoff for any AI/dev continuing this work. Branch: `kimi/awwwards-redesign`.
> Read `kimi.md` first (project flow + design system v1). This file is the v2 push.

## What exists today (post-merge, working)

- Landing story in `components/landing/*`, composed in `app/page.jsx`, styles in `styles/landing.css`.
- Motion: GSAP + ScrollTrigger (`lib/gsap.js`), Lenis (`motion/SmoothScroll.jsx`), Motion magnetic
  buttons, `AuroraField` canvas gradient in hero, velocity-reactive GSAP ticker, hero intro timeline,
  card pointer-tilt, `Reveal`/`SplitWords` primitives (glue bug fixed: nbsp inside `.ln-w-inner`).

## Verified problems (Playwright screenshots, 1440×900)

1. **Static feel**: sections fade up once and never move again. No counters, no scrub moments below
   the hero, dark "Evidence" room just sits there.
2. **Problem month bars invisible**: `Problem.jsx` runs `useGSAP` once with no `dependencies` —
   KPI data lands after mount, new `.ln-month-bar` nodes never get animated, and the from-tween
   leaves them at scaleY 0. Same fragility class in any chart animating async data.
3. **Method weights meaningless**: `--fill` hardcoded `55+i*9%` instead of proportional to the
   actual weights (30/25/20/15/10). Five equal-feeling blue blocks = generic.
4. **Ticker reads sparse**: 3.2rem double gaps, tiny type, no hierarchy between value and label.
5. **Grain too timid**: overlay at 0.055 barely reads; gradients look smooth, not "grainy gradient".

## v2 plan (in priority order)

1. **Fix chart animation races** — every data-driven `useGSAP` gets `dependencies: [kpis]` and a
   guard; from-tweens only bind to nodes that exist post-data.
2. **Count-up numbers** — hero facts, portfolio band counts, problem bars: `gsap.from` on
   `textContent` via a small `CountUp` component (mono font, tabular nums, snaps on enter).
3. **Problem figure redesign** — bars normalized to a baseline (min value) so the 1,981→1,775
   decline is visible; annotate the −299 leak with a red delta chip; bars scaleY on enter (fixed dep).
4. **Method weights** — fill height = `w/30*100%`; number counts up; hover lifts the active weight.
5. **Ghost mega-words** — one outlined Fraunces word ("EARLY WARNING", "EVIDENCE") drifting
   horizontally on scrub behind section transitions. Pure `xPercent` scrub, `opacity .05`, cheap.
6. **Evidence curtain** — dark section enters with a scrubbed clip-path rise (bottom→up) so the
   "serious room" feels entered, not scrolled to. CoinFlipScale markers pulse on enter.
7. **Ticker presence** — bigger mono type, value bold + label dim, hairline separators, blue pulse
   dot; keep the velocity-skew engine.
8. **Grain you can feel** — grain overlay to ~0.08 with `overlay` blend on light sections; evidence
   orbs get noise-via-turbulence so gradients themselves are grainy (the look from the refs).
9. **Watchlist rows** — stagger-in already there; add left-border accent on Critical rows + row
   hover translate-x micro-nudge.

## Non-goals / do-not-break

- Do NOT touch `/projects`, `/benchmarks`, `/about`, `app/api/*`, `lib/dataEngine.js`.
- Keep `--ln-paper: #f2efe6` (tests assert body bg = rgb(242,239,230)).
- Keep `.st-marker` absolute in CoinFlipScale (E2E asserts it); restyle only via overrides.
- Tests: `npm run test:frontend` (build + playwright). Reduced-motion must render final states.
- Every number from the API/metrics JSON. No invented claims (CLAUDE.md rules).

## Done log (v2)

- [ ] kimi_idea.md written
- [ ] animation race fixes
- [ ] CountUp + hero/portfolio counters
- [ ] Problem figure + Method weights redesign
- [ ] Ghost words + Evidence curtain
- [ ] Ticker/grain/row polish
- [ ] Screenshots re-audit → build green → commit
