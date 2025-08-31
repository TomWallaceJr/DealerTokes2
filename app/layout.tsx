// app/layout.tsx
import HeaderRight from '@/components/HeaderRight';
import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

import { APP_NAME, TAGLINE } from '@/lib/appConfig';
import Providers from './providers'; // <SessionProvider>

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
      <body className="min-h-screen antialiased">
        <Providers>
          <header className="sticky top-0 z-40 border-b border-emerald-200/60 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/50">
            <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
              <Link
                href="/"
                className="rounded text-lg font-semibold tracking-tight text-emerald-700 hover:text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {APP_NAME}
              </Link>

              {/* right actions */}
              <HeaderRight />
            </div>
          </header>

          <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
