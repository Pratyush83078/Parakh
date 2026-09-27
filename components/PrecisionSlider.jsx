'use client';

import { useMemo } from 'react';
import { RotateCcw } from 'lucide-react';

export default function PrecisionSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  prefix = '',
  baseline = null,
}) {
  const numValue = Number(value);
  const clampedValue = Math.min(max, Math.max(min, numValue));

  // Dynamic percentage fill for the pill track (0% to 100%)
  const fillPct = useMemo(() => {
    if (max <= min) return 0;
    const pct = ((clampedValue - min) / (max - min)) * 100;
    return Math.min(100, Math.max(0, pct));
  }, [clampedValue, min, max]);

  const diffFromBaseline = baseline !== null ? clampedValue - baseline : null;

  const handleReset = () => {
    if (baseline !== null) {
      onChange(baseline);
    }
  };

  return (
    <div className="precision-slider-container" style={{ marginBottom: 12 }}>
      {/* 1. Header: Label & Value / Baseline Delta Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        <label
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--ink, #0F172A)',
            fontFamily: "var(--font-geist-sans), var(--font-body, 'Geist', sans-serif)",
            letterSpacing: '-0.01em',
          }}
        >
          {label}
        </label>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {/* Main Value Pill */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '1px 7px',
              borderRadius: 4,
              fontSize: '11.5px',
              fontFamily: "var(--font-geist-mono), monospace",
              fontWeight: 700,
              background: '#FFFFFF',
              color: '#0F172A',
              border: '1px solid #CBD5E1',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            {prefix}{clampedValue}{unit}
          </span>

          {/* Baseline Delta Badge */}
          {baseline !== null && diffFromBaseline !== 0 && (
            <span
              style={{
                fontSize: '10.5px',
                fontFamily: "var(--font-geist-mono), monospace",
                fontWeight: 600,
                padding: '1px 5px',
                borderRadius: 3,
                background: diffFromBaseline > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                color: diffFromBaseline > 0 ? '#DC2626' : '#059669',
                border: `1px solid ${diffFromBaseline > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
              }}
              title={`Shift from official baseline of ${baseline}${unit}`}
            >
              {diffFromBaseline > 0 ? `+${diffFromBaseline}` : diffFromBaseline}{unit}
            </span>
          )}

          {baseline !== null && (
            <span
              style={{
                fontSize: '10.5px',
                color: 'var(--ink-muted, #94A3B8)',
                fontFamily: "var(--font-geist-mono), monospace",
              }}
            >
              (Base: {baseline}{unit})
            </span>
          )}
        </div>
      </div>

      {/* 2. Minimalist Pill Slider Track (Exact Match to User Reference Spec) */}
      <div className="sm-pill-slider-track">
        {/* Soft light inactive rail */}
        <div className="sm-pill-slider-inactive" />

        {/* Solid dark active pill */}
        <div
          className="sm-pill-slider-active"
          style={{ width: `${fillPct}%` }}
        />

        {/* Native range input overlay with custom thumb (white disc + black border) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={clampedValue}
          onChange={(e) => onChange(Number(e.target.value))}
          className="sm-pill-slider-input"
          aria-label={label}
        />
      </div>

      {/* 3. Scale Legend & Reset Action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 4,
          fontSize: '10px',
          fontFamily: "var(--font-geist-mono), monospace",
          color: 'var(--ink-muted, #94A3B8)',
          flexWrap: 'wrap',
          gap: 4,
        }}
      >
        <span>{prefix}{min}{unit}</span>

        {baseline !== null && clampedValue !== baseline && (
          <button
            type="button"
            onClick={handleReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              fontSize: '10.5px',
              color: '#0066FF',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '1px 4px',
              fontFamily: 'inherit',
            }}
            title="Snap back to project official baseline"
          >
            <RotateCcw size={10} />
            <span>Reset to baseline</span>
          </button>
        )}

        <span>{prefix}{max}{unit}</span>
      </div>
    </div>
  );
}
