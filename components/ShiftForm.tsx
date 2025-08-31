// components/ShiftForm.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ShiftForm({ onSaved }: { onSaved?: () => void }) {
  const router = useRouter();

  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [casino, setCasino] = useState<string>('');

  // Times (24h "HH:MM")
  const [clockIn, setClockIn] = useState<string>('');
  const [clockOut, setClockOut] = useState<string>('');

  // Derived
  const [hours, setHours] = useState<number>(0);

  // MVP fields
  const [downs, setDowns] = useState<number>(0);
  const [tokesCashStr, setTokesCashStr] = useState<string>('0');

  const [notes, setNotes] = useState<string>('');
  const [rooms, setRooms] = useState<string[]>([]);
  const [saving, setSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load previously used rooms
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/rooms');
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.rooms)) setRooms(data.rooms);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  // Helpers
  const money = (n: number) => n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });

  const intFrom = (s: string) => {
    const n = parseInt(s || '0', 10);
    return Number.isFinite(n) ? n : 0;
  };

  // "HH:MM" -> minutes
  function toMinutes(hhmm: string): number | null {
    if (!/^\d{2}:\d{2}$/.test(hhmm)) return null;
    const [hh, mm] = hhmm.split(':').map(Number);
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
    return hh * 60 + mm;
  }

  // Snap to 15-min increments
  function normalizeTimeQuarter(hhmm: string): string {
    if (!/^\d{2}:\d{2}$/.test(hhmm)) return '';
    let [hh, mm] = hhmm.split(':').map((v) => parseInt(v, 10));
    if (!(hh >= 0 && hh <= 23) || !(mm >= 0 && mm <= 59)) return '';
    let snapped = Math.round(mm / 15) * 15;
    if (snapped === 60) {
      hh = (hh + 1) % 24;
      snapped = 0;
    }
    return `${String(hh).padStart(2, '0')}:${String(snapped).padStart(2, '0')}`;
  }

  // Auto-calc hours
  useEffect(() => {
    const s = toMinutes(clockIn);
    const e = toMinutes(clockOut);
    if (s == null || e == null) {
      setHours(0);
      return;
    }
    let dur = e - s;
    if (dur <= 0) dur += 24 * 60; // overnight
    setHours(Math.round((dur / 60) * 4) / 4); // nearest 0.25h
  }, [clockIn, clockOut]);

  // Cash Tokes UX
  const clearOnFocus = (value: string, setter: (v: string) => void) => () => {
    if (value === '0') setter('');
  };
  const zeroOnBlur = (value: string, setter: (v: string) => void) => () => {
    if (value.trim() === '') setter('0');
  };

  const tokesCash = intFrom(tokesCashStr);
  const perHour = hours > 0 ? tokesCash / hours : 0;
  const perDown = downs > 0 ? tokesCash / downs : 0;

  function validate(): string | null {
    if (!casino.trim()) return 'Enter a casino/room.';
    if (!clockIn) return 'Select a valid Clock In time.';
    if (!clockOut) return 'Select a valid Clocked Out time.';
    const s = toMinutes(clockIn);
    const e = toMinutes(clockOut);
    if (s == null || e == null) return 'Times must be HH:MM in 15-minute increments.';
    if (hours <= 0) return 'Hours must be greater than 0 (check your times).';
    if (downs < 0) return 'Cash Downs cannot be negative.';
    if (tokesCash < 0) return 'Cash Tokes cannot be negative.';
    return null;
  }

  async function save() {
    setFormError(null);

    const v = validate();
    if (v) {
      setFormError(v);
      return; // stay on page
    }

    setSaving(true);
    try {
      const payload = {
        date,
        casino: casino.trim(),
        clockIn,
        clockOut,
        hours,
        tokesCash,
        downs,
        notes: notes || undefined,
      };

      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = 'Save failed. Please try again.';
        try {
          const data = await res.json();
          if (typeof data?.error === 'string') msg = data.error;
        } catch {}
        setFormError(msg);
        return; // stay on page
      }

      // Success → optional callback then go home
      onSaved?.();
      router.push('/');
    } catch {
      setFormError('Network error while saving. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // Only disable while saving; let validation run on click
  const saveDisabled = saving;

  return (
    <div className="card space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs text-slate-600">Date</label>
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs text-slate-600">Casino / Room</label>
          <input
            className="input"
            list="rooms-suggest"
            placeholder="e.g., Wind Creek"
            value={casino}
            onChange={(e) => setCasino(e.target.value)}
          />
          <datalist id="rooms-suggest">
            {rooms.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </div>

        {/* Clock In */}
        <div>
          <label className="text-xs text-slate-600">Clock In</label>
          <input
            className="input h-11"
            type="time"
            step={900}
            lang="en-US"
            value={clockIn}
            onChange={(e) => setClockIn(e.target.value)}
            onBlur={(e) => setClockIn(normalizeTimeQuarter(e.target.value))}
            placeholder="--:--"
          />
          <div className="mt-1 text-[11px] text-slate-500">Minutes snap to 00, 15, 30, or 45.</div>
        </div>

        {/* Clocked Out */}
        <div>
          <label className="text-xs text-slate-600">Clocked Out</label>
          <input
            className="input h-11"
            type="time"
            step={900}
            lang="en-US"
            value={clockOut}
            onChange={(e) => setClockOut(e.target.value)}
            onBlur={(e) => setClockOut(normalizeTimeQuarter(e.target.value))}
            placeholder="--:--"
          />
        </div>

        {/* Hours (auto) */}
        <div>
          <label className="text-xs text-slate-600">Hours Worked</label>
          <input
            className="input"
            type="text"
            value={hours.toFixed(2)}
            readOnly
            aria-readonly="true"
          />
          <div className="mt-1 text-[11px] text-slate-500">
            If out ≤ in, it rolls to next day; shift remains on the selected date.
          </div>
        </div>

        {/* Cash Downs */}
        <div>
          <label className="text-xs text-slate-600">Cash Downs</label>
          <input
            className="input"
            type="number"
            step="1"
            min="0"
            value={downs}
            onChange={(e) => setDowns(parseInt(e.target.value || '0', 10))}
          />
        </div>

        {/* Cash Tokes */}
        <div>
          <label className="text-xs text-slate-600">Cash Tokes</label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400">
              $
            </span>
            <input
              className="input pl-6"
              inputMode="numeric"
              type="number"
              step="1"
              min="0"
              value={tokesCashStr}
              onFocus={clearOnFocus(tokesCashStr, setTokesCashStr)}
              onBlur={zeroOnBlur(tokesCashStr, setTokesCashStr)}
              onChange={(e) => setTokesCashStr(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-600">Notes</label>
        <textarea
          className="textarea"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
        <div>
          Total Cash Tokes: {money(intFrom(tokesCashStr))} • $/h: {perHour.toFixed(2)} • $/down:{' '}
          {perDown.toFixed(2)}
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <button
            className="btn btn-primary w-full sm:w-auto"
            onClick={save}
            disabled={saveDisabled}
            aria-disabled={!casino.trim() || !clockIn || !clockOut || hours <= 0 ? true : undefined}
            title={
              !casino.trim()
                ? 'Enter a casino/room'
                : !clockIn || !clockOut
                  ? 'Select valid times'
                  : hours <= 0
                    ? 'Hours must be greater than 0'
                    : undefined
            }
          >
            {saving ? 'Saving...' : 'Save Shift'}
          </button>
          <button
            className="btn btn-outline w-full sm:w-auto"
            type="button"
            onClick={() => router.push('/')}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Error area under buttons */}
      {formError && (
        <div
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          aria-live="polite"
          role="alert"
        >
          {formError}
        </div>
      )}
    </div>
  );
}
