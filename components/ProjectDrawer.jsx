'use client';

import Link from 'next/link';
import { X, Download, ArrowUpRight, FileText } from 'lucide-react';
import { cleanState, fmtCr, fmtPct } from '@/lib/api';
import { exportToCsv } from '@/lib/intelligence';
import Modal from '@/components/Modal';
import WhatIfSimulator from '@/components/WhatIfSimulator';
import metrics from '@/data/processed/model_metrics.json';

const number = (value, suffix = '') => value == null ? 'Not reported' : `${Number(value).toFixed(1)}${suffix}`;

export default function ProjectDrawer({ project: p, onClose, peers }) {
  if (!p) return null;
  return (
    <Modal className="project-dialog" labelledBy="record-title" onClose={onClose}>
      <header className="record-header">
        <div className="record-toolbar"><span className={`ln-band band-${p.risk_band}`}>{p.risk_band} risk</span><span className="ln-num">#{p.project_code}</span><button className="icon-button" onClick={onClose} aria-label="Close project record" autoFocus><X size={20} /></button></div>
        <h2 id="record-title">{p.project_name}</h2><p>{p.ministry} · {cleanState(p.state)}</p>
        {p.agency && <p>{p.agency.replace(/[()]/g, '').trim()}</p>}
      </header>
      <div className="record-content">
        {p.source_pdf && <section><h3>Source evidence</h3><a className="text-link" href={`/api/projects/${encodeURIComponent(p.project_code)}/source#page=${encodeURIComponent(p.source_page || 1)}`} target="_blank" rel="noreferrer"><FileText size={15} aria-hidden="true" /> {p.source_pdf.split(/[\\/]/).pop()} · page {p.source_page || 'not recorded'}</a>
          {p.quality_status && <p><span className={`ln-status ${p.quality_status === 'VERIFIED' ? 'status-built' : 'status-partial'}`}>{p.quality_status === 'VERIFIED' ? 'Source row verified' : 'Review required'}</span></p>}
          {p.quality_warnings && <p className="workspace-note">Review flags: {Array.isArray(p.quality_warnings) ? p.quality_warnings.join(' · ') : p.quality_warnings}</p>}
        </section>}
        <section className="record-assessment"><div><span className="record-label">Current rule score</span><strong className="record-score">{number(p.risk_score)}<small> / 100</small></strong></div>
          <div><h3>{p.primary_risk_driver || 'No driver reported'}</h3><p>{p.risk_coverage_pct == null ? 'No weighted inputs were available.' : `${number(p.risk_coverage_pct, '%')} of weighted inputs were available.`} Missing values are excluded and the remaining weights are renormalized. Check the source figures before deciding what needs review.</p><Link href="/about#reading-risk" onClick={onClose} className="text-link">How scores work <ArrowUpRight size={14} /></Link></div></section>
        <section><h3>Budget and spending</h3><dl className="record-facts">
          {[
            ['Original approved cost', fmtCr(p.original_cost_cr)], ['Revised cost', fmtCr(p.revised_cost_cr)],
            ['Reported cost change', fmtPct(p.cost_overrun_ratio_so_far)], ['Expenditure to date', fmtCr(p.cumulative_expenditure_cr)],
          ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        </dl></section>
        <section><h3>Schedule and progress</h3><dl className="record-facts">
          {[
            ['Completion date delay', number(p.doc_slip_months_so_far, ' months')], ['Physical progress', number(p.physical_progress_pct, '%')],
            ['Progress gap vs expected', number(p.progress_gap, ' percentage points')],
          ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        </dl></section>
        <section className="record-model"><h3>What might change next report?</h3><div className="model-readout"><span>Schedule model ranking score · uncalibrated</span><strong>{number(p.schedule_slipped_risk_pct)} / 100</strong></div>
          <p>Experimental ranking signal, not a calibrated event probability or confirmed forecast. A completion date moving is different from a project failing.</p>
          <details><summary>Cost-model score · not reliable for forecasting</summary><p>Raw ranking score: {number(p.cost_revised_up_risk_pct)} / 100. Ordered-month mean ROC-AUC is {metrics.cost_revised_up_label.temporal_split[metrics.cost_revised_up_label.selected_model].roc_auc.toFixed(3)}. Do not use this estimate to forecast cost increases.</p></details>
          <p className="workspace-note">{metrics.schedule_slipped_label.selected_model.replaceAll('_', ' ')} · Schedule ordered-month mean ROC-AUC {metrics.schedule_slipped_label.temporal_split[metrics.schedule_slipped_label.selected_model].roc_auc.toFixed(3)} · {metrics.months.length} monthly reports. Model scores are not calibrated probabilities.</p>
        </section>
        <section><h3>Compare with its peers</h3>
          {!peers ? <p>Peer data could not be loaded. Reopen this record to try again.</p> : !peers.peer_group?.count ? <p>No other projects in the same ministry and state are available for comparison.</p> : <>
            <p>{peers.peer_group.count} other projects in {cleanState(p.state)}, in the same ministry.</p>
            <div className="ln-table-wrap"><table className="ln-table peer-table"><thead><tr><th scope="col">Measure</th><th scope="col">This project</th><th scope="col">Peer average</th></tr></thead><tbody>
              {[
                ['Cost increase', number(peers.this_project?.cost_overrun_pct, '%'), number(peers.peer_group.avg_cost_overrun_pct, '%')],
                ['Delay', number(peers.this_project?.schedule_delay_months, ' mo'), number(peers.peer_group.avg_schedule_delay_months, ' mo')],
                ['Rule score', number(peers.this_project?.risk_score), number(peers.peer_group.avg_risk_score)],
              ].map(([label, value, average]) => <tr key={label}><th scope="row">{label}</th><td className="ln-num">{value}</td><td className="ln-num">{average}</td></tr>)}
            </tbody></table></div><p className="workspace-note">Peers share a ministry and state, but may differ in size, age, or scope.</p>
          </>}
        </section>
        <section><WhatIfSimulator key={p.project_code} project={p} /></section>
      </div>
      <footer className="record-footer"><span>Report-based evidence · human review required</span><button className="ln-btn ln-btn-ink" onClick={() => exportToCsv([p], `parakh-project-${p.project_code}.csv`)}><Download size={15} /> Export record</button></footer>
    </Modal>
  );
}
