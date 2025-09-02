// components/TopNavBar.tsx
'use client';

import type React from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useState } from 'react';

function IconBase(props: React.SVGProps<SVGSVGElement>) {
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

function Plus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" />
      <path d="M12 8v8" stroke="#fff" />
      <path d="M8 12h8" stroke="#fff" />
    </IconBase>
  );
}

function ListClock(props: React.SVGProps<SVGSVGElement>) {
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

function Chart(props: React.SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M3 3v18h18" />
      <path d="M7 16l4-4 3 3 5-6" />
    </IconBase>
  );
}

function Logout(props: React.SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M10 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3" />
      <path d="M17 8l4 4-4 4" />
      <path d="M21 12H10" />
    </IconBase>
  );
}

export default function TopNavBar() {
  const [signingOut, setSigningOut] = useState(false);

  return (
    <nav className="sticky top-0 z-40 block w-full border-b border-emerald-200/60 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 sm:hidden">
      <div className="w-full px-3">
        <div className="flex h-12 items-center justify-between">
          {/* Add Shift */}
          <Link
            href="/shifts/new"
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-white shadow-md ring-1 ring-emerald-400/50 transition-transform focus:outline-none focus:ring-2 focus:ring-emerald-500 active:scale-[.98]"
            aria-label="Add Shift"
          >
            <span className="relative inline-flex items-center justify-center rounded-full bg-emerald-500 p-1.5 shadow-[0_6px_18px_rgba(16,185,129,0.35)]">
              <Plus width={28} height={28} />
            </span>
            <span className="text-[13px] text-emerald-700">Add</span>
          </Link>

          {/* Recent Shifts */}
          <Link
            href="/shifts"
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-slate-700 hover:text-emerald-700"
            aria-label="Recent Shifts"
          >
            <ListClock width={20} height={20} />
            <span className="text-[13px]">Shifts</span>
          </Link>

          {/* View Stats */}
          <Link
            href="/stats"
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-slate-700 hover:text-emerald-700"
            aria-label="View Stats"
          >
            <Chart width={20} height={20} />
            <span className="text-[13px]">Stats</span>
          </Link>

          {/* Sign out */}
          <button
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-slate-700 hover:text-emerald-700"
            aria-label="Sign out"
            onClick={async () => {
              if (signingOut) return;
              setSigningOut(true);
              await signOut({ callbackUrl: '/' });
            }}
            disabled={signingOut}
          >
            <Logout width={20} height={20} />
            <span className="text-[13px]">Sign out</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
