'use client';

import { useMemo, useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import ProjectDrawer from '@/components/ProjectDrawer';
import SmoothScroll from '@/components/motion/SmoothScroll';
import Cursor from '@/components/motion/Cursor';
import LandingNav from '@/components/landing/LandingNav';
import Hero from '@/components/landing/Hero';
import Ticker from '@/components/landing/Ticker';
import Problem from '@/components/landing/Problem';
import Method from '@/components/landing/Method';
import Portfolio from '@/components/landing/Portfolio';
import Watchlist from '@/components/landing/Watchlist';
import Evidence from '@/components/landing/Evidence';
import Limits from '@/components/landing/Limits';
import Brief from '@/components/landing/Brief';
import RunIt from '@/components/landing/RunIt';
import Footer from '@/components/landing/Footer';
import metrics from '@/data/processed/model_metrics.json';
import { ScrollTrigger } from '@/lib/gsap';

export default function Home() {
  const { data: kpis, error: kErr } = useApi(api.kpis);
  const { data: alertsData, loading: aLoading, error: aErr } = useApi(() => api.alerts(50));

  const [selected, setSelected] = useState(null);
  const [peers, setPeers] = useState(null);
  const [query, setQuery] = useState('');

  async function openProject(code) {
    const [proj, peerData] = await Promise.all([api.project(code), api.peers(code).catch(() => null)]);
    setSelected(proj);
    setPeers(peerData);
  }

  const flaggedAll = Array.isArray(alertsData) ? alertsData : alertsData?.projects || alertsData?.data || [];
  const flagged = useMemo(() => {
    if (!query) return flaggedAll;
    const q = query.toLowerCase();
    return flaggedAll.filter((p) => [p.project_code, p.project_name, p.ministry, p.state].some((v) => String(v || '').toLowerCase().includes(q)));
  }, [flaggedAll, query]);
  const shown = flagged.slice(0, 12);

  // Data arrives after first paint — re-measure scroll positions.
  useEffect(() => {
    if (!kpis) return;
    const t = setTimeout(() => ScrollTrigger.refresh(), 150);
    return () => clearTimeout(t);
  }, [kpis, alertsData]);

  return (
    <SmoothScroll>
      <div className="ln-page">
        <Cursor />
        <div className="ln-grain" aria-hidden="true" />
        <LandingNav />

        <main>
          {/* 1 — Hook: the hero with live proof card */}
          <Hero kpis={kpis} kErr={kErr} flagged={flaggedAll.slice(0, 5)} onInspect={openProject} />

          {/* 2 — Scale: vital-signs ticker */}
          <Ticker kpis={kpis} />

          {/* 3 — The problem: rear-view mirror */}
          <Problem kpis={kpis} months={metrics.months} />

          {/* 4 — The method: PDF → panel → score → ML */}
          <Method kpis={kpis} monthsCount={metrics.months.length} />

          {/* 5 — The portfolio: band distribution + top drivers */}
          <Portfolio kpis={kpis} />

          {/* 6 — The watchlist: live searchable high-risk table */}
          <Watchlist
            flagged={flagged} shown={shown} total={flagged.length}
            query={query} setQuery={setQuery}
            loading={aLoading} error={aErr} onInspect={openProject}
          />

          {/* 7 — The evidence: does ML beat rules? */}
          <Evidence metrics={metrics} />

          {/* 8 — The limits: honest admission of edges */}
          <Limits kpis={kpis} metrics={metrics} />

          {/* 9 — Against the brief: SIH 26103 requirement map */}
          <Brief />

          {/* 10 — Run it: open source, 3 commands */}
          <RunIt />
        </main>

        <Footer metrics={metrics} />

        {selected && <ProjectDrawer project={selected} peers={peers} onClose={() => setSelected(null)} />}
      </div>
    </SmoothScroll>
  );
}
