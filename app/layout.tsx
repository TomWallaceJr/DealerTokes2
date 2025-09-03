// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import Script from 'next/script';

import BottomNav from '@/components/BottomNav';
import LargeNavBar from '@/components/LargeNavBar';
import SmallNavBar from '@/components/SmallNavBar';
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
          {/* Sentry (client) via CDN — initialized only if DSN is provided */}
          {process.env.NEXT_PUBLIC_SENTRY_DSN ? (
            <>
              <Script
                src="https://browser.sentry-cdn.com/7.114.0/bundle.tracing.min.js"
                strategy="afterInteractive"
                crossOrigin="anonymous"
              />
              <Script id="sentry-init" strategy="afterInteractive">
                {`
                  if (window.Sentry) {
                    window.Sentry.init({
                      dsn: '${process.env.NEXT_PUBLIC_SENTRY_DSN}',
                      tracesSampleRate: 0.1,
                      environment: '${process.env.NODE_ENV}',
                    });
                  }
                `}
              </Script>
            </>
          ) : null}

          {/* Responsive navbars */}
          <div className="hidden sm:block">
            <LargeNavBar />
          </div>
          <SmallNavBar />
          <main className="mx-auto max-w-4xl px-4 pt-[calc(56px+env(safe-area-inset-top)+12px)] pb-20 sm:pt-6 sm:pb-6">
            {children}
          </main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
