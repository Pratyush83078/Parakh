import localFont from 'next/font/local';
import { Anek_Latin, Tiro_Devanagari_Hindi, Fraunces } from 'next/font/google';

// Editorial display serif for the landing story ("Blueprint on paper", see kimi.md).
export const FrauncesFont = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['SOFT', 'WONK', 'opsz'],
  variable: '--font-fraunces',
  display: 'swap',
});

// Display face: Anek Latin (Ek Type), variable width + weight.
export const Anek = Anek_Latin({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-anek',
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

export const Geist_Pixel = localFont({
  src: '../node_modules/geist/dist/fonts/geist-pixel/GeistPixel-Square.woff2',
  variable: '--font-geist-pixel',
  display: 'swap',
});
