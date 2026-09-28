'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import MagneticButton from '@/components/motion/MagneticButton';

const LINKS = [
  { href: '#watchlist', label: 'Watchlist' },
  { href: '#method', label: 'Method' },
  { href: '#evidence', label: 'Evidence' },
  { href: '/projects', label: 'All projects' },
];

export default function LandingNav() {
  const ref = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.from(ref.current, { yPercent: -110, duration: 1.1, delay: 0.15, ease: 'power4.out' });
  }, { scope: ref });

  return (
    <nav ref={ref} className={`ln-nav ${scrolled ? 'is-scrolled' : ''}`} aria-label="Landing">
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
