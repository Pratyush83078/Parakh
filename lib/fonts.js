import localFont from 'next/font/local';
import { Tiro_Devanagari_Hindi, Fraunces } from 'next/font/google';

// Editorial display serif for the landing story ("Blueprint on paper", see kimi.md).
export const FrauncesFont = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['SOFT', 'WONK', 'opsz'],
  variable: '--font-fraunces',
  display: 'swap',
});

// Devanagari wordmark: परख
export const Tiro = Tiro_Devanagari_Hindi({
  subsets: ['devanagari'],
  weight: '400',
  variable: '--font-tiro',
  display: 'swap',
});

export const Geist = localFont({
  src: '../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2',
  variable: '--font-geist-sans',
  display: 'swap',
});

export const Geist_Mono = localFont({
  src: '../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2',
  variable: '--font-geist-mono',
  display: 'swap',
});
