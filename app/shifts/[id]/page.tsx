// app/shifts/[id]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import EditShiftForm from "@/components/EditShiftForm";

function toHHMM(dateISO: string) {
  const d = new Date(dateISO);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  // Snap incoming minutes to 00/15/30/45 for our UI
  const step = Math.round(Number(mm) / 15) * 15;
  const mmSnap = String(step === 60 ? 0 : step).padStart(2, "0");
  const hhSnap = String(step === 60 ? (Number(hh) + 1) % 24 : Number(hh)).padStart(2, "0");
  return `${hhSnap}:${mmSnap}`;
}

export default async function EditShiftPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/auth/signin?callbackUrl=/shifts");

  const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
  if (!user) redirect("/auth/signin?callbackUrl=/shifts");

  const shift = await prisma.shift.findFirst({
    where: { id: params.id, userId: user.id },
  });

  if (!shift) notFound();

  const payload = {
    id: shift.id,
    date: shift.date.toISOString().slice(0, 10), // YYYY-MM-DD
    casino: shift.casino,
    downs: shift.downs,
    tokesCash: shift.tokesCash,
    notes: shift.notes ?? "",
    clockIn: toHHMM(shift.clockIn?.toISOString() ?? `${payload?.date}T08:00:00Z`),
    clockOut: toHHMM(shift.clockOut?.toISOString() ?? `${payload?.date}T16:00:00Z`),
  };

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Edit Shift</h1>
      <EditShiftForm shift={payload} />
    </main>
  );
}
