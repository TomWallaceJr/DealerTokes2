// app/api/shifts/route.ts
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

/** "YYYY-MM-DD" → Date at UTC midnight */
function ymdToUTCDate(ymd: unknown): Date {
  if (typeof ymd !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    throw new Error('Invalid date format (expected YYYY-MM-DD)');
  }
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Parse "HH:MM" → { h, m } or throw */
function parseHHMM(v: unknown): { h: number; m: number } {
  if (typeof v !== 'string' || !/^\d{2}:\d{2}$/.test(v)) {
    throw new Error('Time must be HH:MM');
  }
  const [h, m] = v.split(':').map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) throw new Error('Time out of range');
  return { h, m };
}

/** Build a UTC DateTime from a UTC date (midnight) + "HH:MM" */
function datePlusTimeUTC(baseUTCDate: Date, hhmm: string): Date {
  const { h, m } = parseHHMM(hhmm);
  return new Date(
    Date.UTC(
      baseUTCDate.getUTCFullYear(),
      baseUTCDate.getUTCMonth(),
      baseUTCDate.getUTCDate(),
      h,
      m,
    ),
  );
}

/** Hours (rounded to nearest 0.25) between two DateTimes (UTC) */
function hoursBetweenRoundQuarter(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  const h = ms / 3_600_000;
  return Math.round(h * 4) / 4;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);

  // pagination
  const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit') ?? 20)));
  const offset = Math.max(0, Number(searchParams.get('offset') ?? 0));

  // filters
  const year = searchParams.get('year'); // "2025"
  const month = searchParams.get('month'); // "1".."12"
  const dowRaw = searchParams.get('dow'); // "1,2,3"
  const dows = dowRaw
    ? dowRaw
        .split(',')
        .map((s) => Number(s))
        .filter(Number.isInteger)
    : [];
  const casinos = searchParams
    .getAll('casino')
    .map((s) => s.trim())
    .filter(Boolean);

  const where: any = { userId: session.user.id };
  if (casinos.length) where.casino = { in: casinos };

  if (year) {
    const y = Number(year);
    if (!Number.isNaN(y)) {
      if (month) {
        const m = Number(month) - 1;
        if (m >= 0 && m <= 11) {
          where.date = { gte: new Date(Date.UTC(y, m, 1)), lt: new Date(Date.UTC(y, m + 1, 1)) };
        }
      } else {
        where.date = { gte: new Date(Date.UTC(y, 0, 1)), lt: new Date(Date.UTC(y + 1, 0, 1)) };
      }
    }
  }

  const superset = await prisma.shift.findMany({
    where,
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });

  // In-memory DOW and "month across all years" filters
  const filtered = superset.filter((s) => {
    const d = new Date(s.date); // stored at UTC midnight
    if (!year && month) {
      const m = Number(month);
      if (!Number.isNaN(m) && d.getUTCMonth() + 1 !== m) return false;
    }
    if (dows.length) {
      const day = d.getUTCDay(); // 0..6, UTC
      if (!dows.includes(day)) return false;
    }
    return true;
  });

  const total = filtered.length;
  const items = filtered.slice(offset, offset + limit);
  const hasMore = offset + items.length < total;

  return NextResponse.json({ items, total, limit, offset, hasMore });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { date, casino, clockIn, clockOut, tokesCash, downs, notes } = body ?? {};
  if (!date) return NextResponse.json({ error: 'date is required' }, { status: 400 });
  if (typeof casino !== 'string' || !casino.trim()) {
    return NextResponse.json({ error: 'casino is required' }, { status: 400 });
  }

  // Normalize date + times
  let dateUtc: Date;
  try {
    dateUtc = ymdToUTCDate(date); // UTC midnight
  } catch {
    return NextResponse.json({ error: 'Invalid date (YYYY-MM-DD)' }, { status: 400 });
  }

  let inDT: Date, outDT: Date;
  try {
    inDT = datePlusTimeUTC(dateUtc, clockIn);
    outDT = datePlusTimeUTC(dateUtc, clockOut);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Invalid time(s)' }, { status: 400 });
  }

  // Overnight handling: if out ≤ in, move out to next day (still counts for the selected date)
  if (outDT <= inDT) {
    outDT = new Date(
      Date.UTC(
        dateUtc.getUTCFullYear(),
        dateUtc.getUTCMonth(),
        dateUtc.getUTCDate() + 1,
        outDT.getUTCHours(),
        outDT.getUTCMinutes(),
      ),
    );
  }

  const hours = hoursBetweenRoundQuarter(inDT, outDT);
  if (hours <= 0)
    return NextResponse.json({ error: 'Computed hours must be > 0' }, { status: 400 });

  const row = await prisma.shift.create({
    data: {
      userId: session.user.id,
      date: dateUtc, // ✅ stored as UTC midnight
      casino: casino.trim(),
      clockIn: inDT, // ✅ stored as DateTime
      clockOut: outDT, // ✅ stored as DateTime
      hours,
      tokesCash: Number(tokesCash ?? 0),
      downs: Number(downs ?? 0),
      notes: typeof notes === 'string' && notes.trim() ? notes : null,
    },
    select: {
      id: true,
      date: true,
      casino: true,
      clockIn: true,
      clockOut: true,
      hours: true,
      tokesCash: true,
      downs: true,
      notes: true,
      createdAt: true,
    },
  });

  return NextResponse.json(row, { status: 201 });
}
