// app/api/shifts/summary/route.ts
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

function parseIntSafe(s: string | null): number | null {
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

// Build [gte, lt) range from year/month or from/to
function buildRange(params: URLSearchParams) {
  const year = parseIntSafe(params.get('year'));
  const month = parseIntSafe(params.get('month')); // 1..12
  const fromStr = params.get('from');
  const toStr = params.get('to');

  // from/to wins if provided
  if (fromStr || toStr) {
    const gte = fromStr ? new Date(fromStr) : undefined;
    const lt = toStr ? new Date(toStr) : undefined;
    return { gte, lt };
  }

  if (year && month) {
    const gte = new Date(year, month - 1, 1);
    const lt = new Date(year, month, 1); // first day next month
    return { gte, lt };
  }
  if (year) {
    const gte = new Date(year, 0, 1);
    const lt = new Date(year + 1, 0, 1);
    return { gte, lt };
  }
  return {};
}

function parseMulti(params: URLSearchParams, key: string): string[] {
  // supports ?key=a&key=b and ?key=a,b
  const all = params.getAll(key);
  const split = all.flatMap((v) => v.split(','));
  return Array.from(new Set(split.map((s) => s.trim()).filter(Boolean)));
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const params = new URL(req.url).searchParams;

  // Filters
  const range = buildRange(params); // year/month or from/to
  const casinos = parseMulti(params, 'casino'); // one or many room names
  const dowsRaw = parseMulti(params, 'dow'); // "0..6" (Sun..Sat) or "mon,tue,.."
  const mapDowName: Record<string, number> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
  };
  const dows = dowsRaw
    .map((v) => v.toLowerCase())
    .map((v) => (v in mapDowName ? mapDowName[v] : Number(v)))
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 6) as number[];

  // DB where (date range + casino list are handled here; DOW handled in JS)
  const where: any = { userId: user.id };
  if (range.gte || range.lt)
    where.date = { ...(range.gte && { gte: range.gte }), ...(range.lt && { lt: range.lt }) };
  if (casinos.length) where.casino = { in: casinos };

  // Pull minimal fields and aggregate in JS (fast enough for typical sizes)
  const shifts = await prisma.shift.findMany({
    where,
    select: { date: true, tokesCash: true, hours: true, downs: true, casino: true },
  });

  // Day-of-week filter (if any)
  const filtered = dows.length
    ? shifts.filter((s) => dows.includes(new Date(s.date).getDay()))
    : shifts;

  // Totals
  const total = filtered.reduce((a, s) => a + (s.tokesCash ?? 0), 0);
  const hours = filtered.reduce((a, s) => a + (s.hours ?? 0), 0);
  const downs = filtered.reduce((a, s) => a + (s.downs ?? 0), 0);
  const hourly = hours > 0 ? total / hours : 0;
  const perDown = downs > 0 ? total / downs : 0;

  // Optional: quick breakdowns (handy for future charts)
  const byCasino: Record<string, { total: number; hours: number; downs: number; count: number }> =
    {};
  for (const s of filtered) {
    const k = s.casino;
    byCasino[k] ??= { total: 0, hours: 0, downs: 0, count: 0 };
    byCasino[k].total += s.tokesCash ?? 0;
    byCasino[k].hours += s.hours ?? 0;
    byCasino[k].downs += s.downs ?? 0;
    byCasino[k].count += 1;
  }

  return NextResponse.json({
    total,
    hours,
    downs,
    hourly,
    perDown,
    count: filtered.length,
    filters: {
      year: params.get('year'),
      month: params.get('month'),
      casinos,
      dows,
      from: params.get('from'),
      to: params.get('to'),
    },
    breakdowns: { byCasino },
  });
}
