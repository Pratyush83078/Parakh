import './globals.css';
import AppShell from '@/components/AppShell';
import CommandPalette from '@/components/CommandPalette';
import ThemeToggle from '@/components/ThemeToggle';
import { Geist, Geist_Mono, Tiro, FrauncesFont } from '@/lib/fonts';

export const metadata = {
  title: 'Parakh · Early warning for central infrastructure projects (SIH 26103)',
  description:
    'Parakh reads MoSPI PAIMANA Flash Reports, scores each central infrastructure project with open rules, and estimates which completion dates will move in the next report. Open source, SIH 26103.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${Geist.variable} ${Geist_Mono.variable} ${Tiro.variable} ${FrauncesFont.variable}`}
      data-theme="dark"
      data-style="minimalist"
      suppressHydrationWarning
    >
      <head>
        {/* Apply the saved theme before first paint — no light/dark flash. */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('parakh-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t)}}catch(e){}` }} />
      </head>
      <body>
        <ThemeToggle />
        <AppShell>{children}</AppShell>
        <CommandPalette />
      </body>
    </html>
  );
}

