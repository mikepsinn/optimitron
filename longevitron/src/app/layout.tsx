import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Longevitron', template: '%s · Longevitron' },
  description: 'Budgets and laws that maximize healthy life expectancy, per country. Every number links to its source.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link href="/" className="brand">Longevitron</Link>
          <nav>
            <Link href="/">Countries</Link>
            <Link href="/method/">Method</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          Every decimal, percentage, and money amount on this site comes from a saved source file and passes an automated check.{' '}
          <Link href="/method/">How it works</Link>
        </footer>
      </body>
    </html>
  );
}
