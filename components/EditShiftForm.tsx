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

// ----- helpers (match ShiftForm UX) -----
const ceilQuarter = (n: number) => Math.ceil(n * 4) / 4;
const parseNum = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const cleanDecimal = (s: string) => {
  // allow digits and a single dot
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

  // display strings (no spinners)
  const [hoursStr, setHoursStr] = useState<string>(fmtNum(Number(shift.hours ?? 0)));
  const [downsStr, setDownsStr] = useState<string>(fmtNum(Number(shift.downs ?? 0)));
  const [cashoutStr, setCashoutStr] = useState<string>(String(shift.tokesCash ?? 0)); // dollars

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

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900">Edit Shift</h2>
          <p className="mt-0.5 text-xs text-slate-600">
            Update hours, downs, and cashout. Changes apply immediately.
          </p>
        </div>
        {/* Back (icon-only on mobile) */}
        <BackButton className="hidden sm:inline-flex" />
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
          Total: ${tokesCash} • $/h: {perHour.toFixed(2)} • $/down: {perDown.toFixed(2)}
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

          {/* inline error */}
          {error && <div className="text-xs text-rose-600">{error}</div>}
        </div>
      </div>
    </div>
  );
}
