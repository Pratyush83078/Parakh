# 🎯 PAIMANA AI — Feature & Progress Checklist
> **Comprehensive Tracking Sheet: Completed vs. Remaining vs. Planned Work**  
> *Last Updated: September 2026*

---

## 📊 Quick Status Summary

| Area                                    | Completed | Remained / To Do | Status　　　　　　|
| :----------------------------------------| :---------:| :----------------:| :-----------------:|
| **1. ML Engine & Data Pipeline**        | 8         | 1                | 🟢 89% Done　　　　|
| **2. Backend REST APIs**                | 7         | 2                | 🟡 78% Done　　　　|
| **3. UI / UX Dashboard & Visuals**      | 12        | 3                | 🟢 80% Done　　　　|
| **4. Layout & Design System Polish**    | 5         | 2                | 🟡 71% Done　　　　|
| **5. Repository & Folder Hygiene**      | 2         | 2                | 🔴 50% Done　　　 |
| **6. Advanced Features & Intelligence** | 2         | 5                | 🔴 29% Done　　　 |
| **Total Overall Score**                 | **36**    | **15**           | **~71% Complete** |

---

## 1. Machine Learning & Data Ingestion Pipeline

- [x] **PDF Coordinate Extraction (`src/pdf_extracter.py`)**: Automatic parsing of wrapped tabular data from MoSPI Flash Report Table 6 using word bounding boxes.
- [x] **Data Ingestion & Cleaning (`src/data_loader.py`)**: Standardizing column types, handling missing dates, and structuring into panels.
- [x] **Feature Engineering (`src/features.py`)**: Engineering the 13 core metrics:
  - [x] Progress Gap (`physical_progress - expected_progress`)
  - [x] Expenditure Utilization % (`cumulative_expenditure / revised_cost`)
  - [x] Spend vs. Progress Divergence
  - [x] Calendar DOC delay in months
  - [x] Historical revision frequency counts
- [x] **Multi-Criteria Rule-Based Risk Engine**: Weighted scoring formula ($0.30 \times \text{cost} + 0.25 \times \text{delay} + 0.20 \times \text{progress} + 0.15 \times \text{spend} + 0.10 \times \text{revisions}$).
- [x] **Automated Risk Bounding & Bands**: Discrete assignment into `Low`, `Medium`, `High`, and `Critical`.
- [x] **Primary Risk Driver Identification**: Automatic detection of the largest contributor to project distress.
- [x] **Dual Supervised Binary Classification (`src/model_train.py`)**:
  - [x] Logistic Regression baseline model (Statistical benchmark for SIH compliance).
  - [x] Gradient Boosting Classifier champion model (Predicting cost jumps and schedule slippages next month).
- [x] **Model Serialization**: Saving trained weights (`.joblib`) and latest snapshot JSON into `data/processed/`.
- [ ] **Automated Retraining Script / Cron Trigger**: Ability to drop a new monthly PDF and automatically regenerate models and snapshots via CLI or webhook.

---

## 2. Backend REST Microservices (`app/api/`)

- [x] **Next.js 15 App Router Server Architecture**: Single unified port (3000) for frontend and backend with zero CORS friction.
- [x] **`GET /api/health`**: Healthcheck endpoint returning uptime, framework metadata, and loaded project count.
- [x] **`GET /api/kpis`**: Returns portfolio aggregates (total projects, sanctioned budget, revised cost, overrun, average risk).
- [x] **`GET /api/filters`**: Dynamic distinct list of all ministries, states, risk bands, and risk drivers for dropdowns.
- [x] **`GET /api/alerts`**: Critical and High risk projects sorted by risk severity for priority display.
- [x] **`GET /api/benchmarks`**: Aggregate performance and delay metrics grouped by central ministry.
- [x] **`GET /api/projects/:code`**: Single project detail fetcher with calculated analytics and rule-based diagnostic assessment.
- [x] **`GET /api/projects/:code/peers`**: Peer cohort comparison endpoint matching projects by same ministry and state.
- [ ] **API Payload Optimization & Deduplication**:
  - [ ] Strip redundant `cost_revised_up_label_pred_proba` and `schedule_slipped_label_pred_proba` (keep only `_risk_pct`).
  - [ ] Remove duplicate `ai_assessment` from nested `analytics` object.
  - [ ] Standardize property names (`doc_slip_months` instead of mixed names).
- [ ] **Two-Tier API Response (Summary List vs. Full Detail)**:
  - [ ] Make `GET /api/projects` return lightweight table objects to reduce list payload size from 1.7 MB to <200 KB.

---

## 3. UI / UX Dashboard & Core Experience

- [x] **Swiss Technical Minimalist Design System (`styles/Supermemory.css`)**: Precision hairline borders, drafting gridlines, corner brackets, and monospaced data callouts.
- [x] **Portfolio Executive Command Center (`app/page.jsx`)**:
  - [x] Macro KPI metric cards with visual trend indicators.
  - [x] Real-time full-text search across project name, code, ministry, agency, and state.
  - [x] Multi-band risk filtering pills (Critical, High, Medium, Low).
  - [x] Ministry and State cascading dropdown selectors.
  - [x] Column sorting (by risk score, budget, delay months, cost overrun).
  - [x] Server-side / client pagination controls.
- [x] **Project Detail Slide-Over Drawer (`components/ProjectDrawer.jsx`)**:
  - [x] S-curve / timeline trajectory overview.
  - [x] Dual financial and physical completion bars.
  - [x] Primary risk driver callout card.
  - [x] Automated AI assessment diagnostic text.
  - [x] Peer ministry cohort benchmark comparison.
- [x] **Command Palette (`components/CommandPalette.jsx`)**:
  - [x] Global `Cmd+K` keyboard shortcut for instant project lookup and navigation.
