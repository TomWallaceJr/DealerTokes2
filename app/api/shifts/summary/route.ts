// ============================================================================
// Query params supported (all optional):
// - from, to (YYYY-MM-DD) [to is exclusive]
// - year (YYYY), month (1..12)
// - casino (repeatable)
// - dow (comma-separated 0..6, Sunday=0)
// ============================================================================
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

function ymdToUtcDate(ymd: string) {
  const [y, m, d] = ymd.split('-').map((x) => parseInt(x, 10));
  if (!y || !m || !d) throw new Error('Bad ymd');
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}
function rangeForYearMonth(year?: number, month?: number): { from?: Date; to?: Date } {
  if (!year) return {};
  if (!month)
    return { from: new Date(Date.UTC(year, 0, 1)), to: new Date(Date.UTC(year + 1, 0, 1)) };
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1));
  return { from, to };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ total: 0, hours: 0, downs: 0, hourly: 0, perDown: 0, count: 0 });

    const fromParam = searchParams.get('from') ?? undefined;
    const toParam = searchParams.get('to') ?? undefined;
    const year = Number(searchParams.get('year') ?? '') || undefined;
    const month = Number(searchParams.get('month') ?? '') || undefined;
    const casinos = searchParams.getAll('casino').filter(Boolean);
    const dowParam = searchParams.get('dow') ?? '';
    const dows = dowParam
      ? dowParam
          .split(',')
          .map((x) => Number(x))
          .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
      : [];

    let from: Date | undefined;
    let to: Date | undefined;
    if (fromParam || toParam) {
      if (fromParam) from = ymdToUtcDate(fromParam);
      if (toParam) to = ymdToUtcDate(toParam);
    } else if (year) {
      const r = rangeForYearMonth(year, month);
      from = r.from;
      to = r.to;
    }

    const where: any = { userId: session.user.id };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = from;
      if (to) where.date.lt = to;
    }
    if (casinos.length) where.casino = { in: casinos };

    const rows = await prisma.shift.findMany({
      where,
      select: { date: true, hours: true, downs: true, tokesCash: true },
    });
    const filtered = dows.length
      ? rows.filter((r) => dows.includes((r.date as Date).getUTCDay()))
      : rows;

    let total = 0,
      hours = 0,
      downs = 0,
      count = 0;
    for (const r of filtered) {
      total += r.tokesCash ?? 0;
      hours += r.hours ?? 0;
      downs += r.downs ?? 0;
      count += 1;
    }
    const hourly = hours > 0 ? total / hours : 0;
    const perDown = downs > 0 ? total / downs : 0;

    return NextResponse.json({ total, hours, downs, hourly, perDown, count });
  } catch {
    return NextResponse.json({ total: 0, hours: 0, downs: 0, hourly: 0, perDown: 0, count: 0 });
  }
}
