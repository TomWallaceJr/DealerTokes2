// components/LargeNavBar.tsx
'use client';
import Link from 'next/link';
import { APP_NAME, TAGLINE } from '@/lib/appConfig';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { type SVGProps } from 'react';

function IconBase(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

const HomeIcon = (p: SVGProps<SVGSVGElement>) => (
  <IconBase {...p}>
    <path d="M3 12l9-9 9 9" />
    <path d="M5 10v10h14V10" />
  </IconBase>
);
const ListClock = (p: SVGProps<SVGSVGElement>) => (
  <IconBase {...p}>
    <path d="M3 6h8" />
    <path d="M3 12h8" />
    <path d="M3 18h8" />
    <circle cx="18" cy="12" r="5" />
    <path d="M18 10v3l2 1" />
  </IconBase>
);
const Chart = (p: SVGProps<SVGSVGElement>) => (
  <IconBase {...p}>
    <path d="M3 3v18h18" />
    <path d="M7 16l4-4 3 3 5-6" />
  </IconBase>
);
const Plus = (p: SVGProps<SVGSVGElement>) => (
  <IconBase {...p}>
    <circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" />
    <path d="M12 8v8" stroke="#fff" />
    <path d="M8 12h8" stroke="#fff" />
  </IconBase>
);

const Logout = (p: SVGProps<SVGSVGElement>) => (
  <IconBase {...p}>
    <path d="M10 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3" />
    <path d="M17 8l4 4-4 4" />
    <path d="M21 12H10" />
  </IconBase>
);

export default function LargeNavBar() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 hidden border-b border-emerald-200/60 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/50 sm:block">
      <div className="mx-auto max-w-4xl px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Brand + Tagline */}
          <div className="min-w-0">
            <Link
              href="/"
              className="group inline-block rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label={`${APP_NAME} home`}
            >
              <h1 className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent group-hover:opacity-90">
                {APP_NAME}
              </h1>
            </Link>
            <p className="mt-0.5 truncate text-xs text-slate-600">{TAGLINE}</p>
          </div>

          {/* Right actions */}
          <div className="flex shrink-0 items-center gap-5">
            {/* Log a Shift — emerald pill with white + on left */}
            <Link
              href="/shifts/new"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3.5 py-2 text-white shadow-[0_10px_24px_rgba(5,150,105,0.45)] transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              aria-label="Log a Shift"
              title="Log a Shift"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600">
                {/* white plus */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </span>
              <span className="text-sm font-medium">Log a Shift</span>
            </Link>

            {/* Icon nav — match SmallNavBar effects */}
            <nav className="flex items-center gap-7 text-sm">
              <Link
                href="/"
                className={`inline-flex flex-col items-center gap-1 ${
                  isActive('/') ? 'text-emerald-700' : 'text-slate-700 hover:text-emerald-700'
                }`}
                aria-label="Home"
              >
                <span className="inline-flex items-center justify-center">
                  <HomeIcon width={28} height={28} />
                </span>
                <span className="leading-none">Home</span>
                <span className={`mt-0.5 h-0.5 w-5 rounded-full ${isActive('/') ? 'bg-emerald-600' : 'bg-transparent'}`} aria-hidden />
              </Link>
              <Link
                href="/shifts"
                className={`inline-flex flex-col items-center gap-1 ${
                  isActive('/shifts') ? 'text-emerald-700' : 'text-slate-700 hover:text-emerald-700'
                }`}
                aria-label="Shifts"
              >
                <span className="inline-flex items-center justify-center">
                  <ListClock width={28} height={28} />
                </span>
                <span className="leading-none">Shifts</span>
                <span className={`mt-0.5 h-0.5 w-5 rounded-full ${isActive('/shifts') ? 'bg-emerald-600' : 'bg-transparent'}`} aria-hidden />
              </Link>
              <Link
                href="/stats"
                className={`inline-flex flex-col items-center gap-1 ${
                  isActive('/stats') ? 'text-emerald-700' : 'text-slate-700 hover:text-emerald-700'
                }`}
                aria-label="Stats"
              >
                <span className="inline-flex items-center justify-center">
                  <Chart width={28} height={28} />
                </span>
                <span className="leading-none">Stats</span>
                <span className={`mt-0.5 h-0.5 w-5 rounded-full ${isActive('/stats') ? 'bg-emerald-600' : 'bg-transparent'}`} aria-hidden />
              </Link>
            </nav>

            {/* Sign out icon (matches SmallNavBar) when authenticated */}
            {session ? (
              <button
                type="button"
                title="Sign out"
                aria-label="Sign out"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="inline-flex flex-col items-center gap-1 rounded-lg px-2 py-1 text-center text-slate-700 hover:text-emerald-700"
              >
                <Logout width={26} height={26} />
                <span className="text-[11px] leading-none">Sign out</span>
              </button>
            ) : (
              <Link href="/auth/signin" className="btn btn-outline">Sign in</Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
