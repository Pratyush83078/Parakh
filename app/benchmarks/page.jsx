'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { api, fmtCr } from '@/lib/api';
import PageIntro from '@/components/PageIntro';

export default function Benchmarks() {
  const [retry, setRetry] = useState(0);
  const { data, loading, error } = useApi(api.benchmarks, [retry]);
  const [view, setView] = useState('cost');
  const bench = Array.isArray(data) ? data : [];
  const sorted = [...bench].sort((a, b) => view === 'cost' ? b.total_cost_overrun_cr - a.total_cost_overrun_cr : b.avg_risk_score - a.avg_risk_score);
  const max = Math.max(1, ...sorted.map(m => view === 'cost' ? m.total_cost_overrun_cr : m.avg_risk_score));
  const highestRisk = [...bench].sort((a, b) => b.avg_risk_score - a.avg_risk_score)[0];
  const largest = [...bench].sort((a, b) => b.total_projects - a.total_projects)[0];
  const overrun = [...bench].sort((a, b) => b.total_cost_overrun_cr - a.total_cost_overrun_cr)[0];
  const short = m => m?.replace(/^(Ministry|Department) of /, '');

  return (
    <>
      <PageIntro title="See the portfolio in perspective." description="Compare ministries by reported cost growth and average rule score. Use the differences to ask better questions—not to rank the people delivering these projects.">
        <span className="report-count">{loading ? 'Loading ministries…' : error ? 'Data unavailable' : `${bench.length} ministries in this report`}</span>
      </PageIntro>
      {loading ? <div className="empty-state" role="status"><span className="ln-skel" />Loading ministry comparisons…</div> : error ? (
        <div className="empty-state" role="alert"><h2>The benchmarks could not load.</h2><p>Check your connection, then try again.</p><button className="ln-btn ln-btn-ink" onClick={() => setRetry(n => n + 1)}>Try again</button></div>
      ) : !bench.length ? <div className="empty-state"><h2>No ministry data yet.</h2><p>Generate a project snapshot to compare portfolios.</p></div> : (
        <>
          <dl className="benchmark-summary">
            {[
              ['Largest reported cost increase', fmtCr(overrun?.total_cost_overrun_cr), short(overrun?.ministry)],
              ['Highest average rule score', `${highestRisk?.avg_risk_score?.toFixed(1)} / 100`, short(highestRisk?.ministry)],
              ['Most projects in the report', largest?.total_projects?.toLocaleString('en-IN'), short(largest?.ministry)],
            ].map(([label, value, name]) => <div key={label}><dt>{label}</dt><dd>{value}</dd><p>{name}</p></div>)}
          </dl>
          <section className="benchmark-comparison" aria-labelledby="comparison-title">
            <div className="results-heading"><div><h2 id="comparison-title">Where the pressure sits</h2><p>{view === 'cost' ? 'Total revised cost above original estimates, in ₹ crore.' : 'Average rule score across projects in each ministry.'}</p></div>
              <div className="segmented-control" aria-label="Compare ministries by">
                <button aria-pressed={view === 'cost'} onClick={() => setView('cost')}>Cost increase</button>
                <button aria-pressed={view === 'risk'} onClick={() => setView('risk')}>Rule score</button>
              </div>
            </div>
            <ol className="ministry-bars" key={view}>
              {sorted.map((m, i) => {
                const value = view === 'cost' ? m.total_cost_overrun_cr : m.avg_risk_score;
                return <li key={m.ministry} style={{ '--row-delay': `${Math.min(i, 8) * 35}ms` }}>
                  <Link href={`/projects?ministry=${encodeURIComponent(m.ministry)}`} className="ministry-bar-link">
                    <span className="ministry-bar-name">{short(m.ministry)}<ArrowUpRight size={14} /></span>
                    <span className="ministry-bar-track" aria-hidden="true"><span style={{ transform: `scaleX(${Math.max(0, value) / max})` }} /></span>
                    <span className="ln-num">{view === 'cost' ? fmtCr(value) : value.toFixed(1)}</span>
                  </Link>
                </li>;
              })}
            </ol>
          </section>
          <section aria-labelledby="ministry-directory">
            <div className="results-heading"><h2 id="ministry-directory">Behind each comparison</h2><span>Select a ministry to explore its projects</span></div>
            <div className="ln-table-wrap"><table className="ln-table">
              <caption className="ln-sr">Ministry statistics, sorted by {view === 'cost' ? 'cost increase' : 'average risk score'} descending</caption>
              <thead><tr>{['Ministry', 'Projects', 'Avg rule score', 'Critical', 'High', 'Cost increase', 'Avg delay'].map(t => <th key={t} scope="col">{t}</th>)}</tr></thead>
              <tbody>{sorted.map(m => <tr key={m.ministry}>
                <td><Link className="text-link" href={`/projects?ministry=${encodeURIComponent(m.ministry)}`}>{short(m.ministry)}<ArrowUpRight size={14} /></Link></td>
                <td className="ln-num">{m.total_projects}</td><td className="ln-num">{m.avg_risk_score.toFixed(1)}</td>
                <td className="ln-num">{m.critical_count}</td><td className="ln-num">{m.high_count}</td>
                <td className="ln-num">{fmtCr(m.total_cost_overrun_cr)}</td><td className="ln-num">{m.avg_delay_months.toFixed(1)} mo</td>
              </tr>)}</tbody>
            </table></div>
          </section>
          <p className="workspace-note">Larger portfolios can have larger total overruns. Ministry averages do not adjust for project size, age, or mix. Compare similar projects inside the project record before drawing conclusions.</p>
        </>
      )}
    </>
  );
}
