// components/EditShiftForm.tsx
'use client';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

type ShiftForEdit = {
  id: string;
  date: string; // "YYYY-MM-DD"
  casino: string;
  hours: number; // quarter increments
  downs: number;
  tokesCash: number; // cents
  notes: string;
};

export default function EditShiftForm({ shift }: { shift: ShiftForEdit }) {
  const router = useRouter();

  const [date, setDate] = useState(shift.date);
  const [casino, setCasino] = useState(shift.casino);
  const [hours, setHours] = useState<number>(Number(shift.hours ?? 0));
  const [downs, setDowns] = useState<number>(Number(shift.downs ?? 0));
  const [tokesCashStr, setTokesCashStr] = useState<string>(String(shift.tokesCash ?? 0)); // cents (string)
  const [notes, setNotes] = useState<string>(shift.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const tokesCash = useMemo(() => {
    const n = parseInt(tokesCashStr || '0', 10);
    return Number.isFinite(n) ? n : 0; // cents
  }, [tokesCashStr]);

  const perHour = hours > 0 ? tokesCash / hours : 0; // cents per hour (display unchanged)
  const perDown = downs > 0 ? tokesCash / downs : 0; // cents per down  (display unchanged)

  async function save() {
    if (!casino.trim() || !(hours > 0)) {
      alert('Please enter a room and a positive number of hours.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/shifts/${shift.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          casino: casino.trim(),
          hours, // ✅ hours-only update
          tokesCash, // ✅ cents
          downs,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ? JSON.stringify(err.error) : 'Update failed');
      }
      router.push('/shifts');
      router.refresh();
    } catch (e) {
      console.error(e);
      alert('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm('Delete this shift? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/shifts/${shift.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      router.push('/shifts');
      router.refresh();
    } catch (e) {
      console.error(e);
      alert('Failed to delete.');
    } finally {
      setDeleting(false);
    }
  }

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
          <input className="input" value={casino} onChange={(e) => setCasino(e.target.value)} />
        </div>

        {/* Replaces clock-in/out with direct hours entry */}
        <div>
          <label className="text-xs text-slate-600">Hours Worked</label>
          <input
            className="input"
            type="number"
            step={0.25}
            min={0.25}
            inputMode="decimal"
            value={Number.isFinite(hours) ? hours : 0}
            onChange={(e) => setHours(Number(e.target.value))}
            placeholder="0"
          />
        </div>

        <div>
          <label className="text-xs text-slate-600">Downs</label>
          <input
            className="input"
            type="number"
            step={0.25}
            min={0}
            inputMode="decimal"
            value={Number.isFinite(downs) ? downs : 0}
            onChange={(e) => setDowns(Number(e.target.value))}
          />
        </div>

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
              onFocus={() => {
                if (tokesCashStr === '0') setTokesCashStr('');
              }}
              onBlur={() => {
                if (tokesCashStr.trim() === '') setTokesCashStr('0');
              }}
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
          $/h: {perHour.toFixed(2)} • $/down: {perDown.toFixed(2)}
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button className="btn btn-outline" type="button" onClick={() => router.push('/')}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={remove} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
