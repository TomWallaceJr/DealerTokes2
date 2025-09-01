// app/page.tsx
import CalendarPicker from '@/components/CalendarPicker';
import DemoSignInButton from '@/components/DemoSignInButton';
import HomeQuickActions from '@/components/HomeQuickActions';
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
  const userName = displayName(session?.user?.name, session?.user?.email);

  if (!session) {
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
              <DemoSignInButton />
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
            <h3 className="text-sm font-semibold text-slate-900">Log in seconds</h3>
            <p className="mt-1 text-sm text-slate-600">
              Date, room, clock in/out, downs, and cash tokes—optimized for speed on mobile.
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

        {/* HOW IT WORKS */}
        <section className="card">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">How it works</h2>
          <ol className="grid list-decimal gap-3 pl-5 sm:grid-cols-3">
            <li className="text-sm text-slate-700">
              <span className="font-medium text-slate-900">Create your account.</span> It takes
              under a minute.
            </li>
            <li className="text-sm text-slate-700">
              <span className="font-medium text-slate-900">Log shifts as you go.</span> Enter your
              workday income in seconds.
            </li>
            <li className="text-sm text-slate-700">
              <span className="font-medium text-slate-900">See your income clearly.</span> Instantly
              view totals, $/h, and $/down.
            </li>
          </ol>
        </section>

        {/* NOTE */}
        <section className="rounded-2xl border border-emerald-200/60 bg-white/70 p-4 text-sm text-slate-700 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
          Prefer not to create an account yet? Use the demo—then sign up when you’re ready.
        </section>
      </main>
    );
  }

  // Authenticated view
  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Hello {userName}!</h1>
      <HomeQuickActions />
      <CalendarPicker />
    </main>
  );
}
