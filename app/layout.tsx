import BackButton from '@/components/BackButton';
import SignOutButton from '@/components/SignOutButton';
import { APP_NAME, TAGLINE } from '@/lib/appConfig';
import { authOptions } from '@/lib/auth';
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import './globals.css';

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="container-app py-4">
          <header className="flex items-center justify-between pb-6">
            <Link
              href="/"
              className="rounded text-lg font-semibold tracking-tight hover:opacity-90 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <div>
                <h1 className="text-2xl font-semibold">{APP_NAME}</h1>
                <p className="text-sm text-zinc-400">Every down counted. Every dollar tracked.</p>
              </div>
            </Link>

            {/* Only show Sign out if logged in; no Sign in / Create here */}
            <div className="flex gap-2">
              {session ? (
                <>
                  <SignOutButton /> <BackButton />{' '}
                </>
              ) : null}
            </div>
          </header>
          <main className="space-y-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
