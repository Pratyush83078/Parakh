'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Search, X } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

const links = [
  ['/', 'Overview'], ['/projects', 'Projects'], ['/benchmarks', 'Benchmarks'], ['/about', 'How it works'],
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButton = useRef(null);
  const reduced = useReducedMotion();
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <header className="site-header" onKeyDown={e => {
      if (e.key === 'Escape' && open) { setOpen(false); menuButton.current?.focus(); }
    }}>
      <div className="site-header-inner">
        <Link href="/" className="ln-brand" aria-label="Parakh home">
          <span className="ln-brand-deva" lang="hi">परख</span>
          <span className="ln-brand-name">Parakh</span>
        </Link>
        <nav id="site-navigation" className={`site-navigation ${open ? 'is-open' : ''}`} aria-label="Primary navigation">
          {links.map(([href, label]) => (
            <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined} onClick={() => setOpen(false)}>
              {label}
              {pathname === href && <motion.span className="nav-indicator" layoutId="active-route" transition={{ duration: reduced ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }} />}
            </Link>
          ))}
        </nav>
        <div className="site-header-actions">
          <button className="site-search" onClick={() => { setOpen(false); window.dispatchEvent(new Event('open-cmdk')); }} aria-label="Search projects">
            <Search size={17} /><span>Find a project</span><kbd>⌘ K</kbd>
          </button>
          <button ref={menuButton} className="site-menu" aria-controls="site-navigation" aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(v => !v)}>
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
    </header>
  );
}
