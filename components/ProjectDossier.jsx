'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Download, MapPin, Building2, CalendarClock, FileText } from 'lucide-react';
import { gsap, useGSAP } from '@/lib/gsap';
import Modal from '@/components/Modal';
import AuroraField from '@/components/motion/AuroraField';
import CountUp from '@/components/motion/CountUp';
import WhatIfSimulator from '@/components/WhatIfSimulator';
import metrics from '@/data/processed/model_metrics.json';
import { cleanState, fmtCr, fmtPct, scoreColor } from '@/lib/api';
import { monthLabel } from '@/lib/monthLabel';
import { exportToCsv } from '@/lib/intelligence';

const nf = new Intl.NumberFormat('en-IN');
const num1 = (v, suffix = '') => (v == null ? '—' : `${Number(v).toFixed(1)}${suffix}`);

/* ── Rule-score dial: animated arc + count-up, band-coloured ─────────────── */
function ScoreDial({ score, band }) {
  const arcRef = useRef(null);
  const R = 56;
  const C = 2 * Math.PI * R;
  const pct = Math.max(0, Math.min(100, score ?? 0)) / 100;

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(arcRef.current,
        { strokeDashoffset: C },
        { strokeDashoffset: C * (1 - pct), duration: 1.6, ease: 'power4.out', delay: 0.35 });
    });
    return () => media.revert();
  }, [pct]);

  return (
    <div className="ds-dial" role="img" aria-label={`Rule score ${num1(score)} of 100, ${band} risk`}>
      <svg viewBox="0 0 140 140" aria-hidden="true">
        <circle cx="70" cy="70" r={R} fill="none" stroke="var(--ln-hairline)" strokeWidth="7" />
        <circle
          ref={arcRef} cx="70" cy="70" r={R} fill="none"
          stroke={scoreColor(score ?? 0)} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - pct)}
          transform="rotate(-90 70 70)"
        />
      </svg>
      <div className="ds-dial-read">
        <strong><CountUp value={score ?? 0} decimals={1} /></strong>
        <span>rule score</span>
      </div>
    </div>
  );
}

/* ── Schedule-slip gauge: half-donut the model estimate sweeps into ──────── */
function SlipGauge({ pct }) {
  const arcRef = useRef(null);
  const R = 58;
  const L = Math.PI * R; // semicircle
  const p = Math.max(0, Math.min(100, pct ?? 0)) / 100;

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(arcRef.current,
        { strokeDashoffset: L },
        { strokeDashoffset: L * (1 - p), duration: 1.7, ease: 'power4.out', delay: 0.55 });
    });
    return () => media.revert();
  }, [p]);

  return (
      <div className="ds-gauge" role="img" aria-label={`Uncalibrated schedule model score ${num1(pct)} out of 100`}>
      <svg viewBox="0 0 150 84" aria-hidden="true">
        <path d={`M 17 75 A ${R} ${R} 0 0 1 133 75`} fill="none" stroke="var(--ln-hairline)" strokeWidth="9" strokeLinecap="round" />
        <path
          ref={arcRef} d={`M 17 75 A ${R} ${R} 0 0 1 133 75`} fill="none"
          stroke="var(--ln-blue)" strokeWidth="9" strokeLinecap="round"
          strokeDasharray={L} strokeDashoffset={L * (1 - p)}
        />
      </svg>
      <div className="ds-gauge-read">
        <strong><CountUp value={pct ?? 0} decimals={0} /></strong>
        <span>raw score / 100</span>
      </div>
    </div>
  );
}

/* ── One capped signal that feeds the rule score (mirrors src/features.py) ─ */
function SignalBar({ label, note, frac, value }) {
  const barRef = useRef(null);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(barRef.current, { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'power4.out', delay: 0.3 });
    });
    return () => media.revert();
  }, []);
  return (
    <div className="ds-signal">
      <div className="ds-signal-head">
        <span className="ds-signal-label">{label}</span>
        <b className="ln-num">{value}</b>
      </div>
      <div className="ds-signal-track">
        <span ref={barRef} className="ds-signal-fill" style={{ width: `${Math.round(Math.min(1, Math.max(0, frac)) * 100)}%` }} />
      </div>
      <span className="ds-signal-note">{note}</span>
    </div>
  );
}

