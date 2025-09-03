// app/page.tsx
import CalendarPicker from '@/components/CalendarPicker';
import DemoSignInButton from '@/components/DemoSignInButton';
import HomeQuickActions from '@/components/HomeQuickActions';
import Snapshot from '@/components/Snapshot';
import { DEMO_EMAIL, DEMO_GREETING_NAMES } from '@/lib/appConfig';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import Link from 'next/link';

function displayName(name?: string | null, email?: string | null) {
  const n = (name ?? '').trim();
  if (n) return n.split(/\s+/)[0];
  if (email) return email.split('@')[0];
  return 'there';
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const isDemo =
    !!session?.user?.email && session.user.email.toLowerCase() === DEMO_EMAIL.toLowerCase();
  const userName = isDemo
    ? DEMO_GREETING_NAMES[Math.floor(Math.random() * DEMO_GREETING_NAMES.length)]
    : displayName(session?.user?.name, session?.user?.email);

  if (!session) {
    // Public/marketing page
    return (
      <main className="space-y-10">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-2xl border border-emerald-200/60 bg-white/70 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="pointer-events-none absolute -top-16 -right-12 h-40 w-40 rounded-full bg-gradient-to-br from-emerald-300/40 to-teal-300/30 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-12 h-48 w-48 rounded-full bg-gradient-to-br from-cyan-300/40 to-emerald-300/30 blur-2xl" />

          <div className="relative z-10">
            <h1 className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
              Track every down. See every dollar.
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              DownCount gives poker dealers a fast, clean way to log shifts, cash tokes, and
              downs—then turns it into actionable income stats.
            </p>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link href="/auth/signup" className="btn btn-primary w-full sm:w-auto">
                Create Account
              </Link>
              <Link href="/auth/signin" className="btn w-full sm:w-auto">
                Sign In
              </Link>
              <DemoSignInButton className="w-full sm:w-auto"  />
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="card">
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 ring-1 ring-emerald-200">
              <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                <path
                  d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Log data in seconds</h3>
            <p className="mt-1 text-sm text-slate-600">
              Date, room, hours, downs, and cash tokes—optimized for speed on mobile.
            </p>
          </div>

          <div className="card">
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 ring-1 ring-sky-200">
              <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                <path d="M3 3v18h18" strokeWidth="2" strokeLinecap="round" />
                <path d="M7 16l4-4 3 3 5-6" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Smart income stats</h3>
            <p className="mt-1 text-sm text-slate-600">
              YTD totals, $/h, $/down, and per-room breakdowns—filter by month, weekday, or room.
            </p>
          </div>

          <div className="card">
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 ring-1 ring-indigo-200">
              <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                <path
                  d="M12 2l7 4v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-4z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Yours, privately</h3>
            <p className="mt-1 text-sm text-slate-600">
              Your data stays yours. Export anytime—no lock-in.
            </p>
          </div>
        </section>

        {/* NOTE */}
        <section className="rounded-2xl border border-emerald-200/60 bg-white/70 p-4 text-sm text-slate-700 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="mb-2">
            <DemoSignInButton
              className="w-full px-4 py-3 text-base sm:w-auto"
              
            >
              Try Demo
            </DemoSignInButton>
          </div>
          Prefer not to create an account yet? Test drive the demo—then sign up when you’re ready.
        </section>

        {/* EARLY DEVELOPMENT NOTICE */}
        <section
          role="note"
          aria-label="Early development notice"
          className="rounded-2xl border border-amber-200/70 bg-amber-50/80 p-3 text-[12px] text-amber-800 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-amber-50/70 sm:text-sm"
          style={{ marginBottom: 'max(env(safe-area-inset-bottom), 10px)' }}
        >
          <div className="flex items-start gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 sm:h-5 sm:w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
            <p>
              This application is in early development. Features may change and some areas may be
              incomplete or unstable. We appreciate your feedback as we iterate.
            </p>
          </div>
        </section>
      </main>
    );
  }

  // Authenticated dashboard
  return (
    <main className="space-y-6">
      {/* TopNavBar now rendered globally in layout */}

      {/* Snapshot visible on all screens; responsive inside */}
      <Snapshot userName={userName} />

      {/* On desktop: Quick Actions (horizontal) ABOVE Calendar
          On mobile: Calendar FIRST, then Quick Actions stacked vertically */}
      <section className="grid gap-4">
        {/* Calendar (mobile-first order = first) */}
        <div className="order-1 md:order-2">
          <CalendarPicker />
        </div>

        {/* Quick actions: base (mobile) comes after calendar, on lg it moves above */}
        <div className="order-2 md:order-1">
          {/* HomeQuickActions already lays out horizontally on sm+ via its grid classes,
              and vertically (one-per-row) on xs by default. */}
          <HomeQuickActions />
        </div>
      </section>

      {/* EARLY DEVELOPMENT NOTICE */}
      <section
        role="note"
        aria-label="Early development notice"
        className="rounded-2xl border border-amber-200/70 bg-amber-50/80 p-3 text-[12px] text-amber-800 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-amber-50/70 sm:text-sm"
      >
        <div className="flex items-start gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 sm:h-5 sm:w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
          <p>
            This application is in early development. Features may change and some areas may be
            incomplete or unstable. We appreciate your feedback as we iterate.
          </p>
        </div>
      </section>
    </main>
  );
}
