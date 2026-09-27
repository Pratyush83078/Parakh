import './globals.css';
import SupermemorySidebar from '@/components/SupermemorySidebar';
import CommandPalette from '@/components/CommandPalette';
import { Geist, Geist_Mono, Geist_Pixel } from '@/lib/fonts';

export const metadata = {
  title: 'PARAKH AI — Infrastructure Risk Intelligence Radar',
  description: 'National Central Sector Infrastructure Risk Intelligence & Early Warning System. MoSPI SIH 26103.',
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
      className={`${Geist.variable} ${Geist_Mono.variable} ${Geist_Pixel.variable}`}
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
        <div className="sm-app-container">
          <SupermemorySidebar />
          <main className="sm-content-area">
            {children}
          </main>
        </div>
        <CommandPalette />
      </body>
    </html>
  );
}

