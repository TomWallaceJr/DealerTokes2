// ============================================================================
// File: /components/ShiftForm.tsx
// Purpose: Create-shift form aligned to API (POST /api/shifts), accepts initialDate
// ============================================================================
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type NewShift = {
  date: string; // YYYY-MM-DD
  casino: string;
  hours: number; // quarter increments
  downs: number; // quarter increments
  tokesCash: number; // whole dollars
  notes?: string | null;
};

// ---- format helpers
function money(n: number, digits = 0) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: digits,
  }).format(n ?? 0);
}
function num(n: number, digits = 2) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n ?? 0);
}
function parseLocalYmd(ymd: string) {
  const [y, m, d] = ymd.split('-').map((x) => parseInt(x, 10));
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

// ---- numeric UX helpers
const ceilQuarter = (n: number) => Math.ceil(n * 4) / 4;
const parseNum = (v: string) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const cleanDecimal = (s: string) => {
  const only = s.replace(/[^\d.]/g, '');
  const [head, ...rest] = only.split('.');
  return head + (rest.length ? '.' + rest.join('').replace(/\./g, '') : '');
};
const fmtNum = (n: number) => String(parseFloat(n.toFixed(2)));

function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function ShiftForm({ initialDate }: { initialDate?: string }) {
  const router = useRouter();

  // fields
  const [date, setDate] = useState<string>(initialDate ?? todayYmd());
  const [casino, setCasino] = useState<string>('');
  const [hoursStr, setHoursStr] = useState<string>('0');
  const [downsStr, setDownsStr] = useState<string>('0');
  const [cashoutStr, setCashoutStr] = useState<string>('0'); // whole $
  const [notes, setNotes] = useState<string>('');
  const [rooms, setRooms] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // derived values
  const hours = useMemo(() => parseNum(hoursStr), [hoursStr]);
  const downs = useMemo(() => parseNum(downsStr), [downsStr]);
  const tokesCash = useMemo(() => Math.max(0, Math.ceil(parseNum(cashoutStr))), [cashoutStr]);

  const perHour = hours > 0 ? tokesCash / hours : 0;
  const perDown = downs > 0 ? tokesCash / downs : 0;

  // datalist rooms
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

  // prefill last used room (if any)
  useEffect(() => {
    try {
      const last = localStorage.getItem('lastRoom');
      if (last && !casino) setCasino(last);
    } catch {
      /* ignore */
    }
    // run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create() {
    setError(null);
    if (!casino.trim() || hours <= 0) {
      setError('Please enter a room and a positive number of hours.');
      return;
    }
    setSaving(true);
    try {
      const body: NewShift = {
        date,
        casino: casino.trim(),
        hours: ceilQuarter(hours),
        downs: Math.max(0, ceilQuarter(downs)),
        tokesCash, // whole dollars
        notes: notes ? notes : undefined,
      };

      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        let msg = 'Create failed';
        try {
          const j = JSON.parse(text);
          msg = typeof j.error === 'string' ? j.error : JSON.stringify(j.error);
        } catch {
          msg = text || msg;
        }
        throw new Error(msg);
      }

      try {
        localStorage.setItem('lastRoom', body.casino);
      } catch {}

      router.push('/');
      router.refresh();
    } catch (e: any) {
      setError(e?.message || 'Failed to create shift.');
    } finally {
      setSaving(false);
    }
  }

  function clearForm() {
    setDate(initialDate ?? todayYmd());
    setCasino('');
    setHoursStr('0');
    setDownsStr('0');
    setCashoutStr('0');
    setNotes('');
    setError(null);
  }

  // stat bubble
  const day = parseLocalYmd(date);
  const dayLabel = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(day);
  const resultsLabel = `${dayLabel} • ${casino || 'Room'}`;

  return (
    <div className="card relative space-y-4">
      {/* Header row (top-left) */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900">Log Shift</h2>
        </div>
        <span className="hidden sm:block" />
      </div>

      {/* Results bubble */}
      <div className="m-5 mb-0 rounded-2xl border border-emerald-300/70 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-sm">
        {error ? (
          <span className="text-rose-600">{error}</span>
        ) : (
          <>
            {/* Mobile */}
            <div className="flex flex-col gap-1 sm:hidden">
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-slate-600">{resultsLabel}</span>
              </div>
              <div className="flex items-center gap-3 text-[13px]">
                <span className="text-[14px] font-semibold text-slate-900">{money(tokesCash)}</span>
                <span className="text-slate-400">•</span>
                <span className="font-medium text-slate-800">${num(perHour)} / h</span>
                <span className="text-slate-400">•</span>
                <span className="font-medium text-slate-800">${num(perDown)} / d</span>
              </div>
            </div>

            {/* Desktop */}
            <div className="hidden flex-wrap items-center gap-x-4 sm:flex">
              <span className="text-slate-600">{resultsLabel}</span>
              <span className="font-semibold text-slate-900">{money(tokesCash)}</span>
              <span className="text-slate-400">•</span>
              <span className="font-medium text-slate-800">${num(perHour)} / h</span>
              <span className="text-slate-400">•</span>
              <span className="font-medium text-slate-800">${num(perDown)} / down</span>
            </div>
          </>
        )}
      </div>

      

      {/* Date + Casino */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs text-slate-600">Date</label>
          <input
            className="input h-10"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs text-slate-600">Casino / Room</label>
          <input
            list="rooms"
            className="input h-10"
            value={casino}
            onChange={(e) => setCasino(e.target.value)}
            placeholder="Wind Creek"
          />
          <datalist id="rooms">
            {rooms.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </div>
      </div>

      {/* Hours / Downs / Cashout */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="text-xs text-slate-600">Hours Worked</label>
          <input
            className="input"
            type="text"
            inputMode="decimal"
            value={hoursStr}
            onFocus={() => hoursStr === '0' && setHoursStr('')}
            onChange={(e) => setHoursStr(cleanDecimal(e.target.value))}
            onBlur={(e) => {
              const n = parseNum(e.target.value);
              if (n <= 0) setHoursStr('0');
              else setHoursStr(fmtNum(Math.max(0.25, ceilQuarter(n))));
            }}
            placeholder="0"
          />
        </div>

        <div>
          <label className="text-xs text-slate-600">Cash Downs Dealt</label>
          <input
            className="input"
            type="text"
            inputMode="decimal"
            value={downsStr}
            onFocus={() => downsStr === '0' && setDownsStr('')}
            onChange={(e) => setDownsStr(cleanDecimal(e.target.value))}
            onBlur={(e) => {
              const n = parseNum(e.target.value);
              if (n < 0) setDownsStr('0');
              else setDownsStr(fmtNum(Math.max(0, ceilQuarter(n))));
            }}
            placeholder="0"
          />
        </div>

        <div>
          <label className="text-xs text-slate-600">Cashout</label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400">
              $
            </span>
            <input
              className="input pl-6"
              type="text"
              inputMode="numeric"
              value={cashoutStr}
              onFocus={() => cashoutStr === '0' && setCashoutStr('')}
              onChange={(e) => setCashoutStr(e.target.value.replace(/[^\d]/g, ''))}
              onBlur={(e) =>
                setCashoutStr(String(Math.max(0, Math.ceil(parseNum(e.target.value)))))
              }
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs text-slate-600">Notes</label>
        <textarea
          className="textarea"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional"
        />
      </div>

      {/* Actions: Enter (left) | Clear + Cancel (right) */}
      <div className="flex items-center justify-between gap-2">
        <button className="btn btn-primary" onClick={create} disabled={saving}>
          {saving ? 'Creating…' : 'Enter'}
        </button>
        <div className="flex items-center gap-2">
          <button className="btn" type="button" onClick={clearForm} aria-label="Clear form">
            Clear
          </button>
          <button
            className="btn"
            type="button"
            onClick={() => router.push('/')}
            aria-label="Cancel and go home"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
