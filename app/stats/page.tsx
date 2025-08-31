// app/stats/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

type Summary = {
  total: number;
  hours: number;
  downs: number;
  hourly: number;
  perDown: number;
  count: number;
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

export default function StatsPage() {
  const now = new Date();
  const [year, setYear] = useState<string>('');
  const [month, setMonth] = useState<string>('');
  const [selectedDows, setSelectedDows] = useState<number[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);

  const [sum, setSum] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Build 10-year list ending this year
  const yearOpts = useMemo(() => {
    const y = now.getFullYear();
    const arr = [{ v: '', l: 'All years' }];
    for (let i = 0; i < 10; i++) arr.push({ v: String(y - i), l: String(y - i) });
    return arr;
  }, [now]);

  useEffect(() => {
    // load room suggestions (you already have /api/rooms)
    (async () => {
      try {
        const res = await fetch('/api/rooms', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.rooms)) setRooms(data.rooms);
      } catch {}
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

  useEffect(() => {
    load(); // initial load (unfiltered)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = sum?.total ?? 0;
  const hours = sum?.hours ?? 0;
  const downs = sum?.downs ?? 0;
  const hourly = sum?.hourly ?? 0;
  const perDown = sum?.perDown ?? 0;
  const money = (n: number) => n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Income Stats</h1>
        <div className="flex gap-2">
          <button className="btn" onClick={load} disabled={loading}>
            {loading ? 'Refreshing...' : 'Apply Filters'}
          </button>
          <button className="btn" onClick={reset} disabled={loading}>
            Reset
          </button>
        </div>
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

      {/* Summary tiles */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card">
          <div className="text-xs text-zinc-400">Total Tokes</div>
          <div className="text-2xl font-bold">{money(total)}</div>
        </div>
        <div className="card">
          <div className="text-xs text-zinc-400">Total Hours</div>
          <div className="text-2xl font-bold">{hours.toFixed(2)}</div>
        </div>
        <div className="card">
          <div className="text-xs text-zinc-400">Avg $/h</div>
          <div className="text-2xl font-bold">{hourly.toFixed(2)}</div>
        </div>
      </div>

      {/* Downs tiles */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card">
          <div className="text-xs text-zinc-400">Total Downs</div>
          <div className="text-2xl font-bold">{downs}</div>
        </div>
        <div className="card">
          <div className="text-xs text-zinc-400">Avg $/down</div>
          <div className="text-2xl font-bold">{perDown.toFixed(2)}</div>
        </div>
        <div className="card">
          <div className="text-xs text-zinc-400">Total Shifts</div>
          <div className="text-2xl font-bold">{sum?.count ?? 0}</div>
        </div>
      </div>

      {/* Optional: per-room breakdown */}
      {sum?.breakdowns?.byCasino && Object.keys(sum.breakdowns.byCasino).length > 0 && (
        <div className="card">
          <h2 className="mb-2 text-lg font-medium">By Room</h2>
          <div className="grid gap-2">
            {Object.entries(sum.breakdowns.byCasino).map(([room, v]) => {
              const $h = v.hours > 0 ? v.total / v.hours : 0;
              const $d = v.downs > 0 ? v.total / v.downs : 0;
              return (
                <div
                  key={room}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 text-sm"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <div className="font-medium">{room}</div>
                    <div className="text-zinc-400">
                      ${v.total} • {v.hours.toFixed(2)}h • {v.downs} downs • ${$h.toFixed(2)}/h • $
                      {$d.toFixed(2)}/down • {v.count} shifts
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
