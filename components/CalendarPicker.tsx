// ============================================================================
// File: /components/CalendarPicker.tsx
// Purpose: Robust calendar that tolerates both PageResp and raw array API shapes
// - Fetches /api/shifts?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=1000
// - Aggregates tokesCash by local YYYY-MM-DD without Date parsing
// - Falls back gracefully if API returns an array instead of {items: []}
// ============================================================================
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Hideable from './Hideable';

type Shift = { id: string; date: string; tokesCash: number };

type PageResp = {
  items: Shift[];
  total: number;
  hasMore: boolean;
  limit: number;
  offset: number;
};

export type CalendarPickerProps = {
  /** Optional initial month; defaults to today */
  initialMonth?: Date | string;
  /** Optional hook when user picks a date (YYYY-MM-DD, local) */
  onPick?: (isoYmd: string) => void;
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const money = (n: number) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function ymdLocal(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function endOfMonthExclusive(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
}
function mondayOf(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay();
  const delta = (day + 6) % 7; // Monday=0
  x.setDate(x.getDate() - delta);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function normalizeItems(json: any): Shift[] {
  // Expected: { items: [{ id, date, tokesCash }], ... }
  if (json && Array.isArray(json.items)) {
    return json.items.map((s: any) => ({
      id: String(s.id),
      date: String(s.date).slice(0, 10),
      tokesCash: Number(s.tokesCash ?? 0),
    }));
  }
  // Fallback: API returned array of rows
  if (Array.isArray(json)) {
    return json.map((s: any) => ({
      id: String(s.id),
      date: String(s.date).slice(0, 10),
      tokesCash: Number(s.tokesCash ?? 0),
    }));
  }
  return [];
}

export default function CalendarPicker({ initialMonth, onPick }: CalendarPickerProps) {
  const router = useRouter();

  const today = useMemo(() => new Date(), []);
  const initial =
    typeof initialMonth === 'string'
      ? new Date(initialMonth)
      : initialMonth instanceof Date
        ? initialMonth
        : today;

  const [cursor, setCursor] = useState<Date>(startOfMonth(initial));
  const monthLabel = cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  // Day aggregates by YYYY-MM-DD (no Date parsing to avoid TZ drift)
  const [cashByDay, setCashByDay] = useState<Record<string, number>>({});
  const [shiftsByDay, setShiftsByDay] = useState<Record<string, Shift[]>>({});
  const [loading, setLoading] = useState(false);

  // 6-row grid (Mon–Sun)
  const gridStart = useMemo(() => mondayOf(startOfMonth(cursor)), [cursor]);
  const gridDays = useMemo(
    () => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)),
    [gridStart],
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const from = ymdLocal(startOfMonth(cursor));
        const to = ymdLocal(endOfMonthExclusive(cursor));
        const url = `/api/shifts?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&limit=1000`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json();
        const items = normalizeItems(raw);

        const cash: Record<string, number> = {};
        const byDay: Record<string, Shift[]> = {};
        for (const s of items) {
          const k = (s.date || '').slice(0, 10);
          if (!k) continue;
          cash[k] = (cash[k] ?? 0) + (s.tokesCash ?? 0);
          (byDay[k] ||= []).push(s);
        }

        setCashByDay(cash);
        setShiftsByDay(byDay);
      } catch {
        setCashByDay({});
        setShiftsByDay({});
      } finally {
        setLoading(false);
      }
    })();
  }, [cursor]);

  const isToday = (d: Date) =>
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  const inCurrentMonth = (d: Date) =>
    d.getMonth() === cursor.getMonth() && d.getFullYear() === cursor.getFullYear();

  function handlePick(key: string) {
    onPick?.(key);
    const list = shiftsByDay[key] || [];
    if (list.length === 0) router.push(`/shifts/new?date=${encodeURIComponent(key)}`);
    else router.push(`/shifts/${list[0].id}`);
  }

  return (
    <div className="card">
      <Hideable id="home-calendar" hiddenLabel="Calendar hidden">
        <>
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <div className="text-base font-semibold text-slate-900 sm:text-lg">{monthLabel}</div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                className="btn btn-ghost h-8 w-8 p-0 sm:h-9 sm:w-9"
                title="Previous month"
                aria-label="Previous month"
                onClick={() =>
                  setCursor(startOfMonth(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1)))
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                className="btn h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
                title="Jump to current month"
                aria-label="Current month"
                onClick={() => setCursor(startOfMonth(new Date()))}
              >
                Today
              </button>
              <button
                type="button"
                className="btn btn-ghost h-8 w-8 p-0 sm:h-9 sm:w-9"
                title="Next month"
                aria-label="Next month"
                onClick={() =>
                  setCursor(startOfMonth(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)))
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Weekdays */}
          <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-medium text-slate-500 sm:text-[11px]">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2">
            {gridDays.map((d) => {
              const key = ymdLocal(d);
              const cash = cashByDay[key] ?? 0;
              const hasData = cash > 0;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handlePick(key)}
                  aria-label={`${key}${hasData ? `, ${money(cash)}` : ''}`}
                  className={[
                    'relative rounded-xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur transition',
                    'hover:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none',
                    isToday(d) ? 'ring-2 ring-emerald-500' : '',
                    inCurrentMonth(d) ? '' : 'opacity-60',
                  ].join(' ')}
                >
                  <div className="aspect-square p-1.5 sm:p-2 md:p-2.5">
                    <div className="absolute top-1 left-1 text-[10px] font-medium text-slate-500 sm:top-1.5 sm:left-1.5 sm:text-[11px] md:top-2 md:left-2 md:text-[12px]">
                      {d.getDate()}
                    </div>
                    {hasData ? (
                      <>
                        <div className="absolute inset-x-1 bottom-1 flex items-end justify-center sm:hidden">
                          <span className="text-[9.5px] font-semibold text-emerald-800">
                            {money(cash)}
                          </span>
                        </div>
                        <div className="absolute inset-0 hidden items-center justify-center sm:flex">
                          <span className="rounded-md bg-emerald-50 px-2 py-[2px] text-[12px] font-semibold text-emerald-900 ring-1 ring-emerald-200 md:text-sm">
                            {money(cash)}
                          </span>
                        </div>
                      </>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          {loading && (
            <div
              className="mt-2 text-center text-xs text-slate-500"
              role="status"
              aria-live="polite"
            >
              Loading…
            </div>
          )}
        </>
      </Hideable>
    </div>
  );
}
