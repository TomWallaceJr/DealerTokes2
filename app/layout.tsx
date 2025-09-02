// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

import BottomNav from '@/components/BottomNav';
import SmallNavBar from '@/components/SmallNavBar';
import LargeNavBar from '@/components/LargeNavBar';
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
          {/* Responsive navbars */}
          <div className="hidden sm:block">
            <LargeNavBar />
          </div>
          <SmallNavBar />
          <main className="mx-auto max-w-4xl px-4 pb-6 pt-[calc(56px+env(safe-area-inset-top))] sm:pt-6">{children}</main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
