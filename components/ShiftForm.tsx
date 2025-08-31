"use client";
import { useEffect, useState } from "react";

export default function ShiftForm({ onSaved }: { onSaved?: () => void }) {
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [casino, setCasino] = useState<string>("");

  // Labels: Hourly Rate (before Hours Worked), Hours Worked, Cash Downs, Cash Tokes
  const [hourlyRateStr, setHourlyRateStr] = useState<string>("0"); // currency text box
  const [hours, setHours] = useState<number>(8);
  const [downs, setDowns] = useState<number>(0);
  const [tokesCashStr, setTokesCashStr] = useState<string>("0"); // currency text box

  // Tournament
  const [tournamentDowns, setTournamentDowns] = useState<number>(0);
  const [tournamentRateStr, setTournamentRateStr] = useState<string>("0"); // currency text box

  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [rooms, setRooms] = useState<string[]>([]);

  // Suggestions for rooms (distinct user rooms)
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
  const money = (n: number) =>
    n.toLocaleString(undefined, { style: "currency", currency: "USD" });

  const intFrom = (s: string) => {
    const n = parseInt(s || "0", 10);
    return Number.isFinite(n) ? n : 0;
  };
  const floatFrom = (s: string) => {
    const n = parseFloat(s || "0");
    return Number.isFinite(n) ? n : 0;
  };

  const tokesCash = intFrom(tokesCashStr);
  const hourlyRate = floatFrom(hourlyRateStr);
  const tournamentRatePerDown = floatFrom(tournamentRateStr);

  const total = tokesCash; // preview still based on cash tokes only
  const perHour = hours > 0 ? total / hours : 0;
  const perDown = downs > 0 ? total / downs : 0;

  // Clear-on-focus for currency inputs
  const clearOnFocus = (value: string, setter: (v: string) => void) => () => {
    if (value === "0" || value === "0.0" || value === "0.00") setter("");
  };
  // Normalize empty to 0 on blur
  const zeroOnBlur = (value: string, setter: (v: string) => void, decimals = 0) => () => {
    if (value.trim() === "") setter(decimals ? "0.00" : "0");
    else if (decimals) {
      const n = floatFrom(value);
      setter(n.toFixed(2));
    } // else leave integers as typed
  };

  async function save() {
    setSaving(true);
    try {
      const payload = {
        date,
        casino: casino.trim(),
        hours,
        tokesCash, // int
        downs,     // int
        tournamentDowns,
        tournamentRatePerDown, // float
        hourlyRate,            // float
        notes: notes || undefined,
      };

      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");

      // add to local suggestions if new
      const c = casino.trim();
      if (c && !rooms.includes(c)) setRooms((p) => [...p, c].sort((a, b) => a.localeCompare(b)));

      // reset
      setCasino("");
      setHourlyRateStr("0");
      setHours(8);
      setDowns(0);
      setTokesCashStr("0");
      setTournamentDowns(0);
      setTournamentRateStr("0");
      setNotes("");
      onSaved?.();
    } finally {
      setSaving(false);
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

        {/* 1) Hourly Rate appears BEFORE Hours Worked */}
        <div>
          <label className="text-xs text-slate-400">Hourly Rate</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
            <input
              className="input pl-6"
              inputMode="decimal"
              type="number"
              step="0.01"
              min="0"
              value={hourlyRateStr}
              onFocus={clearOnFocus(hourlyRateStr, setHourlyRateStr)}
              onBlur={zeroOnBlur(hourlyRateStr, setHourlyRateStr, 2)}
              onChange={(e) => setHourlyRateStr(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400">Hours Worked</label>
          <input
            className="input"
            type="number"
            step="0.25"
            min="0"
            value={hours}
            onChange={(e) => setHours(parseFloat(e.target.value || "0"))}
          />
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
              onFocus={clearOnFocus(tokesCashStr, setTokesCashStr)}
              onBlur={zeroOnBlur(tokesCashStr, setTokesCashStr, 0)}
              onChange={(e) => setTokesCashStr(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400">Tournament Downs</label>
          <input
            className="input"
            type="number"
            step="1"
            min="0"
            value={tournamentDowns}
            onChange={(e) => setTournamentDowns(parseInt(e.target.value || "0"))}
          />
        </div>

        <div>
          <label className="text-xs text-slate-400">Tournament Rate per Down</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
            <input
              className="input pl-6"
              inputMode="decimal"
              type="number"
              step="0.01"
              min="0"
              value={tournamentRateStr}
              onFocus={clearOnFocus(tournamentRateStr, setTournamentRateStr)}
              onBlur={zeroOnBlur(tournamentRateStr, setTournamentRateStr, 2)}
              onChange={(e) => setTournamentRateStr(e.target.value)}
              placeholder="0.00"
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
          Total Cash Tokes: {money(total)} • $/h: {perHour.toFixed(2)} • $/down: {perDown.toFixed(2)}
        </div>
        <button className="btn w-full sm:w-auto" onClick={save} disabled={saving || !casino.trim() || hours <= 0}>
          {saving ? "Saving..." : "Save Shift"}
        </button>
      </div>
    </div>
  );
}