- [x] **Ministry Benchmarking Page (`app/benchmarks/page.jsx`)**:
  - [x] Comparative ministry ranking table by total overrun and average project delay.
- [x] **System Architecture & Specs Page (`app/about/page.jsx`)**:
  - [x] Comprehensive architecture diagram, ML methodology explanation, and sample REST API telemetry.
- [x] **Interactive Data Charts (`components/charts/`)**:
  - [x] Dual-line progress vs. expenditure charts.
  - [x] Risk distribution scatter / distribution plots.
- [x] **Backtest & Model Evaluation Panel (`components/BacktestSection.jsx`)**:
  - [x] Visual proof of ML discrimination (ROC-AUC and PR-AUC scores).
- [x] **Dark / Light Mode Theme Controller (`components/ThemeController.jsx`)**:
  - [x] Seamless toggling between light drafting mode and dark terminal mode.
- [ ] **Empty State UX**:
  - [ ] Sleek fallback card when search returns 0 projects with a one-click **"Reset All Filters"** button.
- [ ] **URL Query Sync (Deep-Linking)**:
  - [ ] Sync search text and filter selections directly into the URL (`?search=...&ministry=...&band=...`) so views can be bookmarked and shared.
- [ ] **Table Skeleton Loading States**:
  - [ ] Polished shimmer skeletons during search/filter transitions instead of jarring content shifts.

---

## 4. Layout Spacing & Design System Polish

- [x] Fixed left sidebar navigation (`.sm-sidebar`) with active page indicator.
- [x] Technical corner brackets and drafting headers on cards.
- [x] Monospaced font hierarchy for currency numbers, dates, and percentages.
- [x] Mascot helper dialogue component (`components/Mascot.jsx`).
- [x] Status badge indicators (Critical = Red, High = Orange, Medium = Amber, Low = Green).
- [ ] **Sidebar Left Gap Improvement**:
  - [ ] Increase screen-to-sidebar outer margin (`left` on `.sm-sidebar`) for an executive floating look.
  - [ ] Increase sidebar-to-content gutter (`padding-left` on `.sm-app-container`) to eliminate visual crowding.
- [ ] **Brand Identity & Favicon**:
  - [ ] Replace default browser icon with custom geometric SVG radar/gauge favicon.
  - [ ] Add customized `<title>` and `<meta>` tags for all routes.

---

## 5. Repository & Folder Structure Hygiene

- [x] Root `app/`, `components/`, `lib/`, `src/`, `data/`, and `styles/` core architecture established.
- [x] Clean separation of Python ML pipeline (`src/`) and Next.js frontend/API (`app/`).
- [ ] **Delete Abandoned Legacy Folders**:
  - [ ] Delete `/backend` (contains only an orphaned `node_modules` from an old setup).
  - [ ] Delete `/frontend` (contains only `dist/` and `node_modules` from an old Vite test).
- [ ] **Sanitize Project Root Directory**:
  - [ ] Move loose screenshot `2026-09-18_05-33-58.png` and `image.png` into `docs/assets/` or delete.
  - [ ] Delete temporary scratch file `fix.md`.
  - [ ] Move loose presentation files `SIH26103_IDEAL_PRESENTATION_INFRALENS.pdf` and `SIH_PPT_EVALUATION_AND_WINNING_GUIDE.md` into `docs/presentation/`.

---

## 6. Advanced Features & Intelligence (What We Will Do Next)

- [x] **Prototype What-If Components**: Base UI slider components created (`components/WhatIfSimulator.jsx` and `components/PrecisionSlider.jsx`).
- [x] **Rule-Based Assessment Generator**: Heuristic template engine that produces diagnostic sentences based on risk severity.
- [ ] **Interactive "What-If" Sensitivity Sandbox (Live Recalculation)**:
  - [ ] Embed directly into the Project Drawer.
  - [ ] Live sliders for budget escalation (+10% to +50%), timeline slip (+3 to +24 months), and expenditure speedup.
  - [ ] Real-time client-side recomputation of the `risk_score` formula showing "Current vs. Projected Risk" delta badge.
- [ ] **Generative AI "Ministerial Briefing" Agent**:
  - [ ] Dedicated "Ask AI" tab or drawer.
  - [ ] 1-click **"Generate Executive Memo"** button that synthesizes a 3-bullet minister-ready intervention memo using an LLM.
  - [ ] Natural language Q&A: *"Why is this railway project delayed?"*, *"Compare against peer projects in the same state"*.
- [ ] **Executive Export Suite (PDF & CSV)**:
  - [ ] **1-Page MoSPI Executive Dossier (PDF)**: Print-ready vector PDF export of any project containing KPIs, risk score, peer comparison, and mitigation actions.
  - [ ] **CSV Export**: Download filtered dashboard table rows as a clean `.csv` for offline spreadsheet analysis.
- [ ] **Ministerial Priority Watchlist**:
  - [ ] Star / Bookmark button on project rows to pin critical projects.
  - [ ] Persistent storage (`localStorage`) so pinned projects remain across sessions.
  - [ ] Dashboard filter tab: `[ All Projects | Watchlist (★ 3) | Critical Only ]`.
- [ ] **Mobile & Tablet Responsive Overhaul**:
  - [ ] Collapse desktop sidebar into a mobile top bar + slide-out navigation sheet for screens $< 1024px$.
  - [ ] Responsive project cards for mobile screens so wide 8-column tables don't cause awkward horizontal scrolling.

---

## 📝 How to Use This Checklist
* When you are ready to begin any feature, specify the item (e.g., *"Let's do folder cleanup"* or *"Increase the sidebar left gap"*).
* As each task is completed, we will change `[ ]` to `[x]` to maintain an accurate real-time tracker of the project's journey to 100% completion.
