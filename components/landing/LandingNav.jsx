'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import MagneticButton from '@/components/motion/MagneticButton';

const LINKS = [
  { href: '#watchlist', label: 'Watchlist' },
  { href: '#method', label: 'Method' },
  { href: '#evidence', label: 'Evidence' },
  { href: '/projects', label: 'All projects' },
];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const raf = useRef(0);

  // rAF-throttled scroll flag — one boolean, no layout reads in the handler.
  useEffect(() => {
    const onScroll = () => {
      if (raf.current) return;
      raf.current = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 40);
        raf.current = 0;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <nav className={`ln-nav ${scrolled ? 'is-scrolled' : ''}`} aria-label="Landing">
      <div className="ln-wrap ln-nav-row">
        <Link href="/" className="ln-brand" data-cursor>
          <span className="ln-brand-deva" lang="hi">परख</span>
          <span className="ln-brand-name">Parakh</span>
          <span className="ln-brand-tag">SIH 26103</span>
        </Link>
        <div className="ln-nav-links">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href}>{l.label}</Link>
          ))}
          <MagneticButton>
            <Link href="/projects" className="ln-btn ln-btn-ink ln-nav-cta">
              Open the radar <ArrowUpRight size={13} />
            </Link>
          </MagneticButton>
        </div>
      </div>
    </nav>
  );
}
