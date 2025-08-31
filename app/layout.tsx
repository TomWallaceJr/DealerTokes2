// app/layout.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

import { APP_NAME, TAGLINE } from '@/lib/appConfig';
import Providers from './providers'; // <-- wraps with <SessionProvider>

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} • ${TAGLINE}`,
    template: `%s • ${APP_NAME}`,
  },
  description: TAGLINE,
  openGraph: {
    title: APP_NAME,
    description: TAGLINE,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_NAME,
    description: TAGLINE,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-100">
        <Providers>
          {/* Simple header with brand linking home */}
          <header className="border-b border-zinc-800">
            <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
              <Link
                href="/"
                className="rounded text-lg font-semibold tracking-tight hover:opacity-90 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {APP_NAME}
              </Link>
              {/* space for right-side actions if you add any later */}
              <div />
            </div>
          </header>

          <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
