// components/ShiftForm.tsx
'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

function ymdLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function ShiftForm({
  onSaved,
  initialDate,
}: {
  onSaved?: () => void;
  initialDate?: string; // "YYYY-MM-DD"
}) {
  const router = useRouter();

  // ✅ default to LOCAL today; override if initialDate provided
  const [date, setDate] = useState<string>(initialDate ?? ymdLocal(new Date()));
  useEffect(() => {
    if (initialDate && initialDate !== date) setDate(initialDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDate]);

  const [casino, setCasino] = useState<string>('');
  // removed: clockIn / clockOut
  const [hours, setHours] = useState<number>(0);
  const [downs, setDowns] = useState<number>(0);
  const [tokesCashStr, setTokesCashStr] = useState<string>('0'); // cents, as before
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<string[]>([]);

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

  const tokesCash = Number.isFinite(parseInt(tokesCashStr, 10)) ? parseInt(tokesCashStr, 10) : 0;

  const perHour = hours > 0 ? tokesCash / hours : 0;
  const perDown = downs > 0 ? tokesCash / downs : 0;

  async function save() {
    setError(null);
    if (!casino.trim() || hours <= 0) {
      setError('Please enter a room and a positive number of hours.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        date, // ✅ keep the selected "YYYY-MM-DD"
        casino: casino.trim(),
        // removed: clockIn / clockOut
        hours, // server will round to 0.25
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
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg?.error || 'Save failed');
      }

      onSaved?.();
      router.push('/'); // back home
      router.refresh();
    } catch (e: any) {
      setError(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const saveDisabled = saving || !casino.trim() || hours <= 0;

  return (
    <div className="card space-y-4">
      {/* Date */}
      <div>
        <label className="block text-sm font-medium">Date</label>
        <input
          type="date"
          className="input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      {/* Casino / Room (datalist) */}
      <div>
        <label className="block text-sm font-medium">Casino / Room</label>
        <input
          list="rooms"
          className="input"
          placeholder="Wind Creek"
          value={casino}
          onChange={(e) => setCasino(e.target.value)}
          required
        />
        <datalist id="rooms">
          {rooms.map((r) => (
            <option key={r} value={r} />
          ))}
        </datalist>
      </div>

      {/* Hours / Downs / Tokes */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium">Hours Worked</label>
          <input
            type="number"
            className="input"
            step={0.25}
            min={0.25}
            inputMode="decimal"
            value={Number.isFinite(hours) ? hours : 0}
            onChange={(e) => setHours(Number(e.target.value))}
            placeholder="0"
            required
          />
          {/* Styling unchanged; no error text unless needed */}
        </div>

        <div>
          <label className="block text-sm font-medium">Downs Dealt</label>
          <input
            type="number"
            className="input"
            step={0.25}
            min={0}
            inputMode="decimal"
            value={Number.isFinite(downs) ? downs : 0}
            onChange={(e) => setDowns(Number(e.target.value))}
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Cash Tokes (¢)</label>
          <input
            type="number"
            className="input"
            step={1}
            min={0}
            inputMode="numeric"
            value={tokesCashStr}
            onChange={(e) => setTokesCashStr(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium">Notes</label>
        <textarea
          className="textarea"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional"
        />
      </div>

      {/* Footer row (unchanged styling) */}
      <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="text-slate-600">
          Total: ${tokesCash} • $/h: {perHour.toFixed(2)} • $/down: {perDown.toFixed(2)}
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <button
            className="btn btn-primary w-full sm:w-auto"
            onClick={save}
            disabled={saveDisabled}
          >
            {saving ? 'Saving…' : 'Save Shift'}
          </button>
          <button className="btn w-full sm:w-auto" type="button" onClick={() => router.push('/')}>
            Cancel
          </button>
        </div>
      </div>

      {error && <div className="text-sm text-rose-600">{error}</div>}
    </div>
  );
}
