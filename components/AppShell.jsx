'use client';

import { usePathname } from 'next/navigation';
import SupermemorySidebar from '@/components/SupermemorySidebar';

// The home route is a full-bleed scroll story with its own header.
// Every other route keeps the working dashboard shell with the sidebar.
export default function AppShell({ children }) {
  const pathname = usePathname();

  if (pathname === '/') {
    return <div className="st-shell">{children}</div>;
  }

  return (
    <div className="sm-app-container">
      <SupermemorySidebar />
      <main className="sm-content-area">{children}</main>
    </div>
  );
}
