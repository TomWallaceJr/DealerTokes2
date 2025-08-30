import Link from "next/link";

export default function Page() {
  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-lg font-medium mb-2">Welcome</h2>
        <p className="text-sm text-zinc-300">
          DealerTokes lets you log shifts and tokes in seconds, then see your hourly rate and trends by room or date range.
        </p>
        <div className="mt-4 flex gap-3">
          <Link href="/shifts/new" className="btn">Log a Shift</Link>
          <Link href="/shifts" className="btn">View Shifts</Link>
          <Link href="/stats" className="btn">Stats</Link>
        </div>
      </div>
      <div className="text-xs text-zinc-500">
        Demo mode is enabled by default (no auth). You can wire real auth later.
      </div>
    </div>
  );
}
