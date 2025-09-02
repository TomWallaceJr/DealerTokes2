// ============================================================================
// File: /app/stats/page.tsx
// Purpose: Use shared bubble + ensure list matches filters via API
// ============================================================================
'use client';

import BackButton from '@/components/BackButton';
import StatsResultsBubble from '@/components/StatsResultsBubble';
import { dateUTC } from '@/lib/date';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

// ---- types
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
  date: string;
  casino: string;
  hours: number;
  tokesCash: number;
  downs: number;
  notes?: string | null;
};
type PageResp = { items: Shift[]; total: number; hasMore: boolean; limit: number; offset: number };
type QuickKey = 'all' | 'ytd' | 'curMonth' | 'lastMonth' | 'curWeek' | 'lastWeek';

const PAGE_SIZE = 8;

// ---- constants
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
const dowOrder = [1, 2, 3, 4, 5, 6, 0] as const;
const dowMap: Record<number, string> = Object.fromEntries(DOW.map((d) => [d.v, d.l]));

// ---- formatters
const money = (n: number, digits = 0) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: digits,
  }).format(n);
const compact = (n: number, digits = 1) =>
  new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: digits }).format(
    n,
  );
const num = (n: number, digits = 2) =>
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);

// ---- date helpers (local Monday weeks)
function pad(n: number) {
  return String(n).padStart(2, '0');
}
function ymdLocal(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function mondayOf(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const delta = (day + 6) % 7;
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
function lastMondayOf(date: Date) {
  const mon = mondayOf(date);
  const prev = new Date(mon);
  prev.setDate(mon.getDate() - 7);
  return prev;
}
function fmtRangeShort(a: Date, b: Date) {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const sameYear = a.getFullYear() === b.getFullYear();
  const left = a.toLocaleDateString(undefined, opts);
  const right = b.toLocaleDateString(undefined, sameYear ? opts : { ...opts, year: 'numeric' });
  return `${left}–${right}`;
}
function monthLabel(mv: string) {
  return MONTHS.find((m) => m.v === mv)?.l ?? mv;
}

function prettySpecificLabel({
  weekDate,
  selectedDows,
  month,
  year,
}: {
  weekDate: string;
  selectedDows: number[];
  month: string;
  year: string;
}) {
  if (weekDate) {
    const picked = new Date(weekDate);
    const mon = mondayOf(picked);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return `Week of (Mon–Sun) ${fmtRangeShort(mon, sun)}`;
  }
  const bits: string[] = [];
  if (selectedDows.length) {
    const names = dowOrder.filter((d) => selectedDows.includes(d)).map((d) => dowMap[d]);
    if (names.length) bits.push(names.join(', '));
  }
  if (month) bits.push(monthLabel(month));
  if (year) bits.push(year);
  return bits.length ? bits.join(' • ') : 'All';
}

export default function StatsPage() {
  const now = new Date();

  // Specific filters (main)
  const [year, setYear] = useState<string>('');
  const [month, setMonth] = useState<string>('');
  const [selectedDows, setSelectedDows] = useState<number[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [weekDate, setWeekDate] = useState<string>('');

  // Summary + list state
  const [sum, setSum] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [list, setList] = useState<Shift[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [listErr, setListErr] = useState<string | null>(null);
  const [listBaseParams, setListBaseParams] = useState<string>('');
  const [applied, setApplied] = useState(false);

  // Quick filters
  const [quick, setQuick] = useState<QuickKey>('ytd');
  const [quickSum, setQuickSum] = useState<Summary | null>(null);
  const [quickErr, setQuickErr] = useState<string | null>(null);
  const [quickLoading, setQuickLoading] = useState(false);

  const yearOpts = useMemo(() => {
    const y = now.getFullYear();
    const arr = [{ v: '', l: 'All years' }];
    for (let i = 0; i < 10; i++) arr.push({ v: String(y - i), l: String(y - i) });
    return arr;
  }, [now]);

  function buildParams(base?: Record<string, string>) {
    const params = new URLSearchParams(base);
    if (weekDate) {
      const picked = new Date(weekDate);
      const from = mondayOf(picked);
      const to = nextMondayOf(picked);
      params.set('from', ymdLocal(from));
      params.set('to', ymdLocal(to));
    } else {
      if (year) params.set('year', year);
      if (month) params.set('month', month);
    }
    if (selectedDows.length) params.set('dow', selectedDows.join(','));
    for (const r of selectedRooms) params.append('casino', r);
    return params;
  }

  function buildQuickParams(k: QuickKey) {
    const params = new URLSearchParams();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    if (k === 'all') {
      /* none */
    } else if (k === 'ytd') {
      params.set('year', String(y));
    } else if (k === 'curMonth') {
      params.set('year', String(y));
      params.set('month', String(m));
    } else if (k === 'lastMonth') {
      const lm = m === 1 ? 12 : m - 1;
      const ly = m === 1 ? y - 1 : y;
      params.set('year', String(ly));
      params.set('month', String(lm));
    } else if (k === 'curWeek') {
      const from = mondayOf(now);
      const to = nextMondayOf(now);
      params.set('from', ymdLocal(from));
      params.set('to', ymdLocal(to));
    } else if (k === 'lastWeek') {
      const from = lastMondayOf(now);
      const to = mondayOf(now);
      params.set('from', ymdLocal(from));
      params.set('to', ymdLocal(to));
    }
    return params;
  }

  // Rooms list
  useEffect(() => {
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
    setWeekDate('');
    setSelectedDows([]);
    setSelectedRooms([]);
    setApplied(false);
  }

  async function loadSummary(paramsStr?: string) {
    setLoading(true);
    setErr(null);
    try {
      const qs = paramsStr ?? buildParams().toString();
      const res = await fetch(`/api/shifts/summary${qs ? `?${qs}` : ''}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Summary = await res.json();
      setSum(data);
    } catch {
      setErr('Failed to load stats.');
    } finally {
      setLoading(false);
    }
  }

  async function loadList(resetList: boolean, baseParamsStr?: string) {
    const base = baseParamsStr ?? (listBaseParams || buildParams().toString());
    if (resetList) {
      setList([]);
      setOffset(0);
      setHasMore(false);
      setListErr(null);
      setListBaseParams(base);
    }
    setListLoading(true);
    try {
      const params = new URLSearchParams(base);
      params.set('limit', String(PAGE_SIZE));
      params.set('offset', String(resetList ? 0 : offset));
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
    setApplied(true);
    const base = buildParams().toString();
    loadSummary(base);
    loadList(true, base);
  }

  async function loadQuick(k: QuickKey) {
    setQuick(k);
    setQuickLoading(true);
    setQuickErr(null);
    setApplied(false);
    try {
      const q = buildQuickParams(k).toString();
      const res = await fetch(`/api/shifts/summary${q ? `?${q}` : ''}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Summary = await res.json();
      setQuickSum(data);
      await loadList(true, q);
    } catch {
      setQuickErr('Failed to load quick stats.');
    } finally {
      setQuickLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      await loadSummary();
      await loadList(true, buildParams().toString());
      await loadQuick('ytd');
    })();
  }, []);

  const total = sum?.total ?? 0;
  const hours = sum?.hours ?? 0;
  const downs = sum?.downs ?? 0;
  const hourly = sum?.hourly ?? 0;
  const perDown = sum?.perDown ?? 0;
  const shiftCount = sum?.count ?? 0;
  const filterLabel = prettySpecificLabel({ weekDate, selectedDows, month, year });
  const QUICK_LABEL: Record<QuickKey, string> = {
    all: 'Lifetime',
    ytd: 'Year to Date',
    curMonth: 'Current Month',
    lastMonth: 'Last Month',
    curWeek: 'Current Week',
    lastWeek: 'Last Week',
  };
  const listTitle = `${applied ? filterLabel : QUICK_LABEL[quick]} Shifts`;

  return (
    <main className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Detailed Income Analysis</h1>
        <p className="mt-1 text-sm text-slate-600">
          Track your income performance and drill into recent shifts.
        </p>
      </div>

      {/* Quick Filters */}
      <div className="card">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-sm font-medium text-slate-900">Quick Filters</div>
          <BackButton />
        </div>

        <div className="flex flex-wrap gap-2">
          {(['all', 'ytd', 'curMonth', 'lastMonth', 'curWeek', 'lastWeek'] as QuickKey[]).map(
            (k) => {
              const active = quick === k;
              return (
                <button
                  key={k}
                  type="button"
                  className={`chip ${active ? 'chip-active' : ''}`}
                  onClick={() => loadQuick(k)}
                  aria-pressed={active}
                >
                  {QUICK_LABEL[k]}
                </button>
              );
            },
          )}
        </div>

        {/* Quick bubble */}
        <StatsResultsBubble
          label={QUICK_LABEL[quick]}
          total={quickSum?.total}
          hourly={quickSum?.hourly}
          perDown={quickSum?.perDown}
          count={quickSum?.count}
          loading={quickLoading}
          error={quickErr}
          showCount
        />
      </div>

      {/* Specific Filters */}
      <div className="card">
        <div className="mb-3">
          <div className="text-sm font-medium text-slate-900">Specific Filters</div>
          <div className="text-xs text-slate-500">
            Pick a week (Mon–Sun) or use Year/Month. Day-of-week & room chips refine results.
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-6">
          <div className="sm:col-span-2">
            <label className="text-xs text-slate-600">Week of (Mon–Sun)</label>
            <input
              type="date"
              className="input h-10"
              value={weekDate}
              onChange={(e) => setWeekDate(e.target.value)}
              title="Pick any date in the week you want"
            />
            <div className="mt-1 text-[11px] text-slate-500">
              Choosing a week disables Year/Month below.
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs text-slate-600">Year</label>
            <select
              className="input h-10"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              disabled={!!weekDate}
              aria-disabled={!!weekDate}
            >
              {yearOpts.map((y) => (
                <option key={y.v || 'all'} value={y.v}>
                  {y.l}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs text-slate-600">Month</label>
            <select
              className="input h-10"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              disabled={!!weekDate}
              aria-disabled={!!weekDate}
            >
              {MONTHS.map((m) => (
                <option key={m.v || 'all'} value={m.v}>
                  {m.l}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-6">
            <label className="text-xs text-slate-600">Day(s) of Week</label>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by day of week">
              {DOW.map((d) => {
                const active = selectedDows.includes(d.v);
                return (
                  <button
                    key={d.v}
                    type="button"
                    onClick={() => toggleDow(d.v)}
                    className={`chip ${active ? 'chip-active' : ''}`}
                    aria-pressed={active}
                  >
                    {d.l}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="my-4 h-px w-full bg-slate-200/70" />

        <div>
          <label className="text-xs text-slate-600">Casino / Room</label>
          <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
            {rooms.length === 0 && <div className="text-xs text-slate-500">No rooms yet</div>}
            {rooms.map((r) => {
              const active = selectedRooms.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleRoom(r)}
                  className={`chip ${active ? 'chip-active' : ''}`}
                  aria-pressed={active}
                  title={r}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
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
          </div>
          <div className="text-[11px] text-slate-500">
            Filtered by: {prettySpecificLabel({ weekDate, selectedDows, month, year })}
          </div>
        </div>

        {/* Specific results bubble using the SAME component/style as Quick */}
        {applied && (
          <StatsResultsBubble
            label={prettySpecificLabel({ weekDate, selectedDows, month, year })}
            total={total}
            hourly={hourly}
            perDown={perDown}
            count={shiftCount}
            loading={loading}
            error={err}
            showCount
          />
        )}
      </div>

      {/* FILTERED SHIFTS LIST (paginated) */}
      <div className="card">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{`${applied ? prettySpecificLabel({ weekDate, selectedDows, month, year }) : QUICK_LABEL[quick]} Shifts`}</h2>
            <p className="mt-0.5 text-xs text-slate-600">
              Most recent first • {compact(sum?.count || 0)} total
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn" onClick={() => loadList(true)} disabled={listLoading}>
              {listLoading ? 'Refreshing…' : 'Refresh'}
            </button>
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
                        {dateUTC(s.date)} • {s.casino}
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
