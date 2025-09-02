// components/Snapshot.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

type Summary = {
  total: number;
  hours: number;
  downs: number;
  hourly: number;
  perDown: number;
  count: number;
};

function money(n: number, digits = 0) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: digits,
  }).format(n);
}

function num(n: number, digits = 2) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function ymdLocal(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function mondayOf(date: Date) {
  const d = new Date(date);
  const delta = (d.getDay() + 6) % 7; // Mon=0
  d.setDate(d.getDate() - delta);
  d.setHours(0, 0, 0, 0);
  return d;
}
function nextMondayOf(date: Date) {
  const mon = mondayOf(date);
  const next = new Date(mon);
  next.setDate(mon.getDate() + 7);
  return next;
}

export default function Snapshot({ userName }: { userName?: string | null }) {
  const now = useMemo(() => new Date(), []);
  const firstName = (userName ?? '').split(/\s+/)[0] || 'there';

  const [week, setWeek] = useState<Summary | null>(null);
  const [month, setMonth] = useState<Summary | null>(null);
  const [ytd, setYtd] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);

  // persist hidden state (match Hideable storage key semantics)
  const storageKey = 'hide:snapshot';
  useEffect(() => {
    try {
      const v = localStorage.getItem(storageKey);
      if (v === '1') setHidden(true);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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

  useEffect(() => {
    (async () => {
      try {
        const y = now.getFullYear();
        const m = now.getMonth() + 1;

        const qWeek = new URLSearchParams({
          from: ymdLocal(mondayOf(now)),
          to: ymdLocal(nextMondayOf(now)),
        });
        const qMonth = new URLSearchParams({ year: String(y), month: String(m) });
        const qYtd = new URLSearchParams({ year: String(y) });

        const [rW, rM, rY] = await Promise.all([
          fetch(`/api/shifts/summary?${qWeek}`),
          fetch(`/api/shifts/summary?${qMonth}`),
          fetch(`/api/shifts/summary?${qYtd}`),
        ]);

        setWeek(rW.ok ? await rW.json() : null);
        setMonth(rM.ok ? await rM.json() : null);
        setYtd(rY.ok ? await rY.json() : null);
      } finally {
        setLoading(false);
      }
    })();
  }, [now]);

  const dayStr = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(now);

  return (
    <div className="card mt-3 sm:mt-0">
      {/* Header row: hide toggle immediately left of greeting */}
      <div className="mb-2 flex items-center gap-2">
        {hidden ? (
          <>
            <button
              type="button"
              onClick={show}
              aria-label="Show snapshot"
              title="Show"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-slate-700 shadow-sm ring-1 ring-slate-200/70 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            <span className="text-xs text-slate-600">Snapshot hidden</span>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={hide}
              aria-label="Hide snapshot"
              title="Hide"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-slate-700 shadow-sm ring-1 ring-slate-200/70 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Hello, {firstName}</h1>
              <p className="mt-0.5 text-xs text-slate-600">{dayStr}</p>
            </div>
          </>
        )}
      </div>

      {/* Content */}
      {!hidden && (
        <>
          {/* Mobile: vertical pills with one-line stats */}
          <div className="space-y-2 sm:hidden">
            <Pill label="This Week" loading={loading} s={week} />
            <Pill label="This Month" loading={loading} s={month} />
            <Pill label="YTD" loading={loading} s={ytd} />
          </div>

          {/* Desktop: three cards */}
          <div className="mt-2 hidden gap-2 sm:grid sm:grid-cols-3">
            <SnapshotCard label="This Week" loading={loading} s={week} />
            <SnapshotCard label="This Month" loading={loading} s={month} />
            <SnapshotCard label="YTD" loading={loading} s={ytd} />
          </div>
        </>
      )}
    </div>
  );
}

function SnapshotCard({ label, loading, s }: { label: string; loading: boolean; s: Summary | null }) {
  return (
    <div className="rounded-xl border border-emerald-200/60 bg-white/70 p-3 shadow-sm">
      <div className="text-xs text-slate-600">{label}</div>
      {loading ? (
        <div className="mt-1 h-6 w-28 animate-pulse rounded bg-slate-200/60" />
      ) : s ? (
        <div className="mt-0.5 text-sm">
          <div className="font-medium text-slate-900">{money(s.total)}</div>
          <div className="text-slate-600">${num(s.hourly)} / h • ${num(s.perDown)} / down</div>
        </div>
      ) : (
        <div className="mt-0.5 text-sm text-slate-500">No data</div>
      )}
    </div>
  );
}

function Pill({ label, loading, s }: { label: string; loading: boolean; s: Summary | null }) {
  return (
    <div className="flex items-center justify-between rounded-full border border-emerald-300/60 bg-white/80 px-3 py-2 shadow-sm">
      <div className="text-xs font-medium text-emerald-800">{label}</div>
      {loading ? (
        <div className="ml-2 h-4 w-24 animate-pulse rounded bg-slate-200/70" />
      ) : s ? (
        <div className="ml-2 truncate text-sm text-slate-800">
          <span className="font-semibold">{money(s.total)}</span>
          <span className="mx-2 text-slate-400">•</span>
          <span>${num(s.hourly)} / h</span>
          <span className="mx-2 text-slate-400">•</span>
          <span>${num(s.perDown)} / d</span>
        </div>
      ) : (
        <div className="ml-2 text-sm text-slate-500">No data</div>
      )}
    </div>
  );
}
