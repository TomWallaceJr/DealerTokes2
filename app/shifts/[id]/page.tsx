// app/shifts/[id]/page.tsx
import { getServerSession } from 'next-auth';
import { notFound, redirect } from 'next/navigation';

import EditShiftForm from '@/components/EditShiftForm';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function toYmd(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'string') return v;
  return '';
}

export default async function EditShiftPage({ params }: { params: Promise<{ id: string }> }) {
  // Next 15: await params
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/auth/signin');

  const row = await prisma.shift.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      date: true,
      casino: true,
      hours: true, // ✅ hours only
      downs: true,
      tokesCash: true,
      notes: true,
      // removed: clockIn, clockOut
    },
  });

  if (!row) notFound();

  const shift = {
    id: row.id,
    date: toYmd(row.date), // "YYYY-MM-DD"
    casino: row.casino,
    hours: Number(row.hours ?? 0), // ✅ ensure number (handles Decimal)
    downs: Number(row.downs ?? 0),
    tokesCash: row.tokesCash,
    notes: row.notes ?? '',
  };

  return (
    <main className="space-y-4">
      <EditShiftForm shift={shift} />
    </main>
  );
}
