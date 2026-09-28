'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Download, Search, RotateCcw } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useProjectDetails } from '@/hooks/useProjectDetails';
import { api, cleanState, fmtCr, fmtPct } from '@/lib/api';
import { exportToCsv } from '@/lib/intelligence';
import PageIntro from '@/components/PageIntro';
import ProjectDrawer from '@/components/ProjectDrawer';

const COLUMNS = [
  ['Project / agency', null], ['State / ministry', null], ['Rule score', 'risk_score'],
  ['Cost change', 'cost_overrun_ratio_so_far'], ['Delay', 'doc_slip_months_so_far'],
  ['Progress', 'physical_progress_pct'], ['Main driver', null],
];

function ProjectsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: filters } = useApi(api.filters);
  const [retry, setRetry] = useState(0);
  const urlSearch = searchParams.get('search') || '';
  const [search, setSearch] = useState(urlSearch);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const sortBy = searchParams.get('sort') || 'risk_score';
  const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';
  const band = searchParams.get('band') || '';
  const ministry = searchParams.get('ministry') || '';
  const state = searchParams.get('state') || '';
  const driver = searchParams.get('driver') || '';
  const code = searchParams.get('project');
  const details = useProjectDetails();
  const { open, close } = details;
  const params = { search: urlSearch, risk_band: band, ministry, state, driver, sort_by: sortBy, order, page, limit: 25 };
  const key = new URLSearchParams(params).toString();
  const { data, loading, error } = useApi(() => api.projects(params), [key, retry]);
  const projects = data?.data || [];
  const total = data?.total_projects || 0;
  const pages = data?.total_pages || 1;
  const hasFilters = Boolean(search || band || ministry || state || driver);

  function navigate(changes) {
    const next = new URLSearchParams(searchParams);
    for (const [name, value] of Object.entries(changes)) {
      if (value) next.set(name, value); else next.delete(name);
    }
    router.replace(`/projects${next.size ? `?${next}` : ''}`, { scroll: false });
  }

  useEffect(() => { setSearch(urlSearch); }, [urlSearch]);
  useEffect(() => {
    if (search === urlSearch) return;
    const timer = setTimeout(() => navigate({ search: search.trim(), page: null }), 250);
    return () => clearTimeout(timer);
  }, [search, urlSearch, searchParams]);
  useEffect(() => { if (code) open(code); else close(); }, [code, open, close]);

  function reset() { setSearch(''); router.replace('/projects', { scroll: false }); }
  function sort(field) { navigate({ sort: field, order: sortBy === field && order === 'desc' ? 'asc' : 'desc', page: null }); }

  return (
    <>
      <PageIntro title="Find the projects that need attention." description="Start with the highest rule scores. Narrow the portfolio, then open a record to understand the cost, schedule, and evidence behind it.">
        <a href="/about#reading-risk" className="text-link">How to read the scores <ChevronRight size={16} /></a>
      </PageIntro>

      <section className="project-filters" aria-label="Filter projects">
        <div className="filter-search-row">
          <label className="search-field"><Search size={19} aria-hidden="true" />
            <span className="ln-sr">Search projects</span>
            <input type="search" placeholder="Search by name, code, agency or place" value={search} onChange={e => setSearch(e.target.value)} />
          </label>
          <button className="ln-btn ln-btn-ghost" disabled={loading || !!error || !projects.length} onClick={() => exportToCsv(projects, `parakh-projects-page-${page}.csv`)}>
            <Download size={16} /> Export this page
          </button>
        </div>
        <div className="filter-selects">
          {[
            ['band', 'Risk band', band, filters?.risk_bands || ['Critical', 'High', 'Medium', 'Low']],
            ['ministry', 'Ministry', ministry, filters?.ministries || []],
            ['state', 'State', state, filters?.states || []],
            ['driver', 'Main driver', driver, filters?.risk_drivers || []],
          ].map(([name, label, value, options]) => (
            <label key={name} className="filter-field"><span>{label}</span>
              <select aria-label={label} value={value} onChange={e => navigate({ [name]: e.target.value, page: null })}>
                <option value="">All {label.toLowerCase() === 'ministry' ? 'ministries' : label.toLowerCase() === 'state' ? 'states' : label.toLowerCase() + 's'}</option>
                {options.map(option => <option key={option} value={option}>{option.replace(/^(Ministry|Department) of /, '')}</option>)}
              </select>
            </label>
          ))}
          <button className="filter-reset" disabled={!hasFilters} onClick={reset}><RotateCcw size={15} /> Reset</button>
        </div>
      </section>

      <div className="results-heading">
        <h2>Project directory</h2>
        <span role="status">{loading ? 'Updating results…' : error ? 'Data unavailable' : `${total.toLocaleString('en-IN')} matching projects`}</span>
      </div>
      {(details.pending || details.error) && <p className="inline-notice" role={details.error ? 'alert' : 'status'}>{details.error || 'Opening project record…'}{details.error && code && <> <button className="text-link" onClick={() => open(code)}>Retry project</button></>}</p>}
      {error ? (
        <div className="empty-state" role="alert"><h3>The directory could not load.</h3><p>Your filters are saved. Check your connection and try again.</p><button className="ln-btn ln-btn-ink" onClick={() => setRetry(n => n + 1)}>Try again</button></div>
      ) : (
        <div className="ln-table-wrap directory-table" aria-busy={loading}>
          <table className="ln-table">
            <caption className="ln-sr">Projects in the latest report. Rule scores describe current risk, not predicted outcomes.</caption>
            <thead><tr>{COLUMNS.map(([label, field]) => (
              <th key={label} scope="col" aria-sort={field ? (sortBy === field ? (order === 'asc' ? 'ascending' : 'descending') : 'none') : undefined}>
                {field ? <button className="table-sort" onClick={() => sort(field)}>{label}{sortBy === field ? (order === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} />}</button> : label}
              </th>
            ))}</tr></thead>
            <tbody>
              {loading ? Array.from({ length: 8 }, (_, i) => <tr key={i}><td colSpan={7}><span className="ln-skel" /></td></tr>) : !projects.length ? (
                <tr><td colSpan={7}><div className="empty-state"><Search size={24} /><h3>No projects match these filters.</h3><p>Try a different name or widen your selection.</p><button className="ln-btn ln-btn-ghost" onClick={reset}>Clear filters</button></div></td></tr>
              ) : projects.map(p => (
                <tr key={p.project_code}>
                  <td><button className="ln-row-link" onClick={() => navigate({ project: p.project_code })}>
                    <span className="ln-row-name">{p.project_name}</span>
                    <span className="ln-row-meta">#{p.project_code} · {p.agency || 'Agency not reported'}</span>
                  </button></td>
                  <td><span className="cell-primary">{cleanState(p.state)}</span><span className="ln-row-meta">{p.ministry?.replace(/^(Ministry|Department) of /, '')}</span></td>
                  <td><span className={`ln-band band-${p.risk_band}`}>{p.risk_band}<b>{p.risk_score?.toFixed(1) ?? '—'}</b></span></td>
                  <td><span className={`cell-primary ln-num ${p.cost_overrun_ratio_so_far > 0 ? 'ln-up' : ''}`}>{fmtPct(p.cost_overrun_ratio_so_far)}</span><span className="ln-row-meta">{fmtCr(p.revised_cost_cr)} revised</span></td>
                  <td className="ln-num">{p.doc_slip_months_so_far == null ? '—' : p.doc_slip_months_so_far > 0 ? `+${p.doc_slip_months_so_far} mo` : 'No delay'}</td>
                  <td><span className="ln-num">{p.physical_progress_pct == null ? '—' : `${p.physical_progress_pct.toFixed(0)}%`}</span><div className="mini-progress" aria-hidden="true"><span style={{ width: `${Math.max(0, Math.min(100, p.physical_progress_pct || 0))}%` }} /></div></td>
                  <td className="driver-cell">{p.primary_risk_driver || 'Not reported'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="pagination">
        <p>{loading ? 'Loading records…' : error ? 'Results unavailable' : `Showing ${total && projects.length ? (page - 1) * 25 + 1 : 0}–${Math.min(page * 25, total)} of ${total.toLocaleString('en-IN')}`}</p>
        <div><button className="icon-button" aria-label="Previous page" disabled={loading || page <= 1} onClick={() => navigate({ page: page - 1 })}><ChevronLeft size={18} /></button>
          <span>Page {page} of {pages}</span>
          <button className="icon-button" aria-label="Next page" disabled={loading || !!error || page >= pages} onClick={() => navigate({ page: page + 1 })}><ChevronRight size={18} /></button></div>
      </div>
      <p className="workspace-note">Rule bands describe the latest report. Open a record for experimental model estimates and their limitations. CSV exports contain only the displayed page.</p>
      {details.detail && <ProjectDrawer {...details.detail} onClose={() => navigate({ project: null })} />}
    </>
  );
}

export default function Projects() {
  return <Suspense fallback={<p className="empty-state" role="status">Loading project directory…</p>}><ProjectsContent /></Suspense>;
}
