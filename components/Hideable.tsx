// components/Hideable.tsx
'use client';

import { useEffect, useState } from 'react';

type Props = {
  id: string; // unique key for localStorage
  children: React.ReactNode; // content to show/hide
  className?: string; // wrapper classes
  hiddenLabel?: string; // text to show next to "+" when hidden (e.g., "Snapshot hidden")
  defaultHidden?: boolean; // optional initial default
  overlayToggle?: boolean; // if true, position toggle button at top-left overlay
};

export default function Hideable({
  id,
  children,
  className,
  hiddenLabel,
  defaultHidden = false,
  overlayToggle = false,
}: Props) {
  const storageKey = `hide:${id}`;
  const [hidden, setHidden] = useState(defaultHidden);

  // restore from localStorage
  useEffect(() => {
    try {
      const v = localStorage.getItem(storageKey);
      if (v === '1') setHidden(true);
      if (v === '0') setHidden(false);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const hide = () => {
    setHidden(true);
    try {
      localStorage.setItem(storageKey, '1');
    } catch {}
  };

  const show = () => {
    setHidden(false);
    try {
      localStorage.setItem(storageKey, '0');
    } catch {}
  };

  return (
    <div className={overlayToggle ? `relative ${className ?? ''}` : className}>
      {/* Toggle bar (always visible) */}
      <div
        className={
          overlayToggle
            ? 'absolute left-2 top-2 z-10 flex items-center gap-2'
            : 'mb-2 flex items-center gap-2'
        }
      >
        {hidden ? (
          <>
            <button
              type="button"
              onClick={show}
              aria-label="Show section"
              title="Show"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-slate-700 shadow-sm ring-1 ring-slate-200/70 transition hover:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {/* plus */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            {hiddenLabel ? <span className="text-xs text-slate-600">{hiddenLabel}</span> : null}
          </>
        ) : (
          <button
            type="button"
            onClick={hide}
            aria-label="Hide section"
            title="Hide"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-slate-700 shadow-sm ring-1 ring-slate-200/70 transition hover:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            {/* minus */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      {!hidden && <div>{children}</div>}
    </div>
  );
}
