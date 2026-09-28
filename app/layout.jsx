import './globals.css';
import AppShell from '@/components/AppShell';
import CommandPalette from '@/components/CommandPalette';
import { Geist, Geist_Mono, Geist_Pixel, Anek, Tiro, FrauncesFont } from '@/lib/fonts';

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
      className={`${Geist.variable} ${Geist_Mono.variable} ${Geist_Pixel.variable} ${Anek.variable} ${Tiro.variable} ${FrauncesFont.variable}`}
      data-theme="light"
      data-style="minimalist"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800;900&family=Geist+Mono:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppShell>{children}</AppShell>
        <CommandPalette />
      </body>
    </html>
  );
}

