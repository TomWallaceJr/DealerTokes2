// components/CalendarPicker.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function ymdLocal(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfWeek(d: Date) {
  // week starts Sunday
  const day = d.getDay(); // 0..6
  const out = new Date(d);
  out.setDate(d.getDate() - day);
  return out;
}
function addDays(d: Date, n: number) {
  const out = new Date(d);
  out.setDate(d.getDate() + n);
  return out;
}
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPicker() {
  const router = useRouter();
  const today = new Date();
  const [cursor, setCursor] = useState<Date>(startOfMonth(today)); // first of shown month

  const grid = useMemo(() => {
    // 6 weeks = 42 days
    const first = startOfMonth(cursor);
    const begin = startOfWeek(first);
    return Array.from({ length: 42 }, (_, i) => addDays(begin, i));
  }, [cursor]);

  function goPrevMonth() {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  }
  function goNextMonth() {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
  }
  function goThisMonth() {
    setCursor(startOfMonth(new Date()));
  }

  function onPick(d: Date) {
    const date = ymdLocal(d);
    router.push(`/shifts/date/${date}`);
  }

  const monthLabel = cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  const curMonth = cursor.getMonth();

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-lg font-semibold text-slate-900">{monthLabel}</div>
        <div className="flex gap-2">
          <button className="chip" onClick={goPrevMonth} aria-label="Previous month">
            ‹
          </button>
          <button className="chip" onClick={goThisMonth}>
            Today
          </button>
          <button className="chip" onClick={goNextMonth} aria-label="Next month">
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-600">
        {DOW.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {grid.map((d) => {
          const inMonth = d.getMonth() === curMonth;
          const isToday =
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate();

          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => onPick(d)}
              className={[
                'h-10 rounded-lg border text-sm transition',
                'hover:bg-slate-50 active:bg-slate-100',
                inMonth
                  ? 'border-slate-200 bg-white text-slate-900'
                  : 'border-slate-200 bg-slate-50 text-slate-400',
                isToday ? 'ring-2 ring-emerald-500' : '',
              ].join(' ')}
              title="Log or edit shift for this day"
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-slate-600">
        Click a date to log a new shift or edit an existing one.
      </p>
    </div>
  );
}
