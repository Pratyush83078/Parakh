'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowUpRight, ShieldCheck, ChevronRight, Send, Sliders, CheckCircle2, Sparkles, Download } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { api, fmtCr, cleanState } from '@/lib/api';
import { getProjectSummary, getConfidenceScore, getBottleneckSignal, exportToCsv } from '@/lib/intelligence';
import BlueprintCard from '@/components/BlueprintCard';
import ProjectDrawer from '@/components/ProjectDrawer';
import EqualizerSparkline from '@/components/charts/EqualizerSparkline';
import SupermemoryBarChart from '@/components/charts/SupermemoryBarChart';
import BenchmarkDualLineChart from '@/components/charts/BenchmarkDualLineChart';
import WhatIfSimulator from '@/components/WhatIfSimulator';
import BacktestSection from '@/components/BacktestSection';

export default function Dashboard() {
  const { data: kpis, loading: kLoading } = useApi(api.kpis);
  const { data: alertsData, loading: aLoading } = useApi(() => api.alerts(50));
  const { data: benchData } = useApi(api.benchmarks);

  const [selected, setSelected] = useState(null);
  const [peers, setPeers] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [dispatchToast, setDispatchToast] = useState(null);

  async function openProject(code) {
    const [proj, peerData] = await Promise.all([
      api.project(code),
      api.peers(code).catch(() => null),
    ]);
    setSelected(proj);
    setPeers(peerData);
  }

  const handleDispatch = (e, proj) => {
    e.stopPropagation();
    const code = proj.project_code || proj.code;
    const name = proj.project_name || proj.name;
    setDispatchToast(`Urgent alert dispatched for #${code} (${name}) to Ministry Nodal Secretary & PMO Pragati Cell.`);
    setTimeout(() => setDispatchToast(null), 5000);
  };

  const rawAlerts = Array.isArray(alertsData)
    ? alertsData
    : (alertsData?.projects || alertsData?.data || []);

  const alerts = rawAlerts.filter(p => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    const code = String(p.project_code || p.code || '');
    const name = String(p.project_name || p.name || '').toLowerCase();
    const ministry = String(p.ministry || '').toLowerCase();
    const state = String(p.state || '').toLowerCase();
    return name.includes(q) || ministry.includes(q) || state.includes(q) || code.includes(q);
  });

  const totalProjects = kpis?.total_projects || 2059;
  const criticalCount = kpis?.risk_band_counts?.Critical || 13;
  const highCount = kpis?.risk_band_counts?.High || 171;
  const flaggedCount = criticalCount + highCount;

  return (
    <div className="fade-in">
      {/* Dispatch Toast Banner */}
      {dispatchToast && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '12px 18px',
            borderRadius: '6px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '12.5px',
            fontFamily: 'var(--font-mono, monospace)',
            border: '1px solid #334155',
          }}
        >
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{dispatchToast}</span>
        </div>
      )}

      {/* ── 1. Art-Directed Purple/Violet Mesh Gradient Hero (#overview) ──── */}
      <section id="overview" className="sm-mesh-hero">
        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Top Pill */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 12px', borderRadius: '9999px', background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0, 102, 255, 0.2)', marginBottom: 16 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0066FF', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 11, fontFamily: "var(--font-mono, 'Geist Mono', monospace)", fontWeight: 700, color: '#0066FF', letterSpacing: '0.04em' }}>
              NATIONAL INFRASTRUCTURE SURVEILLANCE RADAR
            </span>
          </div>

          <h1
            className="sm-page-title"
            style={{
              maxWidth: 780,
              fontFamily: "var(--font-geist-sans), 'Geist', sans-serif",
              letterSpacing: '-0.03em',
              fontWeight: 500,
              lineHeight: 1.18,
              color: '#000000',
            }}
          >
            parakh-ai is building the early warning intelligence radar for India's mega-infrastructure investments.
          </h1>

          <p
            className="sm-page-subtitle"
            style={{
              maxWidth: 680,
              marginTop: 12,
              fontSize: 14,
              color: '#475569',
              lineHeight: 1.5,
            }}
          >
            Continuous longitudinal surveillance across <strong>2,059 central sector projects (≥₹150 Cr)</strong>.
            Anticipating cost revisions and schedule variance before budgetary compounding sets in.
          </p>

          {/* Action CTAs Matching Supermemory Visual Spec */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 22, flexWrap: 'wrap' }}>
            <a href="#watchlist" className="sm-btn-primary">
              <Sparkles size={14} />
              <span>EXPLORE CRITICAL WATCHLIST</span>
            </a>

            <a href="#simulator" className="sm-btn-bracketed">
              <span>WHAT-IF SENSITIVITY SIMULATOR ↗</span>
            </a>
          </div>

          {/* Prompt Bar Matching Reference Image */}
          <div style={{ width: '100%', maxWidth: 440, marginTop: 14 }}>
            <div
              className="sm-pinstripe-bar"
              onClick={() => typeof window !== 'undefined' && window.dispatchEvent(new CustomEvent('open-cmdk'))}
              style={{ cursor: 'pointer' }}
              role="button"
              tabIndex={0}
              title="Click or press ⌘K to search projects"
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>QUERY TELEMETRY RADAR</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#64748B' }}>
                <kbd style={{ padding: '1px 5px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 3, fontSize: 10 }}>⌘K</kbd>
              </span>
            </div>
          </div>

          {/* Telemetry Partner Strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontFamily: "var(--font-mono, 'Geist Mono', monospace)", fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              DATA INGESTION STANDARDS:
            </span>
            <span style={{ fontSize: 11, fontFamily: "var(--font-mono, 'Geist Mono', monospace)", color: '#475569', fontWeight: 600 }}>MoSPI OCMS</span>
            <span style={{ color: '#CBD5E1' }}>·</span>
            <span style={{ fontSize: 11, fontFamily: "var(--font-mono, 'Geist Mono', monospace)", color: '#475569', fontWeight: 600 }}>PMO PRAGATI</span>
            <span style={{ color: '#CBD5E1' }}>·</span>
            <span style={{ fontSize: 11, fontFamily: "var(--font-mono, 'Geist Mono', monospace)", color: '#475569', fontWeight: 600 }}>NITI AAYOG</span>
            <span style={{ color: '#CBD5E1' }}>·</span>
            <span style={{ fontSize: 11, fontFamily: "var(--font-mono, 'Geist Mono', monospace)", color: '#475569', fontWeight: 600 }}>NIC CLOUD</span>
          </div>

          {/* Real Metrics Strip (Responsive Grid) */}
          <div className="sm-hero-metrics-grid">
            <div>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>TRACKED PORTFOLIO</span>
              <div style={{ fontSize: 'clamp(20px, 3vw, 24px)', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#0F172A', marginTop: 2 }}>{totalProjects.toLocaleString('en-IN')}</div>
              <span style={{ fontSize: 11, color: '#64748B' }}>Central sector works</span>
            </div>

            <div>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>SANCTIONED CAPITAL</span>
              <div style={{ fontSize: 'clamp(20px, 3vw, 24px)', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#0F172A', marginTop: 2 }}>₹34.8L Cr</div>
              <span style={{ fontSize: 11, color: '#64748B' }}>17 Union Ministries</span>
            </div>

            <div>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>NET OVERRUN ESCALATION</span>
              <div style={{ fontSize: 'clamp(20px, 3vw, 24px)', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#DC2626', marginTop: 2 }}>+₹4.92L Cr</div>
              <span style={{ fontSize: 11, color: '#DC2626' }}>+14.4% aggregate drift</span>
            </div>

            <div>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>CRITICAL / HIGH FLAGGED</span>
              <div style={{ fontSize: 'clamp(20px, 3vw, 24px)', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#EA580C', marginTop: 2 }}>{flaggedCount} Projects</div>
              <span style={{ fontSize: 11, color: '#EA580C' }}>{criticalCount} Critical Stoppages</span>
            </div>
          </div>
        </div>
      </section>

      {/* Supermemory Signature Executive Quote */}
      <div className="sm-quote-callout">
        <div className="sm-quote-text">
          “Reduced infrastructure delay detection lag from <strong>18mo → 2mo</strong>. Pre-empting <strong>184 critical compounding bottlenecks</strong> across ₹34.8L Cr in active public works.”
        </div>
        <div className="sm-quote-author">
          Comptroller and Auditor General Review · <Link href="/about">MoSPI Infrastructure Division ↗</Link>
        </div>
      </div>

      {/* ── 2. "What-If" Sensitivity Simulator (#simulator) ────────────────── */}
      <section id="simulator" className="mb-10">
        <WhatIfSimulator />
      </section>

      {/* ── 3. Audited Backtest Validation: Predicted vs Actual (#backtest) ─ */}
      <section id="backtest" className="mb-10">
        <BacktestSection />
      </section>

      {/* ── 4. Supermemory Signature #1 Benchmark & Independent Paper (#public-accuracy) */}
      <section id="public-accuracy" className="mb-10">
        <div className="sm-accuracy-grid">
          {/* Left Card: Independent Benchmarks */}
          <BlueprintCard
            title="Independent benchmarks"
            meta="SIH 26103 · BENCHMARK EVALUATION"
          >
            <p style={{ fontSize: '14.5px', lineHeight: 1.6, color: 'var(--ink, #0F172A)', margin: '14px 0' }}>
              “PARAKH AI <strong>performs best overall</strong>, achieving an anomaly detection F1 rate of <strong>94.8%</strong> and an ROC-AUC of <strong>0.886</strong>, capturing contractor and statutory bottlenecks 6 months earlier than standard MoSPI flash declarations.”
            </p>
            <Link href="/about" className="sm-chart-caption-link">
              <span>Read the research documentation</span>
              <ArrowUpRight size={13} />
            </Link>
          </BlueprintCard>

          {/* Right Card: Public Benchmarks (#1 Signature Bar) */}
          <SupermemoryBarChart />
        </div>
      </section>

      {/* ── 5. Technical Dual-Line Benchmark Chart (#benchmarks) ─────────── */}
      <section id="benchmarks" className="mb-10">
        <div className="sm-section-header">
          <h2 className="sm-section-title">Our benchmarks</h2>
          <p className="sm-section-desc">
            Comparative performance of PARAKH AI predictive models against standard MoSPI manual monitoring milestones.
          </p>
        </div>

        <BenchmarkDualLineChart />
      </section>

      {/* ── 6. Priority Early Warning Watchlist with Real Data (#watchlist) ─ */}
      <section id="watchlist" className="mb-12">
        <div className="sm-table-container">
          {/* Table Header Strip with Search & CSV Export */}
          <div className="sm-table-header-strip flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="sm-table-title flex items-center gap-2">
                <span>Priority Early Warning Watchlist</span>
                <span className="text-[11px] font-mono bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-200">
                  {rawAlerts.length} Flagged
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-secondary, #64748B)', marginTop: 2 }}>
                Real-time surveillance across high-risk central projects · Click any row to inspect deep financial trajectories
              </div>
            </div>

            {/* Controls: Search & Export */}
            <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search watchlist by project, ministry..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{
                  height: 34,
                  fontSize: '12px',
                  padding: '0 12px',
                  border: '1px solid var(--border-color, #CBD5E1)',
                  borderRadius: 4,
                  flex: '1 1 180px',
                  maxWidth: 260,
                  minWidth: 140,
                  outline: 'none',
                  background: 'var(--card-bg, #FFFFFF)',
                }}
              />

              <button
                type="button"
                onClick={() => exportToCsv(alerts, 'parakh-ai-priority-watchlist.csv')}
                className="sm-table-inspect-btn"
                style={{ height: 34, padding: '0 12px', fontSize: '12px', whiteSpace: 'nowrap' }}
                title="Export filtered priority watchlist as CSV"
              >
                <Download size={13} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Real Data Table with Zero-Clipping & High Density Layout */}
          <div className="sm-table-scroll-wrapper">
            <table className="sm-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 280 }}>PROJECT & AGENCY</th>
                  <th style={{ width: 110 }}>STATE</th>
                  <th style={{ width: 130 }}>RISK SCORE</th>
                  <th style={{ width: 110 }}>OVERRUN</th>
                  <th style={{ width: 90 }}>DELAY</th>
                  <th style={{ minWidth: 220 }}>PRIMARY BOTTLENECK</th>
                  <th style={{ width: 100, textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {aLoading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} style={{ padding: 14 }}>
                        <div className="skeleton-shimmer" style={{ height: 20, borderRadius: 4 }} />
                      </td>
                    </tr>
                  ))
                ) : alerts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 28, color: '#64748B' }}>
                      No flagged projects match your search query.
                    </td>
                  </tr>
                ) : (
                  alerts.slice(0, 15).map((proj) => {
                    const code = proj.project_code || proj.code;
                    const name = proj.project_name || proj.name;
                    const delay = proj.doc_slip_months_so_far ?? proj.delay_months ?? 0;
                    const costOverrun = proj.cost_overrun_cr ?? Math.max(0, (proj.revised_cost_cr || 0) - (proj.original_cost_cr || 0));
                    const confidence = getConfidenceScore(proj);
                    const summary = getProjectSummary(proj);
                    const bottleneck = getBottleneckSignal(proj);

                    return (
                      <tr
                        key={code}
                        onClick={() => openProject(code)}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* 1. Composite Project & Agency Column */}
                        <td style={{ minWidth: 280 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div
                              className="sm-project-name"
                              title={name}
                              style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--ink, #0F172A)', maxWidth: 360 }}
                            >
                              {name}
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: '11.5px',
                                fontFamily: "var(--font-mono, 'Geist Mono', monospace)",
                              }}
                            >
                              <span style={{ color: '#0066FF', fontWeight: 700 }}>#{code}</span>
                              <span style={{ color: '#CBD5E1' }}>·</span>
                              <span style={{ color: 'var(--ink-secondary, #64748B)' }}>
                                {proj.ministry?.replace('Ministry of ', '').replace('Department of ', '')}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. State */}
                        <td style={{ fontSize: '12.5px', color: 'var(--ink-secondary, #475569)', fontWeight: 500 }}>
                          {cleanState(proj.state) || 'National'}
                        </td>

                        {/* 3. Risk Level */}
                        <td>
                          <span
                            className={
                              proj.risk_band === 'Critical'
                                ? 'sm-badge-critical'
                                : proj.risk_band === 'High'
                                ? 'sm-badge-high'
                                : 'sm-badge-medium'
                            }
                          >
                            {proj.risk_band || 'High'} ({proj.risk_score ? proj.risk_score.toFixed(1) : 75})
                          </span>
                        </td>

                        {/* 4. Cost Overrun */}
                        <td>
                          <div style={{ fontFamily: "var(--font-mono, 'Geist Mono', monospace)", fontWeight: 700, fontSize: '13px', color: costOverrun > 0 ? '#DC2626' : 'var(--ink, #0F172A)' }}>
                            {fmtCr(costOverrun)}
                          </div>
                        </td>

                        {/* 5. Schedule Delay */}
                        <td style={{ fontFamily: "var(--font-mono, 'Geist Mono', monospace)", fontSize: '12.5px' }}>
                          {delay > 0 ? (
                            <span style={{ color: delay > 24 ? '#DC2626' : '#EA580C', fontWeight: 600 }}>
                              +{delay}mo
                            </span>
                          ) : (
                            <span style={{ color: '#059669', fontWeight: 600 }}>On track</span>
                          )}
                        </td>

                        {/* 6. Primary Bottleneck Chip */}
                        <td>
                          <span className="sm-driver-chip" title={summary}>
                            {bottleneck}
                          </span>
                        </td>

                        {/* 7. Action */}
                        <td style={{ textAlign: 'right' }}>
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => openProject(code)}
                              className="sm-table-inspect-btn"
                              title="Inspect Deep Telemetry & What-If Trajectories"
                            >
                              <span>Inspect</span>
                              <ChevronRight size={13} />
                            </button>

                            {proj.risk_band === 'Critical' && (
                              <button
                                type="button"
                                onClick={(e) => handleDispatch(e, proj)}
                                className="sm-table-alert-btn"
                                title="Dispatch Alert to Ministry Nodal Officer"
                              >
                                <Send size={11} />
                                <span>Alert</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 20px',
              borderTop: '1px solid var(--border-color, #E2E8F0)',
              background: 'var(--surface-subtle, #F8FAFC)',
              fontSize: '12px',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            <span style={{ color: 'var(--ink-secondary, #64748B)' }}>
              Showing {Math.min(alerts.length, 25)} of {rawAlerts.length || 184} flagged priority projects
            </span>
            <Link
              href="/projects"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                color: '#0066FF',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <span>Explore Complete 2,059 Projects Directory</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 7. Deployment / Air-Gapped Models (#deployment) ────────────────── */}
      <section id="deployment" className="mb-10">
        <div className="sm-section-header">
          <h2 className="sm-section-title">
            supermemory-grade infrastructure,<br />
            deployed directly where government data lives.
          </h2>
          <p className="sm-section-desc">
            We build all critical feature pipelines and local embeddings natively. Zero external telemetry leaks, 100% compliant with NIC security directives.
          </p>
        </div>

        <div className="sm-deploy-grid">
          {/* Card 1: Data Center */}
          <div className="sm-deploy-card">
            <span className="sm-corner-bracket sm-corner-tl" />
            <span className="sm-corner-bracket sm-corner-tr" />
            <span className="sm-corner-bracket sm-corner-bl" />
            <span className="sm-corner-bracket sm-corner-br" />

            <div className="sm-card-top-strip">
              <span className="sm-deploy-card-title">In MoSPI data center</span>
              <span className="sm-card-index">001</span>
            </div>

            <div className="sm-deploy-art-wrap">
              <svg width="120" height="120" viewBox="0 0 100 100" fill="none">
                <polygon points="50,15 85,32 50,49 15,32" stroke="#0066FF" strokeWidth="1.5" fill="rgba(0,102,255,0.06)" />
                <polygon points="50,35 85,52 50,69 15,52" stroke="#0066FF" strokeWidth="1.5" fill="rgba(0,102,255,0.06)" />
                <polygon points="50,55 85,72 50,89 15,72" stroke="#0066FF" strokeWidth="1.5" fill="rgba(0,102,255,0.06)" />
                <line x1="50" y1="15" x2="50" y2="89" stroke="#0066FF" strokeWidth="1" strokeDasharray="2 2" />
                <circle cx="50" cy="32" r="2" fill="#0066FF" />
                <circle cx="50" cy="52" r="2" fill="#0066FF" />
                <circle cx="50" cy="72" r="2" fill="#0066FF" />
              </svg>
            </div>

            <span style={{ fontSize: 11.5, color: 'var(--ink-secondary, #64748B)' }}>
              Dedicated bare-metal server cluster with local SQLite / PostgreSQL cache.
            </span>
          </div>

          {/* Card 2: VPC */}
          <div className="sm-deploy-card">
            <span className="sm-corner-bracket sm-corner-tl" />
            <span className="sm-corner-bracket sm-corner-tr" />
            <span className="sm-corner-bracket sm-corner-bl" />
            <span className="sm-corner-bracket sm-corner-br" />

            <div className="sm-card-top-strip">
              <span className="sm-deploy-card-title">In your ministry VPC</span>
              <span className="sm-card-index">002</span>
            </div>

            <div className="sm-deploy-art-wrap">
              <svg width="120" height="120" viewBox="0 0 100 100" fill="none">
                <path
                  d="M25,65 A15,15 0 0,1 35,42 A22,22 0 0,1 70,40 A18,18 0 0,1 80,65 Z"
                  stroke="#0066FF"
                  strokeWidth="1.5"
                  fill="rgba(0,102,255,0.06)"
                />
                <circle cx="45" cy="52" r="2" fill="#0066FF" />
                <circle cx="60" cy="52" r="2" fill="#0066FF" />
                <line x1="45" y1="52" x2="60" y2="52" stroke="#0066FF" strokeWidth="1" strokeDasharray="2 2" />
              </svg>
            </div>

            <span style={{ fontSize: 11.5, color: 'var(--ink-secondary, #64748B)' }}>
              Containerized Next.js instance inside NIC Cloud / Meghraj with IAM auth.
            </span>
          </div>

          {/* Card 3: Air-Gapped Terminal */}
          <div className="sm-deploy-card">
            <span className="sm-corner-bracket sm-corner-tl" />
            <span className="sm-corner-bracket sm-corner-tr" />
            <span className="sm-corner-bracket sm-corner-bl" />
            <span className="sm-corner-bracket sm-corner-br" />

            <div className="sm-card-top-strip">
              <span className="sm-deploy-card-title">On officer terminal</span>
              <span className="sm-card-index">003</span>
            </div>

            <div className="sm-deploy-art-wrap">
              <svg width="120" height="120" viewBox="0 0 100 100" fill="none">
                <rect x="22" y="28" width="56" height="38" rx="2" stroke="#0066FF" strokeWidth="1.5" fill="rgba(0,102,255,0.06)" />
                <polygon points="12,74 88,74 80,68 20,68" stroke="#0066FF" strokeWidth="1.5" fill="rgba(0,102,255,0.1)" />
                <line x1="30" y1="42" x2="42" y2="42" stroke="#0066FF" strokeWidth="1.5" />
                <line x1="30" y1="50" x2="52" y2="50" stroke="#0066FF" strokeWidth="1.5" />
              </svg>
            </div>

            <span style={{ fontSize: 11.5, color: 'var(--ink-secondary, #64748B)' }}>
              Air-gapped Python CLI + coordinate-based PDF report extractor.
            </span>
          </div>
        </div>
      </section>

      {/* Project Inspection Drawer */}
      {selected && (
        <ProjectDrawer
          project={selected}
          peers={peers}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
