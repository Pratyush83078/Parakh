# Frontend continuity — Duo

Branch: `duo/feature/frontend-cohesion`, based on `antigravity/finish-awwwards`.
Kimi's branch and `kimi.md` are preserved as the original design history.

## Product and route flow

Parakh is report-based decision support for infrastructure monitoring. It is not a live feed or an automatic intervention system.

1. **Overview `/`** — explain the reports, demonstrate a real record, then show the watchlist and model evidence.
2. **Projects `/projects`** — search and filter, inspect reported measures, compare peers, export the displayed records.
3. **Benchmarks `/benchmarks`** — compare ministries, then select a bar or ministry name to open its filtered project list.
4. **How it works `/about`** — plain-language guidance, data flow, generated evaluation metrics, limits, and API links.
5. **Project record and search** — shared native dialogs, keyboard containment, Escape and focus restoration.

## Design direction

Extend Kimi's existing identity instead of replacing the good work: warm paper `#f2efe6`, near-black ink `#191914`, blueprint blue `#2337e0`, Fraunces display type and Geist body text. Use monospace for values and identifiers, not every paragraph. Risk bands retain their labelled semantic colors.

The overview can be expressive; working screens prioritize reading, scanning, and reliable interactions. One persistent responsive header connects every route. No fake live indicator or inflated project counts. Legacy dashboard styles are no longer imported into the active app.

`styles/landing.css` defines the incumbent identity. `styles/workspace.css` extends it to the working routes and fixes shared typography, navigation, evidence-chart styling, and responsive behavior. Unused historical components and styles remain in the repository rather than being deleted as unrelated cleanup.

## Motion

- Persistent active-route underline using Motion shared layout.
- Short page entrances and staggered ministry comparisons, not slow scroll scenes in a data tool.
- Button, row, focus, selection, filter, and dialog interactions share a restrained timing vocabulary.
- Existing GSAP landing choreography retained; magnetic actions use actual motion values and springs.
- Native pointer remains visible. Grain is static rather than animating an oversized fixed layer.
- Reduced motion disables CSS animation and smooth wheel scrolling; dialog content remains scrollable independently of Lenis.

## Reliability and honesty

- URL-driven filters, pagination, and project links survive navigation; obsolete responses cannot overwrite current requests.
- Empty, loading, and retryable error states replace silent failures and invalid ranges.
- Generated model metrics replace hardcoded claims in the guide and drawer.
- The cost-model estimate is explicitly experimental and unreliable for forecasting.
- No simulated dispatch presented as a real official alert.
- The sensitivity sketch is explicitly illustrative, not a rerun of the scoring or prediction pipeline. Missing values remain a limitation; this pass does not retrain or audit the models.
- CSV export means the displayed page or selected record, never an implied full-portfolio export.

## Verification commands

```sh
npm install
npx playwright install chromium
npm run build
npm run test:frontend
```

`test:frontend` creates an isolated production build in `.next-verify/` and tests it on port 3100, so a dev server on port 3000 cannot overwrite its build artifacts. After that build, use `npx playwright test --grep '<test name>'` for focused reruns. Tests cover all routes at desktop/mobile widths, navigation, empty/error states, real API filtering/sorting, stale-request protection, keyboard dialogs, downloads, and reduced motion. Browser screenshots are stored in ignored `test-results/` artifacts. Review those visually as well; DOM tests are not an aesthetic sign-off.

## Verification record — 2026-09-28

- `npm run test:frontend`: production build succeeded; **18 tests passed** in Chromium (25.7 seconds for tests).
- All four routes checked at 1440px and 390px, including computed paper backgrounds, visible headings, navigation, and document overflow. No page JavaScript exceptions in those route checks.
- Nine screenshots captured in `test-results/`. They have not received a human visual review; no claim of Awwwards quality or measured 60fps is made. Safari, Firefox, real-device touch, and a complete accessibility audit remain unverified.
- The first production test attempt failed because dev and production shared `.next`; isolated `.next-verify` builds fixed the conflict. A subsequent run found a real initial-focus defect in search, fixed by focusing after `showModal()`. Test locators also needed to distinguish the application's error from Next.js's route announcer and scroll to a section before its reveal.
- The Impeccable mechanical detector returned no findings for the changed UI targets; this does not replace a visual review.
- `git diff --check` passed. No commits, pushes, or merge requests were made.
- `npm audit` remains non-clean: one moderate and one high finding in the existing Next.js/PostCSS dependency chain. Its suggested fix includes a major Next.js upgrade; left outside this UI change for a separate upgrade decision.

