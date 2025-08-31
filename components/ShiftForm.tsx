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
  const [clockIn, setClockIn] = useState<string>(''); // "HH:MM"
  const [clockOut, setClockOut] = useState<string>(''); // "HH:MM"
  const [hours, setHours] = useState<number>(0);
  const [downs, setDowns] = useState<number>(0);
  const [tokesCashStr, setTokesCashStr] = useState<string>('0');
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

  function toMinutes(hhmm: string): number | null {
    if (!/^\d{2}:\d{2}$/.test(hhmm)) return null;
    const [hh, mm] = hhmm.split(':').map(Number);
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
    return hh * 60 + mm;
  }
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

  useEffect(() => {
    const s = toMinutes(clockIn);
    const e = toMinutes(clockOut);
    if (s == null || e == null) {
      setHours(0);
      return;
    }
    let dur = e - s;
    if (dur <= 0) dur += 24 * 60; // overnight
    setHours(Math.round((dur / 60) * 4) / 4);
  }, [clockIn, clockOut]);

  const tokesCash = Number.isFinite(parseInt(tokesCashStr, 10)) ? parseInt(tokesCashStr, 10) : 0;

  const perHour = hours > 0 ? tokesCash / hours : 0;
  const perDown = downs > 0 ? tokesCash / downs : 0;

  async function save() {
    setError(null);
    if (!casino.trim() || !clockIn || !clockOut || hours <= 0) {
      setError('Please enter a room and valid clock in/out times.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        date, // ✅ keep the selected "YYYY-MM-DD"
        casino: casino.trim(),
        clockIn, // "HH:MM"
        clockOut, // "HH:MM"
        hours, // server recomputes too
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

  const saveDisabled = saving || !casino.trim() || !clockIn || !clockOut || hours <= 0;

  return (
    <div className="card space-y-4">
      {/* form content unchanged, using date state */}
      {/* ... keep your fields ... */}
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
