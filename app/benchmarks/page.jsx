'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Award, AlertTriangle, Layers, TrendingUp, Sparkles, ChevronRight } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { api, fmtCr, riskColor } from '@/lib/api';
import { ChartSkeleton } from '@/components/Skeleton';

const BenchmarksBarChart = dynamic(() => import('@/components/charts/BenchmarksBarChart'), {
  ssr: false,
  loading: () => <ChartSkeleton height={320} />,
});

const TABS = ['Ministry Rankings & Telemetry', 'Cost Escalation Severity Leaderboard'];

export default function Benchmarks() {
  const { data: bench, loading } = useApi(api.benchmarks);
  const [tab, setTab] = useState(0);

  const sorted = bench?.slice(0, 12).map(m => ({
    ...m,
    shortName: m.ministry.replace('Ministry of ', '').replace('Department of ', '').substring(0, 22),
  })) || [];

  const topOverrun = Array.isArray(bench)
    ? [...bench].sort((a, b) => b.total_cost_overrun_cr - a.total_cost_overrun_cr)
    : [];

  const highestRiskMin = Array.isArray(bench) && bench.length > 0
    ? [...bench].sort((a, b) => b.avg_risk_score - a.avg_risk_score)[0]
    : null;

  const mostProjectsMin = Array.isArray(bench) && bench.length > 0
    ? [...bench].sort((a, b) => (b.project_count || b.total_projects || 0) - (a.project_count || a.total_projects || 0))[0]
    : null;

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="sm-section-header" style={{ marginBottom: 20 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: '9999px', background: 'rgba(0,102,255,0.06)', border: '1px solid rgba(0,102,255,0.2)', marginBottom: 12 }}>
          <Sparkles size={12} color="#0066FF" />
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0066FF' }}>
            PORTFOLIO BENCHMARKS · 17 CENTRAL MINISTRIES
          </span>
        </div>
        <h1 className="sm-section-title" style={{ fontSize: 26 }}>
          Ministry Benchmarks & Risk Rankings
        </h1>
        <p className="sm-section-desc" style={{ maxWidth: 780 }}>
          Comparative performance evaluation across 17 Central Government ministries · Identifying systemic delay patterns, cost inflation, and capital efficiency.
        </p>
      </div>

      {/* Summary Highlight Cards with Corner Drafting Brackets */}
      {Array.isArray(bench) && bench.length > 0 && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 16, marginBottom: 24 }}>
          {/* Card 1: Highest Budget Overrun */}
          <div className="sm-card" style={{ padding: '20px 22px' }}>
            <span className="sm-corner-bracket sm-corner-tl" />
            <span className="sm-corner-bracket sm-corner-tr" />
            <span className="sm-corner-bracket sm-corner-bl" />
            <span className="sm-corner-bracket sm-corner-br" />

            <div className="sm-card-top-strip" style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#DC2626' }}>
                HIGHEST BUDGET OVERRUN
              </span>
              <span className="sm-card-index">001</span>
            </div>

            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink, #0F172A)', marginBottom: 6 }}>
              {bench[0]?.ministry?.replace('Ministry of ', '')}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#DC2626', fontFamily: 'var(--font-mono)' }}>
              {fmtCr(bench[0]?.total_cost_overrun_cr)}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-secondary, #64748B)', marginTop: 4 }}>
              {bench[0]?.critical_count} Critical · {bench[0]?.high_count} High-risk projects
            </div>
          </div>

          {/* Card 2: Highest Average Risk Score */}
          <div className="sm-card" style={{ padding: '20px 22px' }}>
            <span className="sm-corner-bracket sm-corner-tl" />
            <span className="sm-corner-bracket sm-corner-tr" />
            <span className="sm-corner-bracket sm-corner-bl" />
            <span className="sm-corner-bracket sm-corner-br" />

            <div className="sm-card-top-strip" style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#EA580C' }}>
                HIGHEST AVERAGE RISK SCORE
              </span>
              <span className="sm-card-index">002</span>
            </div>

            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink, #0F172A)', marginBottom: 6 }}>
              {highestRiskMin?.ministry?.replace('Ministry of ', '').replace('Department of ', '')}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink, #0F172A)', fontFamily: 'var(--font-mono)' }}>
              {highestRiskMin?.avg_risk_score?.toFixed(1)} <span style={{ fontSize: 14, color: 'var(--ink-secondary, #64748B)' }}>/ 100</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-secondary, #64748B)', marginTop: 4 }}>
              {(highestRiskMin?.project_count || highestRiskMin?.total_projects)} active projects tracked
            </div>
          </div>

          {/* Card 3: Largest Infrastructure Volume */}
          <div className="sm-card" style={{ padding: '20px 22px' }}>
            <span className="sm-corner-bracket sm-corner-tl" />
            <span className="sm-corner-bracket sm-corner-tr" />
            <span className="sm-corner-bracket sm-corner-bl" />
            <span className="sm-corner-bracket sm-corner-br" />

            <div className="sm-card-top-strip" style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0066FF' }}>
                LARGEST CAPITAL VOLUME
              </span>
              <span className="sm-card-index">003</span>
            </div>

            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink, #0F172A)', marginBottom: 6 }}>
              {mostProjectsMin?.ministry?.replace('Ministry of ', '')}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0066FF', fontFamily: 'var(--font-mono)' }}>
              {(mostProjectsMin?.project_count || mostProjectsMin?.total_projects)} Projects
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-secondary, #64748B)', marginTop: 4 }}>
              Cumulative Overrun: {fmtCr(mostProjectsMin?.total_cost_overrun_cr)}
            </div>
          </div>
        </div>
      )}

      {/* Tabs Row */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6, background: 'var(--surface-subtle, #F1F5F9)', padding: '3px', borderRadius: '6px', border: '1px solid var(--border-color, #E2E8F0)' }}>
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: tab === i ? 700 : 500,
                fontFamily: 'var(--font-mono)',
                background: tab === i ? '#FFFFFF' : 'transparent',
                color: tab === i ? 'var(--ink, #0F172A)' : 'var(--ink-secondary, #64748B)',
                border: 'none',
                borderRadius: '4px',
                boxShadow: tab === i ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 0: Overview & Detailed Rankings */}
      {tab === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Visual Overrun Bar Chart */}
          <div className="sm-card" style={{ padding: '20px 24px' }}>
            <span className="sm-corner-bracket sm-corner-tl" />
            <span className="sm-corner-bracket sm-corner-tr" />
            <span className="sm-corner-bracket sm-corner-bl" />
            <span className="sm-corner-bracket sm-corner-br" />

            <div className="sm-card-top-strip" style={{ marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--ink, #0F172A)' }}>
                  COST OVERRUN BY MINISTRY (₹ CRORE)
                </h2>
                <p style={{ fontSize: 12, color: 'var(--ink-secondary, #64748B)', marginTop: 2 }}>
                  Aggregated cost escalation above original sanctioned estimates across top portfolios
                </p>
              </div>
              <span className="sm-confidence-pill">TOP 12 PORTFOLIOS</span>
            </div>

            <div style={{ width: '100%', height: 320 }}>
              <BenchmarksBarChart data={sorted} />
            </div>
          </div>

          {/* Detailed Performance Table */}
          <div className="sm-card" style={{ overflow: 'hidden' }}>
            <span className="sm-corner-bracket sm-corner-tl" />
            <span className="sm-corner-bracket sm-corner-tr" />
            <span className="sm-corner-bracket sm-corner-bl" />
            <span className="sm-corner-bracket sm-corner-br" />

            <div className="sm-card-top-strip" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-color, #E2E8F0)' }}>
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  COMPREHENSIVE MINISTRY PERFORMANCE DIRECTORY
                </h3>
                <p style={{ fontSize: 11.5, color: 'var(--ink-secondary, #64748B)', marginTop: 2 }}>
                  Sorted by total portfolio cost overrun descending
                </p>
              </div>
            </div>

            <div className="sm-table-scroll-wrapper">
              <table className="sm-table">
                <thead>
                  <tr>
                    <th style={{ width: 45 }}>#</th>
                    <th>Ministry / Department</th>
                    <th>Projects</th>
                    <th>Avg Risk Score</th>
                    <th>Critical</th>
                    <th>High</th>
                    <th>Total Cost Overrun</th>
                    <th>Avg Schedule Delay</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(8)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan={8} style={{ padding: '14px 18px' }}>
                          <div className="skeleton-shimmer" style={{ height: 24, borderRadius: 4 }} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    bench?.map((m, i) => (
                      <tr key={m.ministry}>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-secondary, #64748B)' }}>
                          {i + 1}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--ink, #0F172A)', fontSize: 12.5 }}>
                          {m.ministry.replace('Ministry of ', '').replace('Department of ', '')}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          {m.project_count || m.total_projects}
                        </td>
                        <td>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                              color: m.avg_risk_score > 40 ? '#DC2626' : m.avg_risk_score > 30 ? '#EA580C' : '#059669',
                            }}
                          >
                            {m.avg_risk_score?.toFixed(1)}
                          </span>
                        </td>
                        <td>
                          {m.critical_count > 0 ? (
                            <span className="sm-risk-badge sm-risk-critical" style={{ fontFamily: 'var(--font-mono)' }}>
                              {m.critical_count}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--ink-secondary, #94A3B8)' }}>—</span>
                          )}
                        </td>
                        <td>
                          {m.high_count > 0 ? (
                            <span className="sm-risk-badge sm-risk-high" style={{ fontFamily: 'var(--font-mono)' }}>
                              {m.high_count}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--ink-secondary, #94A3B8)' }}>—</span>
                          )}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--ink, #0F172A)' }}>
                          {fmtCr(m.total_cost_overrun_cr)}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--ink-secondary, #475569)' }}>
                          {m.avg_delay_months?.toFixed(1)} mos
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Cost Escalation Leaderboard */}
      {tab === 1 && (
        <div className="sm-card" style={{ overflow: 'hidden' }}>
          <span className="sm-corner-bracket sm-corner-tl" />
          <span className="sm-corner-bracket sm-corner-tr" />
          <span className="sm-corner-bracket sm-corner-bl" />
          <span className="sm-corner-bracket sm-corner-br" />

          <div className="sm-card-top-strip" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-color, #E2E8F0)' }}>
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                MINISTRY OVERRUN SEVERITY LEADERBOARD
              </h3>
              <p style={{ fontSize: 11.5, color: 'var(--ink-secondary, #64748B)', marginTop: 2 }}>
                Direct comparison of cumulative fiscal slippage across portfolios
              </p>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="sm-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>Rank</th>
                  <th>Ministry</th>
                  <th>Projects Tracked</th>
                  <th>Cumulative Overrun</th>
                  <th>Average Risk Score</th>
                  <th>Critical Projects</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} style={{ padding: '14px 18px' }}>
                        <div className="skeleton-shimmer" style={{ height: 24, borderRadius: 4 }} />
                      </td>
                    </tr>
                  ))
                ) : (
                  topOverrun.map((m, i) => (
                    <tr key={m.ministry}>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-secondary, #64748B)' }}>
                        #{i + 1}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--ink, #0F172A)' }}>
                        {m.ministry}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {m.project_count || m.total_projects}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#DC2626' }}>
                        {fmtCr(m.total_cost_overrun_cr)}
                      </td>
                      <td>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            color: m.avg_risk_score > 35 ? '#EA580C' : '#059669',
                          }}
                        >
                          {m.avg_risk_score?.toFixed(1)}
                        </span>
                      </td>
                      <td>
                        {m.critical_count > 0 ? (
                          <span className="sm-risk-badge sm-risk-critical" style={{ fontFamily: 'var(--font-mono)' }}>
                            {m.critical_count} Critical
                          </span>
                        ) : (
                          <span style={{ color: 'var(--ink-secondary, #94A3B8)', fontSize: 12 }}>0</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
