// app/shifts/[id]/page.tsx
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import EditShiftForm from '@/components/EditShiftForm';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function toYmd(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'string') return v;
  return '';
}
function toHhmm(v: unknown): string {
  if (!v) return '';
  if (v instanceof Date) return `${pad(v.getHours())}:${pad(v.getMinutes())}`;
  if (typeof v === 'string') {
    if (/^\d{2}:\d{2}$/.test(v)) return v;
    const d = new Date(v);
    if (!isNaN(d.getTime())) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return v;
  }
  return '';
}

export default async function EditShiftPage({ params }: { params: Promise<{ id: string }> }) {
  // ⬇️ New: await params
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/auth/signin');

  const row = await prisma.shift.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      date: true,
      casino: true,
      downs: true,
      tokesCash: true,
      notes: true,
      clockIn: true,
      clockOut: true,
    },
  });

  if (!row) notFound();

  const shift = {
    id: row.id,
    date: toYmd(row.date), // "YYYY-MM-DD"
    casino: row.casino,
    downs: row.downs,
    tokesCash: row.tokesCash,
    notes: row.notes ?? '',
    clockIn: toHhmm(row.clockIn), // "HH:MM"
    clockOut: toHhmm(row.clockOut), // "HH:MM"
  };

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Edit Shift</h1>
        <Link href="/" className="btn btn-outline">
          Home
        </Link>
      </div>

      <EditShiftForm shift={shift} />
    </main>
  );
}
