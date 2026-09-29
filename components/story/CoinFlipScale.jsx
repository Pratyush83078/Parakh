'use client';

import { useEffect, useRef, useState } from 'react';

const MIN = 0.3;
const MAX = 1.0;
const pos = (v) => `${((Math.min(MAX, Math.max(MIN, v)) - MIN) / (MAX - MIN)) * 100}%`;
const TICKS = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

/**
 * ROC-AUC tracks on a shared axis. Markers start on the coin-flip line (0.5)
 * and travel to their measured value once the scale scrolls into view.
 * rows: [{ key, name, verdict, tone, markers: [{ kind, label, value }] }]
 */
export default function CoinFlipScale({ rows }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <figure ref={ref} className={`st-scale ${shown ? 'is-shown' : ''}`}>
      <div className="st-scale-axis" aria-hidden="true">
        {TICKS.map((t) => (
          <div key={t} style={{ left: pos(t) }} className={`st-tick ${t === 0.5 ? 'is-coin' : ''}`}>
            <span className="st-tick-val">{t.toFixed(1)}</span>
            {t === 0.5 && <span className="st-tick-sub">Coin Flip</span>}
            <span className="st-tick-line" />
          </div>
        ))}
      </div>

      {rows.map((row, r) => (
        <div key={row.key} className="st-scale-row">
          <div className="st-scale-head">
            <h3>{row.name}</h3>
            <p className={`st-verdict tone-${row.tone}`}>{row.verdict}</p>
          </div>
          <div className="st-track-wrap">
            <div className="st-track" role="img" aria-label={`${row.name}: ${row.markers.map((m) => `${m.label} ${m.value.toFixed(2)}`).join(', ')}`}>
              <span className="st-coin-line" style={{ left: pos(0.5) }} />
              {row.markers.map((m, i) => (
                <span
                  key={m.kind}
                  className={`st-marker kind-${m.kind}`}
                  style={{
                    left: shown ? pos(m.value) : pos(0.5),
                    transitionDelay: `${r * 180 + i * 90}ms`,
                    '--pop-delay': `${r * 180 + i * 90 + 900}ms`,
                  }}
                >
                  {m.kind === 'later' && (
                    <span className="st-marker-badge">
                      <span className="st-marker-value">{m.value.toFixed(2)}</span>
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
          <ul className="st-scale-legend">
            {row.markers.map((m) => (
              <li key={m.kind}>
                <span className={`st-key kind-${m.kind}`} aria-hidden="true" />
                <span className="st-legend-label">{m.label}</span>
                <b className="st-num">{m.value.toFixed(2)}</b>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <figcaption>
        ROC-AUC: how often the model ranks a project that did change above one that did not. 0.5 is a coin flip, 1.0 is perfect.
      </figcaption>
    </figure>
  );
}
