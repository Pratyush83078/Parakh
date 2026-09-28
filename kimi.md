# kimi.md — Parakh Awwwards Redesign (branch: kimi/awwwards-redesign)

> Working plan + future context for the redesign of the Parakh (परख) landing experience.
> Written 2026-09-28. Owner said: "you are the head of project."

---

## 1. What this project actually does (the honest version)

**Parakh** (SIH 26103, "INFRLENS") reads MoSPI's monthly **PAIMANA Flash Reports** — PDFs the Government of
India publishes about every central infrastructure project worth ₹150+ crore (highways, railways,
refineries, power grids). It turns those PDFs into an **early-warning radar**:

- **Today (rules engine)**: an open, hand-checkable 0–100 risk score per project (cost overrun 30,
  schedule slip 25, progress gap 20, spend divergence 15, revisions 10).
- **Next report (ML engine)**: gradient boosting estimates the chance a project's completion date
  (or cost) moves in the *next* monthly report. Slip model holds up forward in time
  (temporal ROC-AUC ~0.75 vs 0.53 rule score). **Cost model does NOT generalise forward** — never
  demo it as a forecaster (see CLAUDE.md "Measured facts").
- Every project gets a band: Low / Medium / High / Critical, plus a plain-language main driver
  (e.g. "Slow Physical Progress").

**Live numbers (July 2026 report, from `data/processed/portfolio_kpis.json`):**
1,775 projects · ₹33.70 lakh cr approved → ₹37.11 lakh cr revised (+10.1%) ·
bands 875 Low / 742 Medium / 144 High / 14 Critical · panel 7,590 project-months, 2,074 projects.

**Hard rules (from CLAUDE.md):** every number on screen must come from the API/data pipeline, never
a literal. No invented accuracy claims. Predictions = decision support for human review.

## 2. The flow — how a non-technical visitor should understand it

Narrative question: *"The government finds out a project failed after the money is gone. What if it
knew one report earlier?"*

```
 1. HOOK (hero)        "Spot the projects about to slip — before the next report says so."
                        Live proof card: one real flagged project, annotated. Big serif type, grain.
 2. THE SCALE (ticker)  Marquee of the portfolio's vital signs: 1,775 projects, ₹37.11 lakh cr,
                        14 critical. Makes the stakes physical.
 3. THE PROBLEM         The Flash Report is a rear-view mirror. Bar chart of projects/month shows
                        the list shrinking (1,981 → 1,775) — by the time you read it, it's history.
 4. THE METHOD          PDF → clean panel → open rule score → ML early warning. 4 steps, numbered,
                        with the actual source files named. Transparency = trust.
 5. THE PORTFOLIO       Where things stand: band distribution bar + top risk drivers, animated in.
 6. THE WATCHLIST       The payoff: a live, searchable table of the highest-risk projects.
                        Click → full record drawer. This is the product.
 7. THE EVIDENCE (dark) "Does ML beat simple rules?" — honest coin-flip scale. Dark, grainy,
                        serious. This is where credibility is won.
 8. THE LIMITS          What it can't do yet. 4 blunt admissions. (Awwwards sites have swagger;
                        government tools earn trust by admitting edges.)
 9. RUN IT              Open source, 3 commands. CTA + footer wordmark.
```

Route map stays: `/` (this story) · `/projects` (full explorer) · `/benchmarks` (ministry cohorts) ·
`/about`. Home bypasses the dashboard shell (AppShell already does this).

## 3. Art direction — "Blueprint on paper"

Synthesised from the owner's references (Dia, Dualite, Hermes/Nous, GenMotion, Pushary).
**New identity, no copied assets.**

