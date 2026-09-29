'use client';

import { useCallback, useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

/**
 * Theme toggle — dark (techie) ⇄ light (main-branch paper).
 * All colors flow from tokens in styles/landing.css, so this flips one
 * attribute on <html> and the whole system retints: landing, workspace,
 * dossier dialogs, pills, grain, aurora.
 *
 * Default is dark. The choice persists in localStorage and is applied
 * before paint via the inline script in app/layout.jsx (no flash).
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'light' ? 'light' : 'dark');
  }, []);

  const toggle = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('parakh-theme', next); } catch {}
    setTheme(next);
  }, [theme]);

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to day mode' : 'Switch to night mode'}
      title={theme === 'dark' ? 'Day mode' : 'Night mode'}
    >
      {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
