// app/stats/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';

type Summary = {
  total: number; // sum tokesCash
  hours: number; // sum hours
  downs: number; // sum downs
  hourly: number; // total / hours
  perDown: number; // total / downs
  count: number; // # of shifts
  breakdowns?: {
    byCasino?: Record<string, { total: number; hours: number; downs: number; count: number }>;
  };
};

const MONTHS = [
  { v: '', l: 'All months' },
  { v: '1', l: 'January' },
  { v: '2', l: 'February' },
  { v: '3', l: 'March' },
  { v: '4', l: 'April' },
  { v: '5', l: 'May' },
  { v: '6', l: 'June' },
  { v: '7', l: 'July' },
  { v: '8', l: 'August' },
  { v: '9', l: 'September' },
  { v: '10', l: 'October' },
  { v: '11', l: 'November' },
  { v: '12', l: 'December' },
];

const DOW = [
  { v: 1, l: 'Mon' },
  { v: 2, l: 'Tue' },
  { v: 3, l: 'Wed' },
  { v: 4, l: 'Thu' },
  { v: 5, l: 'Fri' },
  { v: 6, l: 'Sat' },
  { v: 0, l: 'Sun' },
];

/** $1,234.56 */
const money = (n: number, digits = 0) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: digits,
  }).format(n);

/** 1.2K / 3.4M */
const compact = (n: number, digits = 1) =>
  new Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: digits,
  }).format(n);

/** 2 decimal places */
const num = (n: number, digits = 2) =>
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);

function displayName(name?: string | null, email?: string | null) {
  const n = (name ?? '').trim();
  if (n) return n.split(/\s+/)[0];
  if (email) return email.split('@')[0];
  return 'there';
}

