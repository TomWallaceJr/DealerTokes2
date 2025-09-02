// components/SmallNavBar.tsx
'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useState, type SVGProps } from 'react';
import { usePathname } from 'next/navigation';

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

function Plus(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" />
      <path d="M12 8v8" stroke="#fff" />
      <path d="M8 12h8" stroke="#fff" />
    </IconBase>
  );
}

function ListClock(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M3 6h8" />
      <path d="M3 12h8" />
      <path d="M3 18h8" />
      <circle cx="18" cy="12" r="5" />
      <path d="M18 10v3l2 1" />
    </IconBase>
  );
}

function Chart(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M3 3v18h18" />
      <path d="M7 16l4-4 3 3 5-6" />
    </IconBase>
  );
}

function Logout(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M10 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3" />
      <path d="M17 8l4 4-4 4" />
      <path d="M21 12H10" />
    </IconBase>
  );
}

function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M3 12l9-9 9 9" />
      <path d="M5 10v10h14V10" />
    </IconBase>
  );
}

export default function SmallNavBar() {
  const [signingOut, setSigningOut] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <>
      {/* Floating Add button — popped out, exact top-left */}
      <Link
        href="/shifts/new"
        className="fixed left-3 z-50 inline-flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 active:scale-[.98] sm:hidden"
        aria-label="Add Shift"
        title="Add Shift"
        style={{ top: 'max(env(safe-area-inset-top), 0.75rem)' }}
      >
        <span className="inline-flex items-center justify-center rounded-full bg-emerald-500 p-2.5 text-emerald-500 shadow-[0_12px_28px_rgba(16,185,129,0.50)]">
          <Plus width={36} height={36} />
        </span>
      </Link>

      <nav className="fixed inset-x-0 top-0 z-40 block w-full border-b border-emerald-200/60 bg-white/80 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-white/60 sm:hidden">
        <div className="w-full px-2">
          <div className="flex h-14 items-center justify-around gap-1">
            {/* placeholder to preserve spacing where Add button lives */}
            <span className="inline-block w-12" aria-hidden="true" />
            {/* Home */}
            <Link
              href="/"
              className={`inline-flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-center ${
                isActive('/') ? 'text-emerald-700' : 'text-slate-700 hover:text-emerald-700'
              }`}
              aria-label="Home"
            >
              <HomeIcon width={24} height={24} />
              <span className="text-[11px] leading-none">Home</span>
              <span
                className={`mt-0.5 h-0.5 w-4 rounded-full ${
                  isActive('/') ? 'bg-emerald-500' : 'bg-transparent'
                }`}
                aria-hidden
              />
            </Link>
            {/* Recent Shifts */}
            <Link
              href="/shifts"
              className={`inline-flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-center ${
                isActive('/shifts') ? 'text-emerald-700' : 'text-slate-700 hover:text-emerald-700'
              }`}
              aria-label="Recent Shifts"
            >
              <ListClock width={24} height={24} />
              <span className="text-[11px] leading-none">Shifts</span>
              <span
                className={`mt-0.5 h-0.5 w-4 rounded-full ${
                  isActive('/shifts') ? 'bg-emerald-500' : 'bg-transparent'
                }`}
                aria-hidden
              />
            </Link>

            {/* View Stats */}
            <Link
              href="/stats"
              className={`inline-flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-center ${
                isActive('/stats') ? 'text-emerald-700' : 'text-slate-700 hover:text-emerald-700'
              }`}
              aria-label="View Stats"
            >
              <Chart width={24} height={24} />
              <span className="text-[11px] leading-none">Stats</span>
              <span
                className={`mt-0.5 h-0.5 w-4 rounded-full ${
                  isActive('/stats') ? 'bg-emerald-500' : 'bg-transparent'
                }`}
                aria-hidden
              />
            </Link>

            {/* Sign out */}
            <button
              className="inline-flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-center text-slate-700 hover:text-emerald-700"
              aria-label="Sign out"
              onClick={async () => {
              if (signingOut) return;
              setSigningOut(true);
              await signOut({ callbackUrl: '/' });
              }}
              disabled={signingOut}
            >
              <Logout width={24} height={24} />
              <span className="text-[11px] leading-none">Sign out</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
