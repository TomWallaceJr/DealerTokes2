// app/layout.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

import BottomNav from '@/components/BottomNav';
import HeaderRight from '@/components/HeaderRight';
import { APP_NAME, TAGLINE } from '@/lib/appConfig';
import Providers from './providers';

export const metadata: Metadata = {
  title: { default: `${APP_NAME} • ${TAGLINE}`, template: `%s • ${APP_NAME}` },
  description: TAGLINE,
  openGraph: { title: APP_NAME, description: TAGLINE, type: 'website' },
  twitter: { card: 'summary_large_image', title: APP_NAME, description: TAGLINE },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Providers>
          <header className="sticky top-0 z-40 border-b border-emerald-200/60 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/50">
            <div className="mx-auto max-w-4xl px-4 py-3">
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                {/* Brand + Tagline */}
                <div className="min-w-0">
                  <Link
                    href="/"
                    className="group inline-block rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    aria-label={`${APP_NAME} home`}
                  >
                    <h1 className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent group-hover:opacity-90 sm:text-3xl">
                      {APP_NAME}
                    </h1>
                  </Link>
                  <p className="mt-0.5 truncate text-xs text-slate-600 sm:text-sm">{TAGLINE}</p>
                </div>

                {/* Right-side actions (kept from shrinking differently) */}
                <div className="shrink-0">
                  <HeaderRight />
                </div>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
