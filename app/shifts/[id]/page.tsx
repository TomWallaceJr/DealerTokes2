// app/shifts/[id]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import EditShiftForm from "@/components/EditShiftForm";

type ShiftPayload = {
  id: string;
  date: string;      // YYYY-MM-DD
  casino: string;
  downs: number;
  tokesCash: number;
  notes: string;
  clockIn: string;   // "HH:MM"
  clockOut: string;  // "HH:MM"
};

function toHHMM(dt: Date): string {
  let hh = dt.getHours();
  let mm = dt.getMinutes();
  // snap minutes to 00/15/30/45
  let snapped = Math.round(mm / 15) * 15;
  if (snapped === 60) {
    hh = (hh + 1) % 24;
    snapped = 0;
  }
  return `${String(hh).padStart(2, "0")}:${String(snapped).padStart(2, "0")}`;
}

export default async function EditShiftPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/auth/signin?callbackUrl=/shifts");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect("/auth/signin?callbackUrl=/shifts");

  const shift = await prisma.shift.findFirst({
    where: { id: params.id, userId: user.id },
  });

  if (!shift) notFound();

  const dateStr = shift.date.toISOString().slice(0, 10);
  const clockInHHMM = shift.clockIn ? toHHMM(new Date(shift.clockIn)) : "08:00";
  const clockOutHHMM = shift.clockOut ? toHHMM(new Date(shift.clockOut)) : "16:00";

  const payload: ShiftPayload = {
    id: shift.id,
    date: dateStr,
    casino: shift.casino,
    downs: shift.downs,
    tokesCash: shift.tokesCash,
    notes: shift.notes ?? "",
    clockIn: clockInHHMM,
    clockOut: clockOutHHMM,
  };

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Edit Shift</h1>
      <EditShiftForm shift={payload} />
    </main>
  );
}
