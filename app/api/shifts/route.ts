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

/** Round to nearest 0.25 */
function roundQuarter(n: number) {
  return Math.round(n * 4) / 4;
}

function toNonNegInt(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
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

  // Select ONLY fields we care about (no clockIn/clockOut anywhere)
  const superset = await prisma.shift.findMany({
    where,
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      userId: true,
      date: true,
      casino: true,
      hours: true,
      downs: true,
      tokesCash: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
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

  const { date, casino, hours, tokesCash, downs, notes } = body ?? {};
  if (!date) return NextResponse.json({ error: 'date is required' }, { status: 400 });
  if (typeof casino !== 'string' || !casino.trim()) {
    return NextResponse.json({ error: 'casino is required' }, { status: 400 });
  }

  // Normalize date
  let dateUtc: Date;
  try {
    dateUtc = ymdToUTCDate(date); // UTC midnight
  } catch {
    return NextResponse.json({ error: 'Invalid date (YYYY-MM-DD)' }, { status: 400 });
  }

  // Normalize numbers (server rounds to 0.25)
  const hoursNum = roundQuarter(Number(hours));
  const downsNum = roundQuarter(Number(downs ?? 0));
  const tokesCents = toNonNegInt(tokesCash);

  if (!Number.isFinite(hoursNum) || hoursNum <= 0) {
    return NextResponse.json({ error: 'hours must be a positive number' }, { status: 400 });
  }
  if (!Number.isFinite(downsNum) || downsNum < 0) {
    return NextResponse.json({ error: 'downs must be ≥ 0' }, { status: 400 });
  }

  // Create WITHOUT any clockIn/clockOut
  const row = await prisma.shift.create({
    data: {
      userId: session.user.id,
      date: dateUtc, // stored as UTC midnight
      casino: casino.trim(),
      hours: hoursNum,
      downs: downsNum,
      tokesCash: tokesCents,
      notes: typeof notes === 'string' && notes.trim() ? notes : null,
    },
    select: {
      id: true,
      date: true,
      casino: true,
      hours: true,
      downs: true,
      tokesCash: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(row, { status: 201 });
}
