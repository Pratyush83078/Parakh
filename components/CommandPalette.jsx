'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowUpRight, X } from 'lucide-react';
import { api } from '@/lib/api';
import Modal from '@/components/Modal';

const links = [['/', 'Overview'], ['/projects', 'All projects'], ['/benchmarks', 'Benchmarks'], ['/about', 'How it works']];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    const key = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        // Do not stack search above an open project record.
        if (document.querySelector('dialog[open]') && !isOpen) return;
        e.preventDefault(); setIsOpen(v => !v);
      }
    };
    const open = () => setIsOpen(true);
    window.addEventListener('keydown', key);
    window.addEventListener('open-cmdk', open);
    return () => { window.removeEventListener('keydown', key); window.removeEventListener('open-cmdk', open); };
  }, [isOpen]);
  return isOpen ? <SearchDialog onClose={() => setIsOpen(false)} /> : null;
}

function SearchDialog({ onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [index, setIndex] = useState(0);
  const list = useRef(null);
  const router = useRouter();
  useEffect(() => {
    let current = true;
    setLoading(true); setError(false); setResults([]); setIndex(0);
    const timer = setTimeout(async () => {
      try {
        const data = await api.projects({ search: query.trim(), limit: 8, sort_by: 'risk_score', order: 'desc' });
        if (current) setResults(data.data || []);
      } catch { if (current) setError(true); }
      finally { if (current) setLoading(false); }
    }, query ? 200 : 0);
    return () => { current = false; clearTimeout(timer); };
  }, [query, retry]);
  useEffect(() => { list.current?.querySelector(`[data-index="${index}"]`)?.scrollIntoView({ block: 'nearest' }); }, [index]);
  function go(href) { onClose(); router.push(href); }
  function project(code) { go(`/projects?project=${encodeURIComponent(code)}`); }
  return (
    <Modal className="search-dialog" labelledBy="search-title" onClose={onClose}>
      <header className="search-dialog-header"><h2 id="search-title">Find a project</h2><button className="icon-button" onClick={onClose} aria-label="Close search"><X size={18} /></button></header>
      <label className="search-field"><Search size={19} /><span className="ln-sr">Search all projects</span>
        <input data-initial-focus type="search" placeholder="Name, project code, ministry or state" value={query} onChange={e => setQuery(e.target.value)}
          role="combobox" aria-autocomplete="list" aria-expanded="true" aria-controls="project-suggestions" aria-activedescendant={results.length && !loading ? `suggestion-${index}` : undefined}
          onKeyDown={e => {
            if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
              e.preventDefault(); if (results.length) setIndex(i => (i + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length);
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (!loading && results[index]) project(results[index].project_code);
              else if (query.trim()) go(`/projects?search=${encodeURIComponent(query.trim())}`);
            }
          }} />
      </label>
      <p className="search-status" role="status">{loading ? 'Searching the latest report…' : error ? 'Search could not load. Please try again.' : query ? `${results.length} results shown` : 'Highest rule scores in the latest report'}</p>
      {error && <button className="ln-btn ln-btn-ghost" onClick={() => setRetry(n => n + 1)}>Try again</button>}
      <div ref={list} id="project-suggestions" role="listbox" aria-label="Project suggestions" className="search-results">
        {results.map((p, i) => <div key={p.project_code} id={`suggestion-${i}`} data-index={i} role="option" aria-selected={index === i} onMouseEnter={() => setIndex(i)} onClick={() => project(p.project_code)}>
          <div><strong>{p.project_name}</strong><span>#{p.project_code} · {p.state}</span></div><span className={`ln-band band-${p.risk_band}`}>{p.risk_band}</span>
        </div>)}
      </div>
      {!loading && !error && !results.length && <p className="empty-state">No matching projects. Try a shorter name or a project code.</p>}
      {query.trim() && <button className="search-all text-link" onClick={() => go(`/projects?search=${encodeURIComponent(query.trim())}`)}>See all matching projects <ArrowUpRight size={15} /></button>}
      <nav className="search-shortcuts" aria-label="Quick navigation">{links.map(([href, text]) => <button key={href} onClick={() => go(href)}>{text}<ArrowUpRight size={14} /></button>)}</nav>
      <footer className="search-help">↑ ↓ Navigate · Enter to open · Escape to close</footer>
    </Modal>
  );
}
