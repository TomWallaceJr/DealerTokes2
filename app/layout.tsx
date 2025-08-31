// app/layout.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

import HeaderRight from '@/components/HeaderRight'; // session-aware actions (Sign in/out)
import { APP_NAME, TAGLINE } from '@/lib/appConfig';
import Providers from './providers'; // <SessionProvider>

export const metadata: Metadata = {
  title: { default: `${APP_NAME} • ${TAGLINE}`, template: `%s • ${APP_NAME}` },
  description: TAGLINE,
  openGraph: { title: APP_NAME, description: TAGLINE, type: 'website' },
  twitter: { card: 'summary_large_image', title: APP_NAME, description: TAGLINE },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Let globals.css control background/colors */}
      <body className="min-h-screen antialiased">
        <Providers>
          <header className="sticky top-0 z-40 border-b border-emerald-200/60 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/50">
            <div className="mx-auto max-w-4xl px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                {/* Brand + Tagline */}
                <div className="min-w-0">
                  <Link
                    href="/"
                    className="group inline-block rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    aria-label={`${APP_NAME} home`}
                  >
                    <h1 className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent group-hover:opacity-90 sm:text-4xl">
                      {APP_NAME}
                    </h1>
                  </Link>
                  <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">
                    {TAGLINE /* “Every down counted. Every dollar tracked.” */}
                  </p>
                </div>

                {/* Right-side actions (Sign in / Sign out) */}
                <HeaderRight />
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
