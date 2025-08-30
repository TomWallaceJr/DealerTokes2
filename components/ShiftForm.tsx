"use client";
import { useState } from "react";

export default function ShiftForm({ onSaved }: { onSaved?: () => void }) {
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [casino, setCasino] = useState<string>("");
  const [hours, setHours] = useState<number>(8);
  const [tokesCash, setTokesCash] = useState<number>(0);
  const [tokesCards, setTokesCards] = useState<number>(0);
  const [tokesChips, setTokesChips] = useState<number>(0);
  const [tokesOther, setTokesOther] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const total = tokesCash + tokesCards + tokesChips + tokesOther;
  const hourly = hours > 0 ? total / hours : 0;

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          casino,
          hours,
          tokesCash,
          tokesCards,
          tokesChips,
          tokesOther,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setCasino("");
      setHours(8);
      setTokesCash(0);
      setTokesCards(0);
      setTokesChips(0);
      setTokesOther(0);
      setNotes("");
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-zinc-400">Date</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-zinc-400">Casino/Room</label>
          <input className="input" placeholder="e.g., Wind Creek" value={casino} onChange={(e) => setCasino(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-zinc-400">Hours</label>
          <input className="input" type="number" step="0.25" value={hours} onChange={(e) => setHours(parseFloat(e.target.value))} />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-zinc-400">Cash</label>
          <input className="input" type="number" value={tokesCash} onChange={(e) => setTokesCash(parseInt(e.target.value || "0"))} />
        </div>
        <div>
          <label className="text-xs text-zinc-400">Cards</label>
          <input className="input" type="number" value={tokesCards} onChange={(e) => setTokesCards(parseInt(e.target.value || "0"))} />
        </div>
        <div>
          <label className="text-xs text-zinc-400">Chips</label>
          <input className="input" type="number" value={tokesChips} onChange={(e) => setTokesChips(parseInt(e.target.value || "0"))} />
        </div>
        <div>
          <label className="text-xs text-zinc-400">Other</label>
          <input className="input" type="number" value={tokesOther} onChange={(e) => setTokesOther(parseInt(e.target.value || "0"))} />
        </div>
      </div>
      <div>
        <label className="text-xs text-zinc-400">Notes</label>
        <textarea className="textarea" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="flex items-center justify-between text-sm text-zinc-300">
        <div>Total: ${"{"}total{"}"} | Hourly: ${"{"}hourly.toFixed(2){"}"}</div>
        <button className="btn" onClick={save} disabled={saving || !casino || hours <= 0}>{saving ? "Saving..." : "Save Shift"}</button>
      </div>
    </div>
  );
}
