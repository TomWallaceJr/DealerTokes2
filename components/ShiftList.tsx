"use client";
import { useEffect, useState } from "react";

type Shift = {
  id: string;
  date: string;
  casino: string;
  hours: number;
  tokesCash: number;
  tokesCards: number;
  tokesChips: number;
  tokesOther: number;
  notes?: string | null;
};

function sum(shift: Shift) {
  return shift.tokesCash + shift.tokesCards + shift.tokesChips + shift.tokesOther;
}

export default function ShiftList() {
  const [shifts, setShifts] = useState<Shift[]>([]);

  async function load() {
    const res = await fetch("/api/shifts");
    const data = await res.json();
    setShifts(data);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium">Shifts</h2>
        <button className="btn" onClick={load}>Refresh</button>
      </div>
      <div className="space-y-2">
        {shifts.map((s) => (
          <div key={s.id} className="rounded-xl border border-zinc-800 p-3">
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <div>
                <div className="font-medium">{new Date(s.date).toLocaleDateString()} • {s.casino}</div>
                <div className="text-zinc-400">{s.hours}h • ${sum(s)} total • ${(sum(s)/s.hours).toFixed(2)}/h</div>
              </div>
              {s.notes ? <div className="text-xs text-zinc-400 max-w-sm">{s.notes}</div> : null}
            </div>
          </div>
        ))}
        {shifts.length === 0 && <div className="text-sm text-zinc-400">No shifts yet. Add one to get started.</div>}
      </div>
    </div>
  );
}
