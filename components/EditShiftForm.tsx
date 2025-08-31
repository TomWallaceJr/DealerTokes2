// components/EditShiftForm.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ShiftForEdit = {
  id: string;
  date: string;       // "YYYY-MM-DD"
  casino: string;
  downs: number;
  tokesCash: number;
  notes: string;
  clockIn: string;    // "HH:MM" (24h)
  clockOut: string;   // "HH:MM"
};

export default function EditShiftForm({ shift }: { shift: ShiftForEdit }) {
  const router = useRouter();

  const [date, setDate] = useState(shift.date);
  const [casino, setCasino] = useState(shift.casino);
  const [clockIn, setClockIn] = useState(shift.clockIn);
  const [clockOut, setClockOut] = useState(shift.clockOut);
  const [downs, setDowns] = useState<number>(shift.downs);
  const [tokesCashStr, setTokesCashStr] = useState<string>(String(shift.tokesCash));
  const [notes, setNotes] = useState<string>(shift.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Enforce 15-min steps on blur
  function normalizeTimeQuarter(hhmm: string): string {
    if (!/^\d{2}:\d{2}$/.test(hhmm)) return "";
    let [hh, mm] = hhmm.split(":").map((v) => parseInt(v, 10));
    if (!(hh >= 0 && hh <= 23) || !(mm >= 0 && mm <= 59)) return "";
    let snapped = Math.round(mm / 15) * 15;
    if (snapped === 60) {
      hh = (hh + 1) % 24;
      snapped = 0;
    }
    return `${String(hh).padStart(2, "0")}:${String(snapped).padStart(2, "0")}`;
  }

  function toMinutes(hhmm: string): number | null {
    if (!/^\d{2}:\d{2}$/.test(hhmm)) return null;
    const [hh, mm] = hhmm.split(":").map(Number);
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
    return hh * 60 + mm;
  }

  const hours = useMemo(() => {
    const s = toMinutes(clockIn);
    const e = toMinutes(clockOut);
    if (s == null || e == null) return 0;
    let dur = e - s;
    if (dur <= 0) dur += 24 * 60;
    return Math.round((dur / 60) * 4) / 4; // nearest 0.25h
  }, [clockIn, clockOut]);

  const tokesCash = useMemo(() => {
    const n = parseInt(tokesCashStr || "0", 10);
    return Number.isFinite(n) ? n : 0;
  }, [tokesCashStr]);

  const perHour = hours > 0 ? tokesCash / hours : 0;
  const perDown = downs > 0 ? tokesCash / downs : 0;
  const money = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });

  async function save() {
    if (!casino.trim() || !clockIn || !clockOut || hours <= 0) {
      alert("Please complete all required fields.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/shifts/${shift.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          casino: casino.trim(),
          clockIn,
          clockOut,
          tokesCash,
          downs,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ? JSON.stringify(err.error) : "Update failed");
      }
      router.push("/shifts");
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this shift? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/shifts/${shift.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.push("/shifts");
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Failed to delete.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="card space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400">Date</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div>
          <label className="text-xs text-slate-400">Casino / Room</label>
          <input className="input" value={casino} onChange={(e) => setCasino(e.target.value)} />
        </div>

        <div>
          <label className="text-xs text-slate-400">Clock In</label>
          <input
            className="input h-11"
            type="time"
            step={900}
            lang="en-US"
            value={clockIn}
            onChange={(e) => setClockIn(e.target.value)}
            onBlur={(e) => setClockIn(normalizeTimeQuarter(e.target.value))}
          />
        </div>

        <div>
          <label className="text-xs text-slate-400">Clocked Out</label>
          <input
            className="input h-11"
            type="time"
            step={900}
            lang="en-US"
            value={clockOut}
            onChange={(e) => setClockOut(e.target.value)}
            onBlur={(e) => setClockOut(normalizeTimeQuarter(e.target.value))}
          />
        </div>

        <div>
          <label className="text-xs text-slate-400">Hours Worked (auto)</label>
          <input className="input" type="text" value={hours.toFixed(2)} readOnly aria-readonly="true" />
        </div>

        <div>
          <label className="text-xs text-slate-400">Cash Downs</label>
          <input
            className="input"
            type="number"
            step="1"
            min="0"
            value={downs}
            onChange={(e) => setDowns(parseInt(e.target.value || "0"))}
          />
        </div>

        <div>
          <label className="text-xs text-slate-400">Cash Tokes</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
            <input
              className="input pl-6"
              inputMode="numeric"
              type="number"
              step="1"
              min="0"
              value={tokesCashStr}
              onFocus={() => { if (tokesCashStr === "0") setTokesCashStr(""); }}
              onBlur={() => { if (tokesCashStr.trim() === "") setTokesCashStr("0"); }}
              onChange={(e) => setTokesCashStr(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-400">Notes</label>
        <textarea className="textarea" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-slate-300">
        <div>
          $/h: {perHour.toFixed(2)} • $/down: {perDown.toFixed(2)}
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button className="btn border-red-700 hover:bg-red-800/40" onClick={remove} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
