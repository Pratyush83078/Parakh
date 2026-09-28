'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

export const CHAPTERS = [
  { id: 'problem', label: 'Problem' },
  { id: 'method', label: 'Method' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'watchlist', label: 'Watchlist' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'limits', label: 'Limits' },
  { id: 'brief', label: 'SIH Brief' },
];

export default function StoryHeader() {
  const [active, setActive] = useState('');
  const [dark, setDark] = useState(false);
  const barRef = useRef(null);

  useEffect(() => {
    const spy = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' }
    );
    CHAPTERS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) spy.observe(el);
    });

    // Invert the header while it sits over the dark evidence field.
    const evidence = document.getElementById('evidence');
    const inv = new IntersectionObserver(
      ([e]) => setDark(e.isIntersecting),
      { rootMargin: '0px 0px -92% 0px' }
    );
    if (evidence) inv.observe(evidence);

    const onScroll = () => {
      const h = document.documentElement;
      const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      spy.disconnect();
      inv.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <header className={`st-header ${dark ? 'is-dark' : ''}`}>
      <div className="st-wrap st-header-row">
        <a href="#top" className="st-brand" aria-label="Parakh, back to top">
          <span className="st-brand-deva" lang="hi">परख</span>
          <span className="st-brand-latin">Parakh</span>
        </a>

        <nav className="st-chapters" aria-label="Chapters">
          {CHAPTERS.map(({ id, label }) => (
            <a key={id} href={`#${id}`} className={active === id ? 'is-active' : ''} aria-current={active === id ? 'true' : undefined}>
              {label}
            </a>
          ))}
        </nav>

        <div className="st-header-actions">
          <button
            type="button"
            className="st-search"
            onClick={() => window.dispatchEvent(new CustomEvent('open-cmdk'))}
            aria-label="Search projects"
          >
            <Search size={14} strokeWidth={2} />
            <span>Search</span>
            <kbd>⌘K</kbd>
          </button>
          <Link href="/projects" className="st-header-link">All projects</Link>
        </div>
      </div>
      <span ref={barRef} className="st-progress" aria-hidden="true" />
    </header>
  );
}
