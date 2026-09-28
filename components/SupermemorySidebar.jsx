'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, ArrowUpRight, Search } from 'lucide-react';

const primaryLinks = [
  { href: '/', label: 'Dashboard' },
  { href: '/projects', label: 'Projects' },
  { href: '/benchmarks', label: 'Benchmarks' },
  { href: '/about', label: 'Docs', external: true },
];

const pageAnchors = [
  { id: 'overview', label: 'Overview' },
  { id: 'watchlist', label: 'Priority Watchlist' },
  { id: 'models', label: 'Model Evaluation' },
];

export default function SupermemorySidebar() {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <aside className="sm-sidebar">
      <div className="sm-sidebar-main">
        {/* Brand & Search Bar Header */}
        <div className="sm-sidebar-top-row">
          <Link href="/" className="sm-sidebar-brand">
            <span className="sm-brand-icon">
              <Sparkles size={18} strokeWidth={2.4} />
            </span>
            <span className="sm-brand-text">
              <span lang="hi" style={{ fontFamily: 'var(--font-tiro, serif)', color: '#0284C7', marginRight: 4, fontWeight: 700 }}>परख</span>
              Parakh
            </span>
          </Link>

          {/* Cmd+K Search Trigger */}
          <button
            type="button"
            className="sm-sidebar-search-trigger"
            onClick={() => typeof window !== 'undefined' && window.dispatchEvent(new CustomEvent('open-cmdk'))}
            title="Search radar (⌘K)"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Search size={13} />
              <span>Search radar...</span>
            </div>
            <kbd className="sm-sidebar-kbd">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Primary Nav */}
        <nav className="sm-sidebar-nav" aria-label="Primary navigation">
          {primaryLinks.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sm-nav-item ${isActive ? 'active' : ''}`}
              >
                {isActive ? (
                  <span className="sm-nav-active-marker" aria-hidden="true" />
                ) : (
                  <span className="sm-nav-marker-placeholder" aria-hidden="true" />
                )}
                <span>{item.label}</span>
                {item.external && <span className="sm-nav-external-arrow">↗</span>}
              </Link>
            );
          })}
        </nav>

        {/* Dotted Divider */}
        <hr className="sm-dotted-divider" />

        {/* "ON THIS PAGE" Scrollspy Sub-Nav (when on Dashboard) */}
        {isHome && (
          <div className="sm-page-anchors-section">
            <div className="sm-anchors-eyebrow">On this page</div>
            {pageAnchors.map((anchor) => (
              <a
                key={anchor.id}
                href={`#${anchor.id}`}
                className="sm-anchor-item"
              >
                <span className="sm-anchor-dash">—</span>
                <span>{anchor.label}</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar Footer Status */}
      <div className="sm-sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="sm-pulse-dot" />
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--ink, #0F172A)' }}>
            MoSPI Live
          </span>
        </div>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink-secondary, #94A3B8)' }}>
          SIH 26103
        </span>
      </div>
    </aside>
  );
}
