import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Recepten — Hagens',
  description: 'Ons receptenboek',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-[var(--font-inter)] bg-[#f8f7f4] text-stone-900">
        {children}
      </body>
    </html>
  );
}