export default function StatsPage() {
  const now = new Date();
  const { data: session } = useSession();
  const who = displayName(session?.user?.name, session?.user?.email);

  // Filters
  const [year, setYear] = useState<string>('');
  const [month, setMonth] = useState<string>('');
  const [selectedDows, setSelectedDows] = useState<number[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);

  // Data state (filtered)
  const [sum, setSum] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // YTD state (independent of filters)
  const [ytd, setYtd] = useState<Summary | null>(null);
  const [ytdErr, setYtdErr] = useState<string | null>(null);

  // Year dropdown (last 10 years)
  const yearOpts = useMemo(() => {
    const y = now.getFullYear();
    const arr = [{ v: '', l: 'All years' }];
    for (let i = 0; i < 10; i++) arr.push({ v: String(y - i), l: String(y - i) });
    return arr;
  }, [now]);

  // Load room suggestions
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/rooms', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.rooms)) setRooms(data.rooms);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  function toggleDow(v: number) {
    setSelectedDows((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  }
  function toggleRoom(r: string) {
    setSelectedRooms((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  }
  function reset() {
    setYear('');
    setMonth('');
    setSelectedDows([]);
    setSelectedRooms([]);
  }

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams();
      if (year) params.set('year', year);
      if (month) params.set('month', month);
      if (selectedDows.length) params.set('dow', selectedDows.join(','));
      for (const r of selectedRooms) params.append('casino', r);

      const res = await fetch(`/api/shifts/summary?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Summary = await res.json();
      setSum(data);
    } catch {
      setErr('Failed to load stats.');
    } finally {
      setLoading(false);
    }
  }

  // Load filtered and YTD on mount
  useEffect(() => {
    load();
    (async () => {
      try {
        const cy = String(now.getFullYear());
        const res = await fetch(`/api/shifts/summary?year=${encodeURIComponent(cy)}`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Summary = await res.json();
        setYtd(data);
      } catch {
        setYtdErr('Failed to load YTD.');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = sum?.total ?? 0;
  const hours = sum?.hours ?? 0;
  const downs = sum?.downs ?? 0;
  const hourly = sum?.hourly ?? 0;
  const perDown = sum?.perDown ?? 0;
  const shiftCount = sum?.count ?? 0;

  return (
    <main className="space-y-4">
      {/* Header with name */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{who}&apos;s Income</h1>
        <div className="flex gap-2">
          <button className="btn" onClick={load} disabled={loading}>
            {loading ? 'Refreshing...' : 'Apply Filters'}
          </button>
          <button className="btn" onClick={reset} disabled={loading}>
            Reset
          </button>
        </div>
      </div>

      {/* YTD line */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 text-sm">
        {ytdErr ? (
          <span className="text-red-400">{ytdErr}</span>
        ) : (
          <>
            <span className="mr-2 text-zinc-400">YTD ({now.getFullYear()}):</span>
            <span className="mr-3 font-medium">{money(ytd?.total ?? 0)}</span>
            <span className="text-zinc-400">•</span>
            <span className="mx-3 font-medium">${num(ytd?.hourly ?? 0)} / h</span>
            <span className="text-zinc-400">•</span>
            <span className="ml-3 font-medium">${num(ytd?.perDown ?? 0)} / down</span>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <label className="text-xs text-slate-400">Year</label>
            <select className="input" value={year} onChange={(e) => setYear(e.target.value)}>
              {yearOpts.map((y) => (
                <option key={y.v || 'all'} value={y.v}>
                  {y.l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400">Month</label>
            <select className="input" value={month} onChange={(e) => setMonth(e.target.value)}>
              {MONTHS.map((m) => (
                <option key={m.v || 'all'} value={m.v}>
                  {m.l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400">Day(s) of Week</label>
            <div className="flex flex-wrap gap-2">
              {DOW.map((d) => (
                <button
                  key={d.v}
                  type="button"
                  onClick={() => toggleDow(d.v)}
                  className={
                    'rounded border px-2 py-1 text-sm ' +
                    (selectedDows.includes(d.v)
                      ? 'border-indigo-500 bg-indigo-500/20'
                      : 'border-slate-600 hover:bg-slate-800/50')
                  }
                >
                  {d.l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400">Casino / Room</label>
            <div className="flex flex-wrap gap-2">
              {rooms.length === 0 && <div className="text-xs text-slate-500">No rooms yet</div>}
              {rooms.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleRoom(r)}
                  className={
                    'rounded border px-2 py-1 text-sm ' +
                    (selectedRooms.includes(r)
                      ? 'border-indigo-500 bg-indigo-500/20'
                      : 'border-slate-600 hover:bg-slate-800/50')
                  }
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {err && <div className="text-sm text-red-400">{err}</div>}
      {loading && !sum && <div className="text-sm text-zinc-400">Loading…</div>}

      {/* Summary tiles (filtered) */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card">
          <div className="text-xs text-zinc-400">Total Tokes</div>
          <div className="text-2xl font-bold">{money(total)}</div>
        </div>
        <div className="card">
          <div className="text-xs text-zinc-400">Total Hours</div>
          <div className="text-2xl font-bold">{compact(hours, 2)}</div>
        </div>
        <div className="card">
          <div className="text-xs text-zinc-400">Avg $/h</div>
          <div className="text-2xl font-bold">{num(hourly, 2)}</div>
        </div>
      </div>

      {/* Downs tiles */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card">
          <div className="text-xs text-zinc-400">Total Downs</div>
          <div className="text-2xl font-bold">{compact(downs, 1)}</div>
        </div>
        <div className="card">
          <div className="text-xs text-zinc-400">Avg $/down</div>
          <div className="text-2xl font-bold">{num(perDown, 2)}</div>
        </div>
        <div className="card">
          <div className="text-xs text-zinc-400">Total Shifts</div>
          <div className="text-2xl font-bold">{compact(sum?.count ?? 0, 1)}</div>
        </div>
      </div>

      {/* Optional: per-room breakdown (filtered) */}
      {sum?.breakdowns?.byCasino && Object.keys(sum.breakdowns.byCasino).length > 0 && (
        <div className="card">
          <h2 className="mb-2 text-lg font-medium">By Room</h2>
          <div className="grid gap-2">
            {Object.entries(sum.breakdowns.byCasino).map(([room, v]) => {
              const perH = v.hours > 0 ? v.total / v.hours : 0;
              const perD = v.downs > 0 ? v.total / v.downs : 0;
              return (
                <div
                  key={room}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 text-sm"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <div className="font-medium">{room}</div>
                    <div className="text-zinc-400">
                      {money(v.total)} • {compact(v.hours, 2)}h • {compact(v.downs)} downs • $
                      {num(perH, 2)}/h • ${num(perD, 2)}/down • {compact(v.count)} shifts
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
