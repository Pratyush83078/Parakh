'use client';

import { useState, useEffect } from 'react';
import { Sliders, RotateCcw } from 'lucide-react';
import PrecisionSlider from '@/components/PrecisionSlider';

const LANDMARK_PRESETS = [
  {
    project_code: '705368',
    project_name: 'Araria - Supaul (92 km) New Rail Line',
    ministry: 'Ministry of Railways',
    state: 'Bihar',
    physical_progress_pct: 40.0,
    cumulative_expenditure_cr: 1658.0,
    revised_cost_cr: 2621.0,
    original_cost_cr: 1605.0,
    doc_slip_months_so_far: 34,
    risk_score: 91.9,
    risk_band: 'Critical',
  },
  {
    project_code: '5422',
    project_name: 'USBRL Rail Link (Kashmir Valley)',
    ministry: 'Ministry of Railways',
    state: 'Jammu and Kashmir',
    physical_progress_pct: 88.0,
    cumulative_expenditure_cr: 37200.0,
    revised_cost_cr: 41000.0,
    original_cost_cr: 21653.0,
    doc_slip_months_so_far: 60,
    risk_score: 89.2,
    risk_band: 'Critical',
  },
  {
    project_code: '11054',
    project_name: 'Mumbai Trans Harbour Link (MTHL)',
    ministry: 'MoRTH',
    state: 'Maharashtra',
    physical_progress_pct: 96.0,
    cumulative_expenditure_cr: 17843.0,
    revised_cost_cr: 17843.0,
    original_cost_cr: 14720.0,
    doc_slip_months_so_far: 8,
    risk_score: 28.5,
    risk_band: 'Low',
  },
];

