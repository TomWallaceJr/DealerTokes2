// app/shifts/date/[date]/page.tsx
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

const isYmd = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

export default async function ShiftDateRouter({ params }: { params: Promise<{ date: string }> }) {
  // ⬇️ await params here too
  const { date: ymd } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/auth/signin');

  if (!isYmd(ymd)) redirect('/');

  const [y, m, d] = ymd.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, d));
  const end = new Date(Date.UTC(y, m - 1, d + 1));

  const existing = await prisma.shift.findFirst({
    where: { userId: session.user.id, date: { gte: start, lt: end } },
    select: { id: true },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });

  if (existing) redirect(`/shifts/${existing.id}`);
  redirect(`/shifts/new?date=${encodeURIComponent(ymd)}`);
}
