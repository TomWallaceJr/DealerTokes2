// components/BottomNav.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export default function BottomNav() {
  const router = useRouter();

  const goBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/');
  }, [router]);

  return (
    <nav
      className="app-footer sm:hidden"
      role="navigation"
      aria-label="Bottom Navigation"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="relative mx-auto flex max-w-5xl items-center justify-between px-4" style={{ minHeight: 'var(--footer-h)' }}>
        {/* Large Back button (bottom-left) */}
        <button
          type="button"
          onClick={goBack}
          className="footer-icon-btn h-12 w-12"
          title="Back"
          aria-label="Go back"
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
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          <span className="sr-only">Back</span>
        </button>

        {/* Center copyright */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="select-none rounded-full bg-white/70 px-2.5 py-1 text-[10px] text-slate-600 shadow-sm ring-1 ring-slate-300/60 backdrop-blur supports-[backdrop-filter]:bg-white/60">© 2025 PitchPerfectPoker LLC</span>
        </div>

        {/* Settings cog (inactive, bottom-right) */}
        <button
          type="button"
          disabled
          className="footer-icon-btn h-12 w-12 cursor-not-allowed text-slate-500 opacity-80"
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
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09c.32 0 .63.06.93.17.61.23 1 .84 1 1.51V5a1.65 1.65 0 0 0 1 1.51c.53.2 1.13.16 1.62-.08s.93-.65 1.2-1.14l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.49.27-.87.69-1.11 1.18s-.29 1.09-.09 1.62V11c.23.61.84 1 1.51 1H21a2 2 0 1 1 0 4h-.09c-.32 0-.63.06-.93.17-.61.23-1 .84-1 1.51Z" />
          </svg>
          <span className="sr-only">Settings</span>
        </button>
      </div>
    </nav>
  );
}
