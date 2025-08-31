import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const CreateShift = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  casino: z.string().min(1),

  // raw inputs
  clockIn: z.string().regex(/^\d{2}:\d{2}$/), // "HH:MM" 00..23 : 00..59 (UI already snaps to 15s)
  clockOut: z.string().regex(/^\d{2}:\d{2}$/),

  tokesCash: z.number().int().nonnegative().default(0),
  downs: z.number().int().nonnegative().default(0),

  // keep but default to 0 (MVP hides these)
  tournamentDowns: z.number().int().nonnegative().default(0).optional(),
  tournamentRatePerDown: z.number().nonnegative().default(0).optional(),
  hourlyRate: z.number().nonnegative().default(0).optional(),

  notes: z.string().optional(),
});

// helpers
function toMinutes(hhmm: string): number {
  const [hh, mm] = hhmm.split(':').map(Number);
  return hh * 60 + mm;
}
function combine(dateStr: string, minutes: number): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d, 0, 0, 0, 0);
  dt.setMinutes(minutes);
  return dt;
}
function roundQuarterHours(hours: number) {
  return Math.round(hours * 4) / 4;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
        .filter((n) => Number.isInteger(n))
    : [];
  const casinos = searchParams
    .getAll('casino')
    .map((s) => s.trim())
    .filter(Boolean);

  // base DB where (user + casino + optional date range)
  const where: any = { userId: session.user.id };
  if (casinos.length) where.casino = { in: casinos };

  // If year is present, we can push a proper DB date range (month optional)
  if (year) {
    const y = Number(year);
    if (!Number.isNaN(y)) {
      if (month) {
        const m = Number(month) - 1; // JS months 0..11
        if (m >= 0 && m <= 11) {
          const start = new Date(Date.UTC(y, m, 1));
          const end = new Date(Date.UTC(y, m + 1, 1));
          where.date = { gte: start, lt: end };
        }
      } else {
        const start = new Date(Date.UTC(y, 0, 1));
        const end = new Date(Date.UTC(y + 1, 0, 1));
        where.date = { gte: start, lt: end };
      }
    }
  }

  // Pull a superset from DB (already filtered by user/casino/(year,month?))
  const superset = await prisma.shift.findMany({
    where,
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });

  // In-memory filters that Prisma can’t do directly (day-of-week and "month only")
  const filtered = superset.filter((s) => {
    const d = new Date(s.date);

    // If user chose a month WITHOUT a year, filter by month here
    if (!year && month) {
      const m = Number(month);
      if (!Number.isNaN(m) && d.getUTCMonth() + 1 !== m) return false;
    }

    // Day-of-week filter. NOTE: using UTC to match date stored at UTC midnight.
    // If your stored date is local-midnight, swap to d.getDay() instead.
    if (dows.length) {
      const day = d.getUTCDay(); // 0=Sun .. 6=Sat
      if (!dows.includes(day)) return false;
    }

    return true;
  });

  const total = filtered.length;
  const items = filtered.slice(offset, offset + limit);
  const hasMore = offset + items.length < total;

  return NextResponse.json({ items, total, limit, offset, hasMore });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = CreateShift.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  const startMin = toMinutes(d.clockIn);
  const endMin0 = toMinutes(d.clockOut);
  let endMin = endMin0;
  let overnight = false;
  if (endMin <= startMin) {
    // overnight into next day
    endMin += 24 * 60;
    overnight = true;
  }

  const clockIn = combine(d.date, startMin);
  const clockOut = combine(d.date, endMin);
  if (overnight) clockOut.setDate(clockOut.getDate() + 0); // already rolled via +24h minutes

  const hours = roundQuarterHours((endMin - startMin) / 60);

  const shift = await prisma.shift.create({
    data: {
      userId: user.id,
      date: new Date(d.date), // stays the clock-in date
      casino: d.casino,

      hours,
      tokesCash: d.tokesCash ?? 0,
      downs: d.downs ?? 0,

      tournamentDowns: d.tournamentDowns ?? 0,
      tournamentRatePerDown: d.tournamentRatePerDown ?? 0,
      hourlyRate: d.hourlyRate ?? 0,

      clockIn,
      clockOut,

      notes: d.notes,
    },
  });
  return NextResponse.json(shift, { status: 201 });
}
