"use client";
import { useEffect, useState } from "react";

const HOURS_12 = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")); // 01..12
const MINUTES_15 = ["00", "15", "30", "45"];
const PERIOD = ["AM", "PM"] as const;

export default function ShiftForm({ onSaved }: { onSaved?: () => void }) {
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [casino, setCasino] = useState<string>("");

  // Currency (only Cash Tokes shown in MVP)
  const [tokesCashStr, setTokesCashStr] = useState<string>("0");

  // 12-hour time pickers
  const [inHH, setInHH] = useState<string>("");
  const [inMM, setInMM] = useState<string>("");
  const [inAP, setInAP] = useState<"AM" | "PM" | "">("");
  const [outHH, setOutHH] = useState<string>("");
  const [outMM, setOutMM] = useState<string>("");
  const [outAP, setOutAP] = useState<"AM" | "PM" | "">("");

  // Derived
  const [hours, setHours] = useState<number>(0); // read-only
  const [downs, setDowns] = useState<number>(0); // Cash downs

  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [rooms, setRooms] = useState<string[]>([]);

  // Room suggestions
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/rooms");
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.rooms)) setRooms(data.rooms);
      } catch {}
    })();
  }, []);

  // Helpers
  const money = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });
  const intFrom = (s: string) => {
    const n = parseInt(s || "0", 10);
    return Number.isFinite(n) ? n : 0;
    };

  function toMinutes12(hh: string, mm: string, ap: "AM" | "PM" | ""): number | null {
    if (!hh || !mm || !ap) return null;
    const H = parseInt(hh, 10);
    const M = parseInt(mm, 10);
    if (!(H >= 1 && H <= 12) || !MINUTES_15.includes(mm)) return null;
    let h24 = H % 12; // 12 AM -> 0, 12 PM -> 12
    if (ap === "PM") h24 += 12;
    return h24 * 60 + M;
  }

  // Recompute hours from Clock In/Out (overnight supported; shift stays on selected date)
  useEffect(() => {
    const start = toMinutes12(inHH, inMM, inAP);
    const end = toMinutes12(outHH, outMM, outAP);
    if (start == null || end == null) { setHours(0); return; }
    let duration = end - start;
    if (duration <= 0) duration += 24 * 60; // treat as next day
    const h = duration / 60;
    setHours(Math.round(h * 4) / 4); // nearest 0.25h
  }, [inHH, inMM, inAP, outHH, outMM, outAP]);

  // Cash Tokes clear-on-focus
  const clearOnFocus = (value: string, setter: (v: string) => void) => () => {
    if (value === "0") setter("");
  };
  const zeroOnBlur = (value: string, setter: (v: string) => void) => () => {
    if (value.trim() === "") setter("0");
  };

  // Previews
  const tokesCash = intFrom(tokesCashStr);
  const perHour = hours > 0 ? tokesCash / hours : 0;
  const perDown = downs > 0 ? tokesCash / downs : 0;

  async function save() {
    if (!inHH || !inMM || !inAP || !outHH || !outMM || !outAP || hours <= 0) {
      alert("Please select valid Clock In and Clocked Out times.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        date,
        casino: casino.trim(),
        hours,         // derived
        tokesCash,     // int
        downs,         // int
        // tournamentDowns/hourlyRate/ratePerDown omitted → server defaults to 0
        notes: notes || undefined,
      };

      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");

      const c = casino.trim();
      if (c && !rooms.includes(c)) setRooms((p) => [...p, c].sort((a, b) => a.localeCompare(b)));

      // reset (keep date)
      setCasino("");
      setInHH(""); setInMM(""); setInAP("");
      setOutHH(""); setOutMM(""); setOutAP("");
      setDowns(0);
      setTokesCashStr("0");
      setNotes("");
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  const saveDisabled =
    saving ||
    !casino.trim() ||
    !inHH || !inMM || !inAP ||
    !outHH || !outMM || !outAP ||
    hours <= 0;

  return (
    <div className="card space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400">Date</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div>
          <label className="text-xs text-slate-400">Casino / Room</label>
          <input
            className="input"
            list="rooms-suggest"
            placeholder="e.g., Wind Creek"
            value={casino}
            onChange={(e) => setCasino(e.target.value)}
          />
          <datalist id="rooms-suggest">
            {rooms.map((r) => <option key={r} value={r} />)}
          </datalist>
        </div>

        {/* Clock In */}
        <div>
          <label className="text-xs text-slate-400">Clock In</label>
          <div className="flex gap-2">
            <select className="input" value={inHH} onChange={(e) => setInHH(e.target.value)}>
              <option value="" disabled>HH</option>
              {HOURS_12.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <span className="self-center">:</span>
            <select className="input" value={inMM} onChange={(e) => setInMM(e.target.value)}>
              <option value="" disabled>MM</option>
              {MINUTES_15.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select className="input" value={inAP} onChange={(e) => setInAP(e.target.value as "AM"|"PM")}>
              <option value="" disabled>AM/PM</option>
              {PERIOD.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Clocked Out */}
        <div>
          <label className="text-xs text-slate-400">Clocked Out</label>
          <div className="flex gap-2">
            <select className="input" value={outHH} onChange={(e) => setOutHH(e.target.value)}>
              <option value="" disabled>HH</option>
              {HOURS_12.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <span className="self-center">:</span>
            <select className="input" value={outMM} onChange={(e) => setOutMM(e.target.value)}>
              <option value="" disabled>MM</option>
              {MINUTES_15.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select className="input" value={outAP} onChange={(e) => setOutAP(e.target.value as "AM"|"PM")}>
              <option value="" disabled>AM/PM</option>
              {PERIOD.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Auto-calculated Hours (read-only) */}
        <div>
          <label className="text-xs text-slate-400">Hours Worked</label>
          <input className="input" type="text" value={hours.toFixed(2)} readOnly aria-readonly="true" />
          <div className="mt-1 text-[11px] text-slate-500">
            Calculated from Clock In/Out. If out ≤ in, it counts as next day; shift remains on selected date.
          </div>
        </div>

        {/* Cash Downs */}
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

        {/* Cash Tokes ($ inside input) */}
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
              onFocus={clearOnFocus(tokesCashStr, setTokesCashStr)}
              onBlur={zeroOnBlur(tokesCashStr, setTokesCashStr)}
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
          Total Cash Tokes: {money(tokesCash)} • $/h: {perHour.toFixed(2)} • $/down: {perDown.toFixed(2)}
        </div>
        <button className="btn w-full sm:w-auto" onClick={save} disabled={saveDisabled}>
          {saving ? "Saving..." : "Save Shift"}
        </button>
      </div>
    </div>
  );
}
