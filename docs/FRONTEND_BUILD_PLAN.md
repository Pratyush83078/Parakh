# PAIMANA Frontend — My Build Plan

## Stack Chosen
- React 18 + Vite (fast dev, hot reload)
- Recharts (best React charting lib, composable, responsive)
- Lucide React (clean icon set)
- React Router v6 (routing)
- Vanilla CSS with CSS custom properties (dark theme tokens)
- NO Tailwind, NO component libraries — full control

## Pages
1. /               → Dashboard (KPI cards, risk donut, alert feed, ministry chart)
2. /projects       → Searchable/filterable table + project detail drawer
3. /benchmarks     → Ministry + state rankings with charts
4. /about          → How it works (for judges)

## Key Design Decisions
- Dark navy theme: bg #0a0e1a, card #111827, border rgba(255,255,255,0.06)
- Risk color system: Critical=#ef4444, High=#f97316, Medium=#eab308, Low=#22c55e
- Accent: #818cf8 (indigo-400) for interactive + AI elements
- Typography: Inter (Google Fonts)
- All numbers formatted in Indian number system (₹39.08L Cr, 2,059)
- API base: http://localhost:5001

## What Each Section Shows (from real data)
- KPI Strip: 2059 projects · ₹39.08L Cr original · ₹43.2L Cr revised · ₹5.63L Cr overrun · 184 flagged
- Risk Donut: Critical 13 (0.6%) / High 171 (8.3%) / Medium 831 / Low 1044
- Driver Bar: Slow Progress 918 > Schedule Delay 750 > Cost Escalation 319
- Ministry Chart: Railways ₹1.89L Cr > Water Res ₹1.03L Cr > Petroleum ₹72k Cr
- Alert Feed: 13 Critical projects with risk scores, overrun %, delay, ML probs
- Projects Table: all 2059, filterable by band/ministry/state/driver, search by name/code
- Project Drawer: financial snapshot, risk gauge bars, ML probability meters, peer comparison, AI text
