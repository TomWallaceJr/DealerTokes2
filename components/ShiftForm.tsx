"use client";
import { useEffect, useState } from "react";

export default function ShiftForm({ onSaved }: { onSaved?: () => void }) {
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [casino, setCasino] = useState<string>("");
  const [hours, setHours] = useState<number>(8);
  const [tokesCash, setTokesCash] = useState<number>(0);
  const [downs, setDowns] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  const [rooms, setRooms] = useState<string[]>([]);

  const total = tokesCash;
  const hourly = hours > 0 ? total / hours : 0;
  const perDown = downs > 0 ? total / downs : 0;

  // Load rooms user has used previously
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/rooms");
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.rooms)) setRooms(data.rooms);
      } catch {
        // ignore; suggestions are optional
      }
    })();
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          casino: casino.trim(),
          hours,
          tokesCash,
          downs,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) throw new Error("Save failed");

      // Add the room to local suggestions if it's new
      const c = casino.trim();
      if (c && !rooms.includes(c)) setRooms((prev) => [...prev, c].sort((a, b) => a.localeCompare(b)));

      // Reset form
      setCasino("");
      setHours(8);
      setTokesCash(0);
      setDowns(0);
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
          <label className="text-xs text-zinc-400">Casino / Room</label>
          {/* Input with suggestions; user can still type anything */}
          <input
            className="input"
            list="rooms-suggest"
            placeholder="e.g., Wind Creek"
            value={casino}
            onChange={(e) => setCasino(e.target.value)}
          />
          <datalist id="rooms-suggest">
            {rooms.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="text-xs text-zinc-400">Hours</label>
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
          <label className="text-xs text-zinc-400">Downs</label>
          <input
            className="input"
            type="number"
            step="1"
            min="0"
            value={downs}
            onChange={(e) => setDowns(parseInt(e.target.value || "0"))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-zinc-400">Tokes ($)</label>
          <input
            className="input"
            type="number"
            min="0"
            value={tokesCash}
            onChange={(e) => setTokesCash(parseInt(e.target.value || "0"))}
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-zinc-400">Notes</label>
        <textarea className="textarea" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-zinc-300">
        <div>
          Total: ${total} • $/h: {hourly.toFixed(2)} • $/down: {perDown.toFixed(2)}
        </div>
        <button className="btn w-full sm:w-auto" onClick={save} disabled={saving || !casino.trim() || hours <= 0}>
          {saving ? "Saving..." : "Save Shift"}
        </button>
      </div>
    </div>
  );
}
