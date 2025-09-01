// components/BottomNav.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const goBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  }, [router]);

  const isHome = pathname === '/';

  return (
    <>
      {/* Spacer so content isn’t hidden under the fixed footer */}
      <div className="h-20" aria-hidden />

      <nav
        className="app-footer"
        role="navigation"
        aria-label="Bottom Navigation"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Cluster the three buttons close together */}
        <div className="mx-auto flex max-w-md items-center justify-center gap-15 px-3 py-2">
          {/* Back */}
          <button
            type="button"
            onClick={goBack}
            className="app-footer-btn group"
            title="Back"
            aria-label="Go back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 transition group-active:-translate-x-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
            <span className="sr-only">Back</span>
          </button>

          {/* Home (nicer icon, tighter highlight) */}
          <Link
            href="/"
            prefetch={false}
            className={[
              'app-footer-btn',
              isHome
                ? 'bg-emerald-600 text-white ring-0 hover:bg-emerald-700 active:bg-emerald-800'
                : '',
            ].join(' ')}
            aria-label="Home"
            aria-current={isHome ? 'page' : undefined}
            title="Home"
          >
            {/* cleaner home icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 10.5 12 3l9 7.5" />
              <path d="M5 10v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9" />
              <path d="M9 21v-8h6v8" />
            </svg>
            <span className="sr-only">Home</span>
          </Link>

          {/* Settings (inactive but more visible) */}
          <button
            type="button"
            disabled
            className="app-footer-btn cursor-not-allowed text-slate-500 opacity-80"
            title="Settings (coming soon)"
            aria-label="Settings (inactive)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09c.32 0 .63-.06.93-.17.61-.23 1-.84 1-1.51V9c0-.67-.39-1.28-1-1.51A3.1 3.1 0 0 1 3.09 7H3a2 2 0 1 1 0-4h.09c.32 0 .63.06.93.17.61.23 1 .84 1 1.51V5a1.65 1.65 0 0 0 1 1.51c.53.2 1.13.16 1.62-.08s.93-.65 1.2-1.14l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.49.27-.87.69-1.11 1.18s-.29 1.09-.09 1.62V11c.23.61.84 1 1.51 1H21a2 2 0 1 1 0 4h-.09c-.32 0-.63.06-.93.17-.61.23-1 .84-1 1.51Z" />
            </svg>
            <span className="sr-only">Settings</span>
          </button>
        </div>
      </nav>
    </>
  );
}
