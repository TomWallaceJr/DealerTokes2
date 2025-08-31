// app/stats/page.tsx
'use client';

import { useSession } from 'next-auth/react';
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

type Shift = {
  id: string;
  date: string; // ISO date
  casino: string;
  hours: number;
  tokesCash: number;
  downs: number;
  notes?: string | null;
};

type PageResp = {
  items: Shift[];
  total: number;
  hasMore: boolean;
  limit: number;
  offset: number;
};

const PAGE_SIZE = 20;

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

/** $1,234 (no decimals by default) */
const money = (n: number, digits = 0) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: digits,
  }).format(n);

/** 1.2K */
const compact = (n: number, digits = 1) =>
  new Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: digits,
  }).format(n);

/** 2 decimals */
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

  // Summary data
  const [sum, setSum] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // YTD data (independent of filters)
  const [ytd, setYtd] = useState<Summary | null>(null);
  const [ytdErr, setYtdErr] = useState<string | null>(null);

  // Filtered list state
  const [list, setList] = useState<Shift[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [listErr, setListErr] = useState<string | null>(null);

  // Year dropdown (last 10 years)
  const yearOpts = useMemo(() => {
    const y = now.getFullYear();
    const arr = [{ v: '', l: 'All years' }];
    for (let i = 0; i < 10; i++) arr.push({ v: String(y - i), l: String(y - i) });
    return arr;
  }, [now]);

  // Build query params shared by summary + list
  function buildParams(base?: Record<string, string>) {
    const params = new URLSearchParams(base);
    if (year) params.set('year', year);
    if (month) params.set('month', month);
    if (selectedDows.length) params.set('dow', selectedDows.join(','));
    for (const r of selectedRooms) params.append('casino', r);
    return params;
  }

  // Rooms for chips
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

  async function loadSummary() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/shifts/summary?${buildParams().toString()}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Summary = await res.json();
      setSum(data);
    } catch {
      setErr('Failed to load stats.');
    } finally {
      setLoading(false);
    }
  }

  async function loadList(resetList: boolean) {
    if (resetList) {
      setList([]);
      setOffset(0);
      setHasMore(false);
      setListErr(null);
    }
    setListLoading(true);
    try {
      const params = buildParams({
        limit: String(PAGE_SIZE),
        offset: String(resetList ? 0 : offset),
      });
      const res = await fetch(`/api/shifts?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PageResp = await res.json();
      setHasMore(data.hasMore);
      setOffset(data.offset + data.items.length);
      setList((prev) => (resetList ? data.items : [...prev, ...data.items]));
    } catch {
      setListErr('Failed to load shifts.');
    } finally {
      setListLoading(false);
    }
  }

  function applyFilters() {
    loadSummary();
    loadList(true);
  }

  // Initial load: filtered summary + list, and YTD (current year)
  useEffect(() => {
    applyFilters();
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">{who}&apos;s Income</h1>
        <div className="flex gap-2">
          <button
            className="btn btn-primary"
            onClick={applyFilters}
            disabled={loading || listLoading}
          >
            {loading || listLoading ? 'Applying…' : 'Apply Filters'}
          </button>
          <button className="btn btn-outline" onClick={reset} disabled={loading || listLoading}>
            Reset
          </button>
          <Link href="/" className="btn btn-outline">
            Home
          </Link>
        </div>
      </div>

      {/* YTD pill */}
      <div className="rounded-2xl border border-emerald-200/60 bg-white/70 p-3 text-sm shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
        {ytdErr ? (
          <span className="text-rose-600">{ytdErr}</span>
        ) : (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-slate-500">YTD {now.getFullYear()}</span>
            <span className="font-medium text-slate-900">{money(ytd?.total ?? 0)}</span>
            <span className="text-slate-400">•</span>
            <span className="font-medium text-slate-800">${num(ytd?.hourly ?? 0)} / h</span>
            <span className="text-slate-400">•</span>
            <span className="font-medium text-slate-800">${num(ytd?.perDown ?? 0)} / down</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <label className="text-xs text-slate-600">Year</label>
            <select className="input" value={year} onChange={(e) => setYear(e.target.value)}>
              {yearOpts.map((y) => (
                <option key={y.v || 'all'} value={y.v}>
                  {y.l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600">Month</label>
            <select className="input" value={month} onChange={(e) => setMonth(e.target.value)}>
              {MONTHS.map((m) => (
                <option key={m.v || 'all'} value={m.v}>
                  {m.l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600">Day(s) of Week</label>
            <div className="flex flex-wrap gap-2">
              {DOW.map((d) => (
                <button
                  key={d.v}
                  type="button"
                  onClick={() => toggleDow(d.v)}
                  className={`chip ${selectedDows.includes(d.v) ? 'chip-active' : ''}`}
                >
                  {d.l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-600">Casino / Room</label>
            <div className="flex flex-wrap gap-2">
              {rooms.length === 0 && <div className="text-xs text-slate-500">No rooms yet</div>}
              {rooms.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleRoom(r)}
                  className={`chip ${selectedRooms.includes(r) ? 'chip-active' : ''}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Errors */}
      {err && <div className="text-sm text-rose-600">{err}</div>}

      {/* KPI STRIP (cleaner: one card, 2 rows of metrics) */}
      <div className="card">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <div className="text-xs text-slate-600">Total Income</div>
            <div className="text-2xl font-bold text-slate-900">{money(total)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-600">Total Hours</div>
            <div className="text-2xl font-bold text-slate-900">{compact(hours, 2)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-600">Total Downs</div>
            <div className="text-2xl font-bold text-slate-900">{compact(downs, 1)}</div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <div className="text-xs text-slate-600">Avg $/h</div>
            <div className="text-2xl font-bold text-slate-900">{num(hourly, 2)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-600">Avg $/down</div>
            <div className="text-2xl font-bold text-slate-900">{num(perDown, 2)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-600">Total Shifts</div>
            <div className="text-2xl font-bold text-slate-900">{compact(shiftCount, 1)}</div>
          </div>
        </div>
      </div>

      {/* FILTERED SHIFTS LIST (paginated) */}
      <div className="card">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Shifts (filtered)</h2>
            <p className="mt-0.5 text-xs text-slate-600">
              Most recent first • {compact(shiftCount || 0)} total
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn" onClick={() => loadList(true)} disabled={listLoading}>
              {listLoading ? 'Refreshing…' : 'Refresh'}
            </button>
            <Link href="/" className="btn btn-outline">
              Home
            </Link>
          </div>
        </div>

        {listErr && (
          <div className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {listErr}
          </div>
        )}

        <div className="space-y-2">
          {listLoading && list.length === 0 && (
            <div className="text-sm text-slate-600">Loading…</div>
          )}

          {list.map((s) => {
            const total = s.tokesCash ?? 0;
            const perHour = s.hours > 0 ? total / s.hours : 0;
            const perDown = s.downs > 0 ? total / s.downs : 0;
            return (
              <Link key={s.id} href={`/shifts/${s.id}`} className="block" prefetch={false}>
                <div className="card transition hover:shadow-md">
                  <div className="flex flex-wrap items-start justify-between gap-2 text-sm">
                    <div>
                      <div className="font-medium text-slate-900">
                        {new Date(s.date).toLocaleDateString()} • {s.casino}
                      </div>
                      <div className="text-slate-600">
                        {num(s.hours, 2)}h, {s.downs} downs • {money(total)} total • ${num(perHour)}
                        /h • ${num(perDown)}/down
                      </div>
                    </div>
                    {s.notes ? (
                      <div className="max-w-sm text-xs text-slate-600">{s.notes}</div>
                    ) : null}
                  </div>
                </div>
              </Link>
            );
          })}

          {list.length === 0 && !listLoading && !listErr && (
            <div className="text-sm text-slate-600">No shifts matched these filters.</div>
          )}
        </div>

        {/* Bottom-right "more…" */}
        <div className="mt-3 flex justify-end">
          {hasMore && (
            <button
              onClick={() => loadList(false)}
              className="chip hover:underline disabled:opacity-50"
              disabled={listLoading}
            >
              {listLoading ? 'Loading…' : 'more…'}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