| Token | Value | Use |
|---|---|---|
| `--paper` | `#f2efe6` warm cream | page background |
| `--ink` | `#191914` | text, hairlines |
| `--blue` | `#2337e0` electric blueprint blue | primary accent, links, key data |
| `--signal` | `#cd4239` / `#e06a14` / `#c49206` / `#2c8c66` | risk bands (unchanged, semantic) |
| `--saffron` / `--leaf` | `#e8a33d` / `#2c8c66` | gradient orbs only (subtle India nod) |

- **Grain**: fixed full-viewport SVG `feTurbulence` noise overlay at ~5% opacity + `mix-blend-mode`.
  Gradient orbs (blue/saffron/leaf, blurred) drift slowly behind hero + evidence sections.
- **Typography**: Fraunces (variable serif, `SOFT`/`opsz`) for display — editorial, premium;
  Geist for body; Geist Mono (uppercase, tracked) for labels/eyebrows/numbers; Tiro Devanagari
  for the परख wordmark. Display sizes clamp 3–7rem, tight leading, `-0.02em`.
- **Texture detail**: hairline rules (1px ink @ 15%), index numbers in mono, section eyebrows like
  `01 — THE PROBLEM`. Tables get generous row hover states.
- **Dark field**: Evidence section inverts to near-black `#12120f` with blue glow grain —
  the "serious room" of the site.

## 4. Motion system (awwwards-animations skill)

Stack: **GSAP 3 + ScrollTrigger + @gsap/react** (primary) · **Lenis** (sole smooth-scroll engine,
wired to ScrollTrigger) · **Motion** for spring micro-interactions (magnetic buttons).

- `lib/gsap.js` — registers plugins once. `components/motion/SmoothScroll.jsx` — Lenis root.
- **Hero intro timeline**: eyebrow → headline lines (clip-path yPercent stagger) → lead → facts →
  CTAs → proof card (slide + settle). ~1.6s total, readable before it finishes.
- **Custom cursor**: ink dot + trailing ring, `mix-blend-difference`; scales on interactive hover
  (`data-cursor` attrs). Disabled on touch / reduced motion.
- **Scroll choreography**: every section heading word-reveal; cards/tables stagger up; the
  portfolio band bar scaleX-grows; risk-driver bars fill on enter; hero orbs parallax at
  different rates; proof card gets a subtle scroll tilt.
- **Micro**: magnetic CTAs (spring stiffness 150/damping 15), marquee ticker (CSS loop, pauses on
  hover), counters tween to real KPI values, number flash on HeroSlip "next project".
- **Accessibility/perf**: `prefers-reduced-motion` → Lenis off, final states rendered immediately;
  transform/opacity only; `useGSAP` scoped cleanup; ScrollTrigger.refresh() after data loads;
  no library heavier than gsap/lenis/motion added.

## 5. File map (new/changed on this branch)

```
kimi.md                              ← this file
lib/gsap.js                          ← plugin registration
components/motion/SmoothScroll.jsx   ← Lenis + ScrollTrigger wiring
components/motion/Cursor.jsx         ← custom cursor
components/motion/MagneticButton.jsx ← spring magnetic wrap
components/landing/*.jsx             ← Hero, Ticker, Problem, Method, Portfolio, Watchlist,
                                       Evidence, Limits, RunIt, Footer (one per section)
app/page.jsx                         ← recomposed from landing sections (data via useApi)
styles/landing.css                   ← the design system (imported in globals.css)
app/layout.jsx                       ← Fraunces font + grain overlay mount
```

Untouched: `app/api/*`, `lib/dataEngine.js`, `/projects`, `/benchmarks`, `/about`, dashboard CSS.
Old `styles/story.css` stays until branch is merged (referenced only by legacy page).

## 6. Build log

- [x] Branch `kimi/awwwards-redesign`
- [x] Skill `awwwards-animations` installed to `.agents/skills/` (npx skills add)
- [ ] npm: gsap @gsap/react lenis motion
- [ ] Landing sections built
- [ ] Browser validation (desktop + mobile widths, reduced motion)
- [ ] `npm run build` clean
- [ ] Commit
