'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Download } from 'lucide-react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { Reveal, SplitWords } from '@/components/motion/Reveal';
import { fmtCr, cleanState } from '@/lib/api';
import { getProjectSummary, getBottleneckSignal, exportToCsv } from '@/lib/intelligence';

const nf = new Intl.NumberFormat('en-IN');
const shortMinistry = (m) => (m || '').replace(/^(Ministry|Department) of /, '');

function Band({ band, score }) {
  return <span className={`ln-band band-${band}`}>{band}{score != null && <b className="ln-num">{score.toFixed(1)}</b>}</span>;
}

export default function Watchlist({ flagged, shown, total, query, setQuery, loading, error, available, onInspect }) {
  const bodyRef = useRef(null);

  useGSAP(() => {
    if (prefersReducedMotion() || !bodyRef.current) return;
    const rows = bodyRef.current.querySelectorAll('tr');
    if (!rows.length) return;
    gsap.from(rows, {
      y: 18, autoAlpha: 0, duration: 0.55, stagger: 0.05, ease: 'power2.out',
      scrollTrigger: { trigger: bodyRef.current, start: 'top 88%', once: true },
    });
  }, { scope: bodyRef, dependencies: [shown], revertOnUpdate: true });

  return (
    <section id="watchlist" className="ln-section">
      <div className="ln-wrap">
        <div className="ln-watch-head">
          <div>
            <Reveal className="ln-section-head" style={{ marginBottom: 0 }}>
              <p className="ln-eyebrow"><span className="ln-idx">04</span> The watchlist</p>
            </Reveal>
            <SplitWords as="h2" className="ln-display ln-h2" text="Who needs eyes this month." accent={['eyes']} />
            <Reveal delay={0.12}>
              <p className="ln-body" style={{ marginTop: '1.2rem', maxWidth: '52ch' }}>
                Highest rule scores in the latest report, beside the model&rsquo;s estimate of a schedule slip.
                Open a project for its full record and a comparison with its peers.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.2}>
            <div className="ln-toolbar">
              <label className="ln-input">
                <span className="ln-sr">Search the watchlist</span>
                <input type="search" placeholder="Project, ministry or state" value={query} onChange={(e) => setQuery(e.target.value)} />
              </label>
              <button type="button" className="ln-btn ln-btn-ghost" onClick={() => exportToCsv(flagged, 'parakh-watchlist.csv')} disabled={!flagged.length} data-cursor>
                <Download size={14} /> CSV
              </button>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="ln-table-wrap">
            <table className="ln-table">
              <thead>
                <tr>
                  <th scope="col">Project</th>
                  <th scope="col">State</th>
                  <th scope="col">Rule score</th>
                  <th scope="col" className="is-num">Slip, next report</th>
                  <th scope="col" className="is-num">Cost increase</th>
                  <th scope="col" className="is-num">Delay</th>
                  <th scope="col">Main driver</th>
                </tr>
              </thead>
              <tbody ref={bodyRef}>
                {loading ? (
                  [...Array(6)].map((_, k) => (
                    <tr key={k} aria-hidden="true"><td colSpan={7}><span className="ln-skel" /></td></tr>
                  ))
                ) : error ? (
                  <tr><td colSpan={7} className="ln-empty">The watchlist did not load ({error}). Check that the snapshot exists in data/processed/.</td></tr>
                ) : shown.length === 0 ? (
                  <tr><td colSpan={7} className="ln-empty">No flagged project matches &ldquo;{query}&rdquo;.</td></tr>
                ) : (
                  shown.map((p) => {
                    const delay = Math.max(0, p.doc_slip_months_so_far || 0);
                    const costUp = Math.max(0, (p.revised_cost_cr || 0) - (p.original_cost_cr || 0));
                    return (
                      <tr key={p.project_code}>
                        <td>
                          <button type="button" className="ln-row-link" onClick={() => onInspect(p.project_code)} data-cursor>
                            <span className="ln-row-name">{p.project_name}</span>
                            <span className="ln-row-meta"><span className="ln-num">#{p.project_code}</span> · {shortMinistry(p.ministry)}</span>
                          </button>
                        </td>
                        <td className="ln-muted">{cleanState(p.state)}</td>
                        <td><Band band={p.risk_band} score={p.risk_score} /></td>
                        <td className="is-num ln-num">{p.schedule_slipped_risk_pct != null ? `${p.schedule_slipped_risk_pct.toFixed(0)}%` : '—'}</td>
                        <td className={`is-num ln-num ${costUp > 0 ? 'ln-up' : ''}`}>{costUp > 0 ? fmtCr(costUp) : '—'}</td>
                        <td className="is-num ln-num">{delay > 0 ? `${delay} mo` : 'On time'}</td>
                        <td><span className="ln-driver-tag" title={getProjectSummary(p)}>{getBottleneckSignal(p)}</span></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Reveal>
        <div className="ln-table-foot">
          <span>Showing <b className="ln-num">{shown.length}</b> of <b className="ln-num">{nf.format(total)}</b> {query ? "matching loaded" : "loaded priority"} records{available != null && ` · ${nf.format(available)} priority records in the full report`}</span>
          <Link href="/projects">Browse all projects <ArrowUpRight size={14} /></Link>
        </div>
      </div>
    </section>
  );
}