export default function WhatIfSimulator({ project: externalProject }) {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const activeProject = externalProject || LANDMARK_PRESETS[selectedPresetIndex];

  // Baseline values derived from actual project telemetry
  const baselineProgress = Number(activeProject.physical_progress_pct || 40);
  const baselineCost = Number(activeProject.revised_cost_cr || activeProject.original_cost_cr || 1000);
  const baselineSpend = Number(activeProject.cumulative_expenditure_cr || baselineCost * 0.7);
  const baselineSpendPct = Math.round((baselineSpend / baselineCost) * 100);
  const baselineDelay = Number(activeProject.doc_slip_months_so_far || 0);
  const baselineScore = Number(activeProject.risk_score || 50);

  // Sliders state initialized to project baseline
  const [progress, setProgress] = useState(baselineProgress);
  const [spendPct, setSpendPct] = useState(baselineSpendPct);
  const [delay, setDelay] = useState(baselineDelay);

  // Re-sync sliders when bound project changes
  useEffect(() => {
    setProgress(Number(activeProject.physical_progress_pct || 40));
    const cost = Number(activeProject.revised_cost_cr || activeProject.original_cost_cr || 1000);
    const spend = Number(activeProject.cumulative_expenditure_cr || cost * 0.7);
    setSpendPct(Math.round((spend / cost) * 100));
    setDelay(Number(activeProject.doc_slip_months_so_far || 0));
  }, [activeProject.project_code, activeProject.physical_progress_pct, activeProject.doc_slip_months_so_far]);

  // Engine 1 Deterministic Risk Formula
  const currentGap = Math.max(0, spendPct - progress);
  const baselineGap = Math.max(0, baselineSpendPct - baselineProgress);
  const gapDelta = currentGap - baselineGap;
  const delayDelta = delay - baselineDelay;

  const simulatedScore = Math.min(
    100,
    Math.max(
      5,
      Number((baselineScore + gapDelta * 0.45 + delayDelta * 0.75).toFixed(1))
    )
  );
  const scoreDelta = Number((simulatedScore - baselineScore).toFixed(1));

  let simBand = 'Low';
  let badgeColor = '#059669';
  if (simulatedScore >= 75) {
    simBand = 'Critical';
    badgeColor = '#DC2626';
  } else if (simulatedScore >= 50) {
    simBand = 'High';
    badgeColor = '#EA580C';
  } else if (simulatedScore >= 30) {
    simBand = 'Medium';
    badgeColor = '#D97706';
  }

  const handleReset = () => {
    setProgress(baselineProgress);
    setSpendPct(baselineSpendPct);
    setDelay(baselineDelay);
  };

  return (
    <div className="sm-simulator-box">
      {/* Corner Brackets */}
      <span className="sm-corner-bracket sm-corner-tl" aria-hidden="true" />
      <span className="sm-corner-bracket sm-corner-tr" aria-hidden="true" />
      <span className="sm-corner-bracket sm-corner-bl" aria-hidden="true" />
      <span className="sm-corner-bracket sm-corner-br" aria-hidden="true" />

      {/* Compact Header Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 10,
          borderBottom: '1px solid var(--border-color, #E2E8F0)',
          marginBottom: 12,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <Sliders size={14} color="#0066FF" />
          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-geist-mono), monospace' }}>
            WHAT-IF SENSITIVITY SIMULATOR
          </span>
          <span style={{ fontSize: 11, color: 'var(--ink-secondary, #64748B)', fontFamily: 'var(--font-geist-mono)' }}>
            · Engine 1 Re-evaluation
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {!externalProject && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {LANDMARK_PRESETS.map((p, idx) => (
                <button
                  key={p.project_code}
                  type="button"
                  onClick={() => setSelectedPresetIndex(idx)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontSize: 10.5,
                    fontFamily: 'var(--font-geist-mono), monospace',
                    fontWeight: selectedPresetIndex === idx ? 700 : 500,
                    background: selectedPresetIndex === idx ? '#0F172A' : '#FFFFFF',
                    color: selectedPresetIndex === idx ? '#FFFFFF' : '#475569',
                    border: selectedPresetIndex === idx ? '1px solid #0F172A' : '1px solid #CBD5E1',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                  }}
                >
                  #{p.project_code}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              color: 'var(--ink-secondary, #64748B)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-geist-mono)',
            }}
            title="Restore Project Official Baseline"
          >
            <RotateCcw size={11} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Slim 1-Line Active Project Baseline Context */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          background: 'rgba(0,102,255,0.03)',
          border: '1px solid rgba(0,102,255,0.12)',
          borderRadius: 5,
          marginBottom: 12,
          fontSize: 11.5,
          flexWrap: 'wrap',
          gap: 6,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', minWidth: 0 }}>
          <span style={{ fontFamily: 'var(--font-geist-mono)', fontWeight: 700, color: '#0066FF' }}>
            #{activeProject.project_code}
          </span>
          <strong style={{ color: 'var(--ink, #0F172A)', wordBreak: 'break-word' }}>
            {activeProject.project_name}
          </strong>
          <span style={{ color: 'var(--ink-secondary, #64748B)', fontSize: 11 }}>
            ({activeProject.ministry} · {activeProject.state})
          </span>
        </div>

        <div style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 11.5, flexShrink: 0 }}>
          <span style={{ color: 'var(--ink-secondary, #64748B)' }}>Baseline: </span>
          <strong style={{ color: 'var(--ink, #0F172A)' }}>{baselineScore.toFixed(1)}/100</strong>
        </div>
      </div>

      {/* Sliders and Result Grid */}
      <div className="sm-sim-grid">
        {/* Sliders Column */}
        <div className="sm-sim-controls">
          <PrecisionSlider
            label="Physical Progress"
            value={progress}
            onChange={setProgress}
            min={5}
            max={100}
            step={1}
            unit="%"
            baseline={baselineProgress}
          />

          <PrecisionSlider
            label="Capital Expenditure"
            value={spendPct}
            onChange={setSpendPct}
            min={10}
            max={180}
            step={1}
            unit="%"
            baseline={baselineSpendPct}
          />

          <PrecisionSlider
            label="Schedule Variance Delay"
            value={delay}
            onChange={setDelay}
            min={0}
            max={120}
            step={1}
            unit=" mos"
            prefix="+"
            baseline={baselineDelay}
          />
        </div>

        {/* Compact Result Gauge */}
        <div className="sm-sim-result-card">
          <div style={{ fontSize: 10, fontFamily: 'var(--font-geist-mono)', fontWeight: 700, color: 'var(--ink-secondary, #64748B)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            SIMULATED RISK SCORE
          </div>

          <div className="sm-sim-score-huge" style={{ color: badgeColor }}>
            {simulatedScore.toFixed(1)}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontFamily: 'var(--font-geist-mono)',
                fontSize: '10.5px',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '3px',
                background: `${badgeColor}15`,
                color: badgeColor,
                border: `1px solid ${badgeColor}35`,
              }}
            >
              {simBand} Band
            </span>

            <span
              style={{
                fontFamily: 'var(--font-geist-mono)',
                fontSize: '10.5px',
                fontWeight: 700,
                color: scoreDelta > 0 ? '#DC2626' : scoreDelta < 0 ? '#059669' : '#64748B',
              }}
            >
              {scoreDelta > 0 ? `+${scoreDelta} Escalation` : scoreDelta < 0 ? `${scoreDelta} Recovery` : 'Baseline'}
            </span>
          </div>

          <div className="sm-sim-narrative">
            {scoreDelta > 0 ? (
              <span>
                <strong>Decoupling Detected:</strong> Spend at {spendPct}% while progress lags at {progress}% widens gap to {currentGap}%, adding +{scoreDelta} risk over official baseline.
              </span>
            ) : scoreDelta < 0 ? (
              <span>
                <strong>Remediation Track:</strong> Progress at {progress}% with delay capped at {delay} mos recovers milestone equilibrium (-{Math.abs(scoreDelta)} risk).
              </span>
            ) : (
              <span>
                <strong>Baseline Equilibrium:</strong> Telemetry matches official reported milestones. Nudge sliders to model trajectory.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
