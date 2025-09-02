// components/EditShiftForm.tsx
'use client';

import BackButton from '@/components/BackButton';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type ShiftForEdit = {
  id: string;
  date: string; // "YYYY-MM-DD"
  casino: string;
  hours: number; // quarter increments
  downs: number;
  tokesCash: number; // whole dollars
  notes: string;
};

// ---------- format helpers ----------
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
function compact(n: number, digits = 1) {
  return new Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: digits,
  }).format(n ?? 0);
}
function parseLocalYmd(ymd: string) {
  const [y, m, d] = ymd.split('-').map((x) => parseInt(x, 10));
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

// ---------- numeric UX helpers (match ShiftForm) ----------
const ceilQuarter = (n: number) => Math.ceil(n * 4) / 4;
const parseNum = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const cleanDecimal = (s: string) => {
  const only = s.replace(/[^\d.]/g, '');
  const [head, ...rest] = only.split('.');
  return head + (rest.length ? '.' + rest.join('').replace(/\./g, '') : '');
};
const fmtNum = (n: number) => String(parseFloat(n.toFixed(2)));

export default function EditShiftForm({ shift }: { shift: ShiftForEdit }) {
  const router = useRouter();

  // fields
  const [date, setDate] = useState(shift.date);
  const [casino, setCasino] = useState(shift.casino);

  // display strings (no number spinner)
  const [hoursStr, setHoursStr] = useState<string>(fmtNum(Number(shift.hours ?? 0)));
  const [downsStr, setDownsStr] = useState<string>(fmtNum(Number(shift.downs ?? 0)));
  const [cashoutStr, setCashoutStr] = useState<string>(String(shift.tokesCash ?? 0)); // whole $

  const [notes, setNotes] = useState<string>(shift.notes ?? '');
  const [rooms, setRooms] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // numeric values for KPIs/payload
  const hours = useMemo(() => parseNum(hoursStr), [hoursStr]);
  const downs = useMemo(() => parseNum(downsStr), [downsStr]);
  const tokesCash = useMemo(() => Math.max(0, Math.ceil(parseNum(cashoutStr))), [cashoutStr]);

  const perHour = hours > 0 ? tokesCash / hours : 0;
  const perDown = downs > 0 ? tokesCash / downs : 0;

  // rooms for datalist
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

  async function save() {
    setError(null);
    if (!casino.trim() || hours <= 0) {
      setError('Please enter a room and a positive number of hours.');
      return;
    }
    setSaving(true);
    try {
      const body = {
        date,
        casino: casino.trim(),
        hours: ceilQuarter(hours),
        downs: Math.max(0, ceilQuarter(downs)),
        tokesCash, // whole dollars
        notes: notes || undefined,
      };

      const res = await fetch(`/api/shifts/${shift.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        let msg = 'Update failed';
        try {
          const j = await res.json();
          if (j?.error) msg = typeof j.error === 'string' ? j.error : JSON.stringify(j.error);
        } catch {}
        throw new Error(msg);
      }

      // remember last room
      try {
        localStorage.setItem('lastRoom', body.casino);
      } catch {}

      router.push('/shifts');
      router.refresh();
    } catch (e: any) {
      setError(e?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm('Delete this shift? This cannot be undone.')) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/shifts/${shift.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      router.push('/shifts');
      router.refresh();
    } catch (e: any) {
      setError(e?.message || 'Failed to delete.');
    } finally {
      setDeleting(false);
    }
  }

  // ---- Results bubble content ----
  const day = parseLocalYmd(date);
  const dayLabel = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(day);

  const resultsLabel = `${dayLabel} • ${casino || 'Room'}`;
  const total = tokesCash;
  const hourly = perHour;
  const pDown = perDown;
  const shiftCount = 1; // editing a single shift

  return (
    <div className="card relative space-y-4">
      {/* Back — restored to upper-right, with breathing room */}
      <BackButton
        className="absolute top-3 right-3 z-10 h-9 w-9 justify-center gap-0 px-0 sm:top-4 sm:right-4 sm:h-auto sm:w-auto sm:gap-2 sm:px-3.5"
        title="Back"
        aria-label="Go back"
      />

      {/* Results bubble (refined) */}
      <div className="m-5 mt-11 rounded-2xl border border-emerald-300/70 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-sm">
        {error ? (
          <span className="text-rose-600">{error}</span>
        ) : (
          <>
            {/* Mobile: two rows, compact without shift count */}
            <div className="flex flex-col gap-1 sm:hidden">
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-slate-600">{resultsLabel}</span>
                <span className="text-slate-400">•</span>
                <span className="text-[15px] font-semibold text-slate-900">{money(total)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium text-slate-800">${num(hourly)} / h</span>
                <span className="text-slate-400">•</span>
                <span className="font-medium text-slate-800">${num(pDown)} / down</span>
              </div>
            </div>

            {/* Desktop: one clean line with separators + shift count */}
            <div className="hidden flex-wrap items-center gap-x-4 sm:flex">
              <span className="text-slate-600">{resultsLabel}</span>
              <span className="font-semibold text-slate-900">{money(total)}</span>
              <span className="text-slate-400">•</span>
              <span className="font-medium text-slate-800">${num(hourly)} / h</span>
              <span className="text-slate-400">•</span>
              <span className="font-medium text-slate-800">${num(pDown)} / down</span>
            </div>
          </>
        )}
      </div>

      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900">Edit Shift</h2>
          <p className="mt-0.5 text-xs text-slate-600">
            Update hours, downs, and cashout. Changes apply immediately.
          </p>
        </div>
        {/* (BackButton is already positioned absolutely) */}
        <span className="hidden sm:block" />
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

      {/* Footer: KPIs + actions */}
      <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="text-slate-600">
          Total: {money(tokesCash, 0)} • $/h: {num(perHour)} • $/down: {num(perDown)}
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto">
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => router.push('/shifts')}
              disabled={saving || deleting}
            >
              Cancel
            </button>
            <button className="btn btn-danger" onClick={remove} disabled={deleting || saving}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>

          {error && <div className="text-xs text-rose-600">{error}</div>}
        </div>
      </div>
    </div>
  );
}
