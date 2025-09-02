// app/(home)/HomeHeader.tsx
'use client';

import Hideable from '@/components/Hideable';
import Link from 'next/link';
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

export default function HomeHeader({ userName }: { userName?: string | null }) {
  const now = useMemo(() => new Date(), []);
  const firstName = (userName ?? '').split(/\s+/)[0] || 'there';

  const [week, setWeek] = useState<Summary | null>(null);
  const [month, setMonth] = useState<Summary | null>(null);
  const [ytd, setYtd] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

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
    <section className="card hidden sm:block">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-0.5 text-xs text-slate-600">{dayStr}</p>
        </div>
        <Link href="/shifts/new" className="btn btn-primary shrink-0">
          Log a Shift
        </Link>
      </div>

      {/* Snapshot pills — hideable ONLY for this block */}
      <Hideable id="header-snapshot" className="mt-3" hiddenLabel="Snapshot hidden">
        <div className="grid gap-2 sm:grid-cols-3">
          <Snapshot label="This Week" loading={loading} s={week} />
          <Snapshot label="This Month" loading={loading} s={month} />
          <Snapshot label="YTD" loading={loading} s={ytd} />
        </div>
      </Hideable>
    </section>
  );
}

function Snapshot({ label, loading, s }: { label: string; loading: boolean; s: Summary | null }) {
  return (
    <div className="rounded-xl border border-emerald-200/60 bg-white/70 p-3 shadow-sm">
      <div className="text-xs text-slate-600">{label}</div>
      {loading ? (
        <div className="mt-1 h-6 w-28 animate-pulse rounded bg-slate-200/60" />
      ) : s ? (
        <div className="mt-0.5 text-sm">
          <div className="font-medium text-slate-900">{money(s.total)}</div>
          <div className="text-slate-600">
            ${num(s.hourly)} / h • ${num(s.perDown)} / down
          </div>
        </div>
      ) : (
        <div className="mt-0.5 text-sm text-slate-500">No data</div>
      )}
    </div>
  );
}
