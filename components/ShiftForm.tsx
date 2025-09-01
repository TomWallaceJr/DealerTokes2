// components/ShiftForm.tsx
'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

function ymdLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

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

type LastShiftResp = {
  items: { casino: string }[];
  total: number;
  hasMore: boolean;
  limit: number;
  offset: number;
};

export default function ShiftForm({
  onSaved,
  initialDate,
}: {
  onSaved?: () => void;
  initialDate?: string; // "YYYY-MM-DD"
}) {
  const router = useRouter();

  // default to LOCAL today; override if initialDate provided
  const [date, setDate] = useState<string>(initialDate ?? ymdLocal(new Date()));
  useEffect(() => {
    if (initialDate && initialDate !== date) setDate(initialDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDate]);

  const [casino, setCasino] = useState<string>('');

  // display strings (for no spinners + clearing '0' on focus)
  const [hoursStr, setHoursStr] = useState<string>('0');
  const [downsStr, setDownsStr] = useState<string>('0');
  const [cashoutStr, setCashoutStr] = useState<string>('0'); // whole dollars

  // numeric values for KPIs/payload
  const hours = useMemo(() => parseNum(hoursStr), [hoursStr]);
  const downs = useMemo(() => parseNum(downsStr), [downsStr]);
  const tokesCash = useMemo(() => Math.max(0, Math.ceil(parseNum(cashoutStr))), [cashoutStr]);

  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<string[]>([]);

  // Load rooms for datalist
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

  // Default casino to most recent shift's room (only if empty)
  useEffect(() => {
    (async () => {
      if (casino.trim()) return;
      try {
        const res = await fetch('/api/shifts?limit=1', { cache: 'no-store' });
        if (!res.ok) return;
        const data: LastShiftResp = await res.json();
        const last = data.items?.[0]?.casino;
        if (last && !casino.trim()) setCasino(last);
      } catch {
        /* ignore */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        date,
        casino: casino.trim(),
        hours: ceilQuarter(hours), // send rounded-up
        tokesCash, // whole dollars (rounded-up)
        downs: ceilQuarter(Math.max(0, downs)),
        notes: notes || undefined,
      };
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let msg = 'Save failed';
        try {
          const j = await res.json();
          if (j?.error) msg = j.error;
        } catch {}
        throw new Error(msg);
      }
      onSaved?.();
      router.push('/');
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
      {/* Date + Casino in one row on sm+ */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs text-slate-600">Date</label>
          <input
            type="date"
            className="input h-10"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-xs text-slate-600">Casino / Room</label>
          <input
            list="rooms"
            className="input h-10"
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
      </div>

      {/* Hours / Downs / Cashout */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="text-xs text-slate-600">Hours Worked</label>
          <input
            type="text"
            inputMode="decimal"
            className="input"
            value={hoursStr}
            onFocus={() => {
              if (hoursStr === '0') setHoursStr('');
            }}
            onChange={(e) => setHoursStr(cleanDecimal(e.target.value))}
            onBlur={(e) => {
              const n = parseNum(e.target.value);
              if (n <= 0) setHoursStr('0');
              else setHoursStr(fmtNum(Math.max(0.25, ceilQuarter(n))));
            }}
            placeholder="0"
            required
          />
        </div>

        <div>
          <label className="text-xs text-slate-600">Cash Downs Dealt</label>
          <input
            type="text"
            inputMode="decimal"
            className="input"
            value={downsStr}
            onFocus={() => {
              if (downsStr === '0') setDownsStr('');
            }}
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
              onFocus={() => {
                if (cashoutStr === '0') setCashoutStr('');
              }}
              onChange={(e) => {
                const only = e.target.value.replace(/[^\d.]/g, '');
                setCashoutStr(only);
              }}
              onBlur={(e) => {
                const n = parseNum(e.target.value);
                setCashoutStr(String(Math.max(0, Math.ceil(n))));
              }}
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

      {/* Footer */}
      <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="text-slate-600">
          Total: ${tokesCash} • $/h: {perHour.toFixed(2)} • $/down: {perDown.toFixed(2)}
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto">
          <div className="flex gap-2">
            <button
              className="btn btn-primary w-full sm:w-auto"
              onClick={save}
              disabled={saveDisabled}
            >
              {saving ? 'Saving…' : 'Save Shift'}
            </button>
            <button
              className="btn w-full sm:w-auto"
              type="button"
              onClick={() => router.push('/')}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
          {error && <div className="text-xs text-rose-600">{error}</div>}
        </div>
      </div>
    </div>
  );
}
