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

/** "YYYY-MM-DD" → Date at UTC midnight */
function ymdToUTCDate(s: string): Date {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error('Invalid YYYY-MM-DD');
  const y = Number(m[1]);
  const mm = Number(m[2]) - 1;
  const d = Number(m[3]);
  return new Date(Date.UTC(y, mm, d));
}

/** Coerce arbitrary date-ish string to UTC midnight (best effort) */
function coerceToUTCDateMidnight(s: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return ymdToUTCDate(s);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error('Invalid date');
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// Build [gte, lt) range from year/month or from/to (all UTC)
function buildRangeUTC(params: URLSearchParams) {
  const year = parseIntSafe(params.get('year'));
  const month = parseIntSafe(params.get('month')); // 1..12
  const fromStr = params.get('from');
  const toStr = params.get('to');

  // from/to wins if provided
  if (fromStr || toStr) {
    const gte = fromStr ? coerceToUTCDateMidnight(fromStr) : undefined;
    const lt = toStr
      ? // make 'to' exclusive by bumping one day
        new Date(
          Date.UTC(
            coerceToUTCDateMidnight(toStr).getUTCFullYear(),
            coerceToUTCDateMidnight(toStr).getUTCMonth(),
            coerceToUTCDateMidnight(toStr).getUTCDate() + 1,
          ),
        )
      : undefined;
    return { gte, lt };
  }

  if (year && month) {
    const gte = new Date(Date.UTC(year, month - 1, 1));
    const lt = new Date(Date.UTC(year, month, 1));
    return { gte, lt };
  }
  if (year) {
    const gte = new Date(Date.UTC(year, 0, 1));
    const lt = new Date(Date.UTC(year + 1, 0, 1));
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
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const params = new URL(req.url).searchParams;

  // Filters
  const range = buildRangeUTC(params); // year/month or from/to (UTC-safe)
  const casinos = parseMulti(params, 'casino'); // one or many room names
  const dowsRaw = parseMulti(params, 'dow'); // "0..6" or "mon,tue,..."
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

  // DB where (date range + casino list here; DOW handled in JS with UTC day)
  const where: any = { userId: session.user.id };
  if (range.gte || range.lt)
    where.date = { ...(range.gte && { gte: range.gte }), ...(range.lt && { lt: range.lt }) };
  if (casinos.length) where.casino = { in: casinos };

  // Pull minimal fields and aggregate in JS
  const shifts = await prisma.shift.findMany({
    where,
    select: { date: true, tokesCash: true, hours: true, downs: true, casino: true },
  });

  // Day-of-week filter using **UTC** day
  const filtered = dows.length
    ? shifts.filter((s) => dows.includes(new Date(s.date).getUTCDay()))
    : shifts;

  // Totals (ensure numeric for Prisma Decimal types)
  const total = filtered.reduce((a, s) => a + (s.tokesCash ?? 0), 0);
  const hours = filtered.reduce((a, s) => a + Number(s.hours ?? 0), 0);
  const downs = filtered.reduce((a, s) => a + Number(s.downs ?? 0), 0);
  const hourly = hours > 0 ? total / hours : 0;
  const perDown = downs > 0 ? total / downs : 0;

  // Optional breakdowns for future charts
  const byCasino: Record<string, { total: number; hours: number; downs: number; count: number }> =
    {};
  for (const s of filtered) {
    const k = s.casino;
    byCasino[k] ??= { total: 0, hours: 0, downs: 0, count: 0 };
    byCasino[k].total += s.tokesCash ?? 0;
    byCasino[k].hours += Number(s.hours ?? 0);
    byCasino[k].downs += Number(s.downs ?? 0);
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
