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
    <div className="card relative mt-3 space-y-4 sm:mt-0">
      {/* Header row (at top) */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900">Edit Shift</h2>
          <p className="mt-0.5 text-xs text-slate-600">Changes apply immediately.</p>
        </div>
        {/* Right-side: on mobile show delete icon; on desktop show Back */}
        <div className="shrink-0">
          {/* Mobile: small delete icon in header */}
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-rose-600 ring-1 ring-rose-200/70 transition hover:bg-rose-50 focus:ring-2 focus:ring-rose-500 focus:outline-none sm:hidden"
            title="Delete"
            aria-label="Delete shift"
            onClick={remove}
            disabled={deleting || saving}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 6h18" />
              <path d="M8 6v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>

          {/* Desktop: Back button on same line, right aligned */}
          <div className="hidden sm:block">
            <BackButton title="Back" aria-label="Go back" />
          </div>
        </div>
      </div>

      {/* Results bubble — 4-line, consistent layout */}
      <div className="m-3 mt-0 rounded-2xl border border-emerald-300/70 bg-gradient-to-br from-emerald-50 to-teal-50 p-3 shadow-sm sm:m-5 sm:p-4">
        {error ? (
          <span className="text-rose-600">{error}</span>
        ) : (
          <div className="flex flex-col gap-1.5">
            {/* line 1: Date • Casino */}
            <div className="flex items-center gap-2 text-[13px] text-slate-800 sm:text-sm">
              <span className="truncate">{dayLabel}</span>
              <span className="text-slate-300">•</span>
              <span className="truncate">{casino || 'Room'}</span>
            </div>

            {/* line 2: Total cash • $/h */}
            <div className="flex items-center gap-2 text-[13px] text-slate-800 sm:text-sm">
              <span>{money(total)}</span>
              <span className="text-slate-300">•</span>
              <span>${num(hourly)} / h</span>
            </div>

            {/* line 3: Total downs • $/d */}
            <div className="flex items-center gap-2 text-[13px] text-slate-800 sm:text-sm">
              <span>{num(downs)} downs</span>
              <span className="text-slate-300">•</span>
              <span>${num(pDown)} / d</span>
            </div>

            {/* line 4: Notes */}
            {notes?.trim() ? (
              <div className="text-[13px] text-slate-800 sm:text-sm">{notes}</div>
            ) : null}
          </div>
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

      {/* Footer actions only: Save/Cancel left, Delete right (hidden on mobile) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <button className="btn btn-danger" onClick={remove} disabled={deleting || saving}>
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>

        {error && <div className="text-xs text-rose-600">{error}</div>}
      </div>
    </div>
  );
}