/* ── Peer comparison track: this project vs the peer average ─────────────── */
function PeerTrack({ label, unit, value, avg, max }) {
  const scale = (v) => `${Math.max(2, Math.min(98, (v / (max || 1)) * 100))}%`;
  return (
    <div className="ds-peer-track">
      <div className="ds-peer-head">
        <span>{label}</span>
        <span className="ds-peer-nums ln-num">
          <b>{value}{unit}</b> · peers avg {avg}{unit}
        </span>
      </div>
      <div className="ds-peer-rail">
        <span className="ds-peer-avg" style={{ left: scale(avg) }} aria-hidden="true" />
        <span className="ds-peer-this" style={{ left: scale(value) }} aria-hidden="true" />
      </div>
      <div className="ds-peer-legend">
        <span><i className="ds-k ds-k-this" /> this project</span>
        <span><i className="ds-k ds-k-avg" /> peer average</span>
      </div>
    </div>
  );
}

/* ── The dossier ──────────────────────────────────────────────────────────── */
export default function ProjectDossier({ project: p, peers, onClose, onOpenPeer, returnLabel = 'Back' }) {
  const root = useRef(null);
  const scrollRef = useRef(null);

  const spendPct = p.revised_cost_cr > 0 ? (p.cumulative_expenditure_cr ?? 0) / p.revised_cost_cr * 100 : 0;
  const overrunPct = (p.cost_overrun_ratio_so_far ?? 0) * 100;
  const revisionCount = (p.cost_revision_count_cum ?? 0) + (p.doc_revision_count_cum ?? 0);
  const signals = [
    { label: 'Cost overrun', note: 'capped at +50% of approved cost', frac: p.cost_overrun_ratio_so_far == null ? 0 : p.cost_overrun_ratio_so_far / 0.5, value: fmtPct(p.cost_overrun_ratio_so_far) ?? 'Not reported' },
    { label: 'Schedule slip', note: 'capped at 36 months', frac: p.doc_slip_months_so_far == null ? 0 : p.doc_slip_months_so_far / 36, value: p.doc_slip_months_so_far == null ? 'Not reported' : `${p.doc_slip_months_so_far} mo` },
    { label: 'Progress behind plan', note: 'linear timeline proxy; capped at 40 points', frac: p.progress_gap == null ? 0 : Math.max(0, -p.progress_gap) / 40, value: p.progress_gap == null ? 'Not reported' : num1(Math.max(0, -p.progress_gap), ' pts') },
    { label: 'Spend ahead of progress', note: 'capped at 40 points ahead', frac: p.revised_cost_cr > 0 && p.physical_progress_pct != null ? Math.max(0, spendPct - p.physical_progress_pct) / 40 : 0, value: p.revised_cost_cr > 0 && p.physical_progress_pct != null ? num1(Math.max(0, spendPct - p.physical_progress_pct), ' pts') : 'Not reported' },
    { label: 'Repeated revisions', note: 'capped at three recorded revisions', frac: revisionCount / 3, value: `${revisionCount} recorded` },
  ];

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const q = gsap.utils.selector(root);
      const tl = gsap.timeline({ delay: 0.12 });
      tl.from(q('.ds-topbar'), { yPercent: -100, autoAlpha: 0, duration: 0.55, ease: 'power3.out' }, 0)
        .from(q('.ds-hero-eyebrow'), { y: 18, autoAlpha: 0, duration: 0.6 }, 0.15)
        .from(q('.ds-hero-title .ln-w-inner'), { yPercent: 115, rotate: 2.5, duration: 1.1, stagger: 0.04, ease: 'power4.out' }, 0.2)
        .from(q('.ds-hero-meta > *'), { y: 16, autoAlpha: 0, duration: 0.6, stagger: 0.07 }, 0.45)
        .from(q('.ds-dial'), { scale: 0.86, autoAlpha: 0, duration: 0.9, ease: 'power4.out' }, 0.35)
        .from(q('.ds-vitals > *'), { y: 26, autoAlpha: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out' }, 0.55)
        .from(q('.ds-block'), { y: 34, autoAlpha: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out' }, 0.7);

      // The aurora band drifts as the dossier scrolls (internal scroller).
      gsap.to(q('.ds-hero-aurora'), {
        yPercent: 24, ease: 'none',
        scrollTrigger: { trigger: q('.ds-hero'), start: 'top top', end: 'bottom top', scrub: true, scroller: scrollRef.current },
      });
      gsap.to(q('.ds-hero-title'), {
        y: -34, autoAlpha: 0.25, ease: 'none',
        scrollTrigger: { trigger: q('.ds-hero'), start: 'top top', end: 'bottom top', scrub: true, scroller: scrollRef.current },
      });
    });
    return () => media.revert();
  }, { scope: root });

  const bandDist = peers?.peer_group?.risk_band_distribution || {};
  const bandTotal = Object.values(bandDist).reduce((s, n) => s + n, 0) || 1;
  const pg = peers?.peer_group;

  return (
    <Modal className="dossier-dialog" labelledBy="dossier-title" onClose={onClose}>
      <div ref={root} className="dossier-root">
        <div ref={scrollRef} className="dossier-scroll" data-lenis-prevent>

          {/* Top bar — always in reach */}
          <div className="ds-topbar">
            <button type="button" className="ds-back" onClick={onClose} data-initial-focus data-cursor>
              <ArrowLeft size={15} /> {returnLabel}
            </button>
            <div className="ds-topbar-mid">
              <span className={`ln-band band-${p.risk_band}`}>{p.risk_band} risk</span>
              <span className="ln-num ds-code">#{p.project_code}</span>
            </div>
            <button type="button" className="ln-btn ln-btn-ink ds-export" onClick={() => exportToCsv([p], `parakh-project-${p.project_code}.csv`)} data-cursor>
              <Download size={14} /> Export
            </button>
          </div>

          {/* Hero — the case file opens */}
          <header className="ds-hero">
            <div className="ds-hero-aurora" aria-hidden="true"><AuroraField palette="day" /></div>
            <div className="ds-wrap ds-hero-grid">
              <div>
                <p className="ln-eyebrow ds-hero-eyebrow">
                  <span className="ln-idx">Project record</span> {p.report_month_dt
                    ? monthLabel(p.report_month_dt.slice(0, 7)) + ' report'
                    : 'latest report'}
                </p>
                <h1 id="dossier-title" className="ln-display ds-hero-title ln-split" aria-label={p.project_name}>
                  {p.project_name.split(' ').map((w, i, arr) => (
                    <span key={i} className="ln-w-mask" aria-hidden="true">
                      <span className="ln-w-inner">{w}{i < arr.length - 1 ? '\u00A0' : ''}</span>
                    </span>
                  ))}
                </h1>
                <div className="ds-hero-meta">
                  <span><Building2 size={14} aria-hidden="true" /> {p.ministry}</span>
                  <span><MapPin size={14} aria-hidden="true" /> {cleanState(p.state)}</span>
                  {p.agency && <span className="ds-agency">{p.agency.replace(/[()]/g, '').trim()}</span>}
                  <span><CalendarClock size={14} aria-hidden="true" /> Driver: {p.primary_risk_driver || 'not reported'}</span>
                </div>
                {p.source_pdf && <a className="text-link" href={`/api/projects/${encodeURIComponent(p.project_code)}/source#page=${encodeURIComponent(p.source_page || 1)}`} target="_blank" rel="noreferrer">
                  <FileText size={14} aria-hidden="true" /> Source: {p.source_pdf.split(/[\\/]/).pop()} · page {p.source_page || 'not recorded'}
                </a>}
                {p.quality_status && <p><span className={`ln-status ${p.quality_status === 'VERIFIED' ? 'status-built' : 'status-partial'}`}>{p.quality_status === 'VERIFIED' ? 'Source row verified' : 'Review required'}</span></p>}
                {p.quality_warnings && <p className="ds-fineprint">Review flags: {Array.isArray(p.quality_warnings) ? p.quality_warnings.join(' · ') : p.quality_warnings}</p>}
              </div>
              <ScoreDial score={p.risk_score} band={p.risk_band} />
            </div>
          </header>

          {/* Vitals — the four numbers that matter, counted up */}
          <section className="ds-wrap ds-vitals" aria-label="Key figures">
            <div className="ds-vital">
              <span className="ds-vital-label">Cost · approved → revised</span>
              <strong className="ln-num ds-vital-cost"><span className="ds-nowrap">{fmtCr(p.original_cost_cr)}</span> <em>→</em> <span className="ds-nowrap">{fmtCr(p.revised_cost_cr)}</span></strong>
              <span className={`ds-vital-note ${overrunPct > 0 ? 'ln-up' : ''}`}>{fmtPct(p.cost_overrun_ratio_so_far)} change</span>
            </div>
            <div className="ds-vital">
              <span className="ds-vital-label">Completion delay</span>
              <strong className="ln-num"><CountUp value={p.doc_slip_months_so_far ?? 0} decimals={0} /> <em>mo</em></strong>
              <span className="ds-vital-note">date pushed so far</span>
            </div>
            <div className="ds-vital">
              <span className="ds-vital-label">Physical progress</span>
              <strong className="ln-num"><CountUp value={p.physical_progress_pct ?? 0} decimals={1} suffix="%" /></strong>
              <span className="ds-vital-note">{num1(p.progress_gap, ' pts')} vs approval timeline proxy</span>
            </div>
            <div className="ds-vital">
              <span className="ds-vital-label">Spent to date</span>
              <strong className="ln-num">{fmtCr(p.cumulative_expenditure_cr)}</strong>
              <span className="ds-vital-note">{num1(spendPct, '%')} of revised cost</span>
            </div>
          </section>

          <div className="ds-wrap ds-body">
            {/* Why this score */}
            <section className="ds-block ds-split">
              <div>
                <p className="ln-eyebrow"><span className="ln-idx">01</span> Why this score</p>
                <h2 className="ln-h3" style={{ marginTop: '1rem' }}>Five capped signals, open arithmetic.</h2>
                <p className="ln-body">Missing inputs stay unknown; the score renormalizes across available signals. This record has {num1(p.risk_coverage_pct, '%')} of its weighted inputs available. <Link href="/about#reading-risk" onClick={onClose} className="text-link">How scores work <ArrowUpRight size={13} /></Link></p>
              </div>
              <div className="ds-signals">
                {signals.map((s) => <SignalBar key={s.label} {...s} />)}
              </div>
            </section>

            {/* Model readout */}
            <section className="ds-block ds-model">
              <div className="ds-split">
                <div>
                  <p className="ln-eyebrow"><span className="ln-idx">02</span> The model&rsquo;s say</p>
                  <h2 className="ln-h3" style={{ marginTop: '1rem' }}>What might change next report?</h2>
                  <p className="ln-body">{metrics.schedule_slipped_label.selected_model.replaceAll('_', ' ')}, trained on {metrics.months.length} monthly reports and tested on up to three later reports, using earlier months for training (mean ROC-AUC {metrics.schedule_slipped_label.temporal_split[metrics.schedule_slipped_label.selected_model].roc_auc.toFixed(2)}). A preliminary ranking signal for review — not a confirmed forecast.</p>
                  <p className="ds-fineprint">Cost-model score: {num1(p.cost_revised_up_risk_pct)} / 100 — not reliable for forecasting (ordered ROC-AUC {metrics.cost_revised_up_label.temporal_split[metrics.cost_revised_up_label.selected_model].roc_auc.toFixed(2)}). Both raw scores are uncalibrated; read them as rankings, not event frequencies.</p>
                </div>
                <SlipGauge pct={p.schedule_slipped_risk_pct} />
              </div>
            </section>

            {/* Peers */}
            <section className="ds-block">
              <p className="ln-eyebrow"><span className="ln-idx">03</span> Among its peers</p>
              {!pg ? (
                <p className="ln-body" style={{ marginTop: '1rem' }}>Peer data could not be loaded. Reopen this record to try again.</p>
              ) : !pg.count ? (
                <p className="ln-body" style={{ marginTop: '1rem' }}>No other projects in the same ministry and state are available for comparison.</p>
              ) : (
                <>
                  <h2 className="ln-h3" style={{ marginTop: '1rem' }}>{nf.format(pg.count)} peers in {cleanState(pg.state)} · {pg.ministry}</h2>
                  <p className="ln-body">{peers.peer_insight}</p>
                  <div className="ds-peer-grid">
                    <PeerTrack label="Cost overrun" unit="%" value={peers.this_project?.cost_overrun_pct ?? overrunPct} avg={pg.avg_cost_overrun_pct} max={Math.max(peers.this_project?.cost_overrun_pct ?? overrunPct, pg.avg_cost_overrun_pct) * 1.15} />
                    <PeerTrack label="Schedule delay" unit=" mo" value={peers.this_project?.schedule_delay_months ?? p.doc_slip_months_so_far} avg={pg.avg_schedule_delay_months} max={Math.max(peers.this_project?.schedule_delay_months ?? p.doc_slip_months_so_far, pg.avg_schedule_delay_months) * 1.15} />
                    <PeerTrack label="Rule score" unit="" value={peers.this_project?.risk_score ?? p.risk_score} avg={pg.avg_risk_score} max={100} />
                  </div>

                  <div className="ds-peer-lower">
                    <div className="ds-banddist">
                      <span className="ds-banddist-label">Peer risk bands</span>
                      <div className="ln-bands-bar ds-banddist-bar" role="img" aria-label={Object.entries(bandDist).map(([b, n]) => `${b} ${n}`).join(', ')}>
                        {['Low', 'Medium', 'High', 'Critical'].map((b) => (
                          <span key={b} className={`band-bg-${b}`} style={{ flexGrow: bandDist[b] || 0 }} />
                        ))}
                      </div>
                      <span className="ds-fineprint">average peer score {num1(pg.avg_risk_score)} · average progress {num1(pg.avg_physical_progress_pct, '%')}</span>
                    </div>

                    {peers.top_peers_by_risk?.length > 0 && (
                      <div className="ds-toppeers">
                        <span className="ds-banddist-label">Highest-risk peers</span>
                        <ul>
                          {peers.top_peers_by_risk.slice(0, 4).map((peer) => (
                            <li key={peer.project_code}>
                              <button type="button" onClick={() => onOpenPeer?.(peer.project_code)} data-cursor="View" disabled={!onOpenPeer}>
                                <span className="ds-peer-name">{peer.project_name}</span>
                                <span className="ln-num ds-peer-score">{peer.risk_score?.toFixed(1)}</span>
                                <span className={`ln-band band-${peer.risk_band}`}>{peer.risk_band}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <p className="ds-fineprint">Peers share a ministry and state, but may differ in size, age, or scope.</p>
                </>
              )}
            </section>

            {/* What-if */}
            <section className="ds-block ds-whatif">
              <WhatIfSimulator key={p.project_code} project={p} />
            </section>
          </div>

          <footer className="ds-foot ds-wrap">
            <span>Report-based evidence · human review required · Parakh SIH 26103</span>
            <button type="button" className="ln-btn ln-btn-ghost" onClick={onClose} data-cursor>Close record</button>
          </footer>
        </div>
      </div>
    </Modal>
  );
}
