'use client';

import { usePathname } from 'next/navigation';
import { MotionConfig } from 'motion/react';
import SiteHeader from '@/components/SiteHeader';

export default function AppShell({ children }) {
  const pathname = usePathname();
  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader />
      {pathname === '/' ? children : (
        <main id="main-content" tabIndex={-1} className="workspace">
          <div key={pathname} className="workspace-page">{children}</div>
          <footer className="workspace-footer">
            <span>Parakh · MoSPI Flash Reports</span>
            <span>Decision support, not an instruction to intervene.</span>
          </footer>
        </main>
      )}
    </MotionConfig>
  );
}
