// components/ShiftForm.tsx
'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ShiftForm({ onSaved }: { onSaved?: () => void }) {
  const router = useRouter();

  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [casino, setCasino] = useState<string>('');

  // Native time inputs (mobile shows wheel/scroller)
  const [clockIn, setClockIn] = useState<string>(''); // "HH:MM" (24h)
  const [clockOut, setClockOut] = useState<string>(''); // "HH:MM"

  // Derived hours (read-only)
  const [hours, setHours] = useState<number>(0);

  // MVP fields
  const [downs, setDowns] = useState<number>(0); // Cash Downs
  const [tokesCashStr, setTokesCashStr] = useState<string>('0'); // Cash Tokes (string for clear-on-focus)

  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [rooms, setRooms] = useState<string[]>([]);

  // Load previously used rooms (per user)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/rooms');
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.rooms)) setRooms(data.rooms);
      } catch {}
    })();
  }, []);

  // Helpers
  const money = (n: number) => n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  const intFrom = (s: string) => {
    const n = parseInt(s || '0', 10);
    return Number.isFinite(n) ? n : 0;
  };

  // Parse "HH:MM" -> minutes past midnight
  function toMinutes(hhmm: string): number | null {
    if (!/^\d{2}:\d{2}$/.test(hhmm)) return null;
    const [hh, mm] = hhmm.split(':').map(Number);
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
    return hh * 60 + mm;
  }

  // Snap any time string to nearest 15 minutes (00/15/30/45)
  function normalizeTimeQuarter(hhmm: string): string {
    if (!/^\d{2}:\d{2}$/.test(hhmm)) return '';
    let [hh, mm] = hhmm.split(':').map((v) => parseInt(v, 10));
    if (!(hh >= 0 && hh <= 23) || !(mm >= 0 && mm <= 59)) return '';
    let snapped = Math.round(mm / 15) * 15;
    if (snapped === 60) {
      hh = (hh + 1) % 24;
      snapped = 0;
    }
    const HH = String(hh).padStart(2, '0');
    const MM = String(snapped).padStart(2, '0');
    return `${HH}:${MM}`;
  }

  // Auto-calc Hours Worked when times change (overnight supported; shift belongs to selected date)
  useEffect(() => {
    const start = toMinutes(clockIn);
    const end = toMinutes(clockOut);
    if (start == null || end == null) {
      setHours(0);
      return;
    }
    let duration = end - start;
    if (duration <= 0) duration += 24 * 60; // if out ≤ in, treat as next day
    const h = duration / 60;
    setHours(Math.round(h * 4) / 4); // round to nearest 0.25h
  }, [clockIn, clockOut]);

  // Cash Tokes clear-on-focus UX
  const clearOnFocus = (value: string, setter: (v: string) => void) => () => {
    if (value === '0') setter('');
  };
  const zeroOnBlur = (value: string, setter: (v: string) => void) => () => {
    if (value.trim() === '') setter('0');
  };

  // Preview metrics (cash tokes only for MVP)
  const tokesCash = intFrom(tokesCashStr);
  const perHour = hours > 0 ? tokesCash / hours : 0;
  const perDown = downs > 0 ? tokesCash / downs : 0;

  async function save() {
    if (!casino.trim() || !clockIn || !clockOut || hours <= 0) {
      alert('Please select valid Clock In/Out times and enter a Casino.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        date,
        casino: casino.trim(),
        clockIn, // "HH:MM"
        clockOut, // "HH:MM"
        hours, // derived (server will also compute)
        tokesCash, // int ($)
        downs, // int
        notes: notes || undefined,
      };

      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Save failed');

      const c = casino.trim();
      if (c && !rooms.includes(c)) setRooms((p) => [...p, c].sort((a, b) => a.localeCompare(b)));

      // reset (keep date)
      setCasino('');
      setClockIn('');
      setClockOut('');
      setDowns(0);
      setTokesCashStr('0');
      setNotes('');
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  const saveDisabled = saving || !casino.trim() || !clockIn || !clockOut || hours <= 0;

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

        {/* Clock In (15-minute steps + on-blur normalization) */}
        <div>
          <label className="text-xs text-slate-600">Clock In</label>
          <input
            className="input h-11"
            type="time"
            step={900} // 15-minute increments
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

        {/* Auto-calculated Hours (read-only) */}
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
            Calculated from Clock In/Out. If out ≤ in, it rolls to next day; shift remains on the
            selected date.
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
            onChange={(e) => setDowns(parseInt(e.target.value || '0'))}
          />
        </div>

        {/* Cash Tokes ($ inside the input) */}
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
          Total Cash Tokes: {money(tokesCash)} • $/h: {perHour.toFixed(2)} • $/down:{' '}
          {perDown.toFixed(2)}
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <button
            className="btn btn-primary w-full sm:w-auto"
            onClick={save}
            disabled={saveDisabled}
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
    </div>
  );
}
