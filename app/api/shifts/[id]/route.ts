// app/api/shifts/[id]/route.ts
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

/** "YYYY-MM-DD" → Date at UTC midnight */
function ymdToUTCDate(ymd: unknown): Date {
  if (typeof ymd !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    throw new Error('Invalid date format');
  }
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Parse "HH:MM" → { h, m } or throw */
function parseHHMM(v: unknown): { h: number; m: number } {
  if (typeof v !== 'string' || !/^\d{2}:\d{2}$/.test(v)) throw new Error('Time must be HH:MM');
  const [h, m] = v.split(':').map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) throw new Error('Time out of range');
  return { h, m };
}

/** Build UTC DateTime from UTC date + "HH:MM" */
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

/** Hours rounded to 0.25 */
function hoursBetweenRoundQuarter(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  const h = ms / 3_600_000;
  return Math.round(h * 4) / 4;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const row = await prisma.shift.findFirst({
    where: { id, userId: session.user.id },
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

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // We need current to compute effective times if only one piece is provided
  const current = await prisma.shift.findFirst({
    where: { id, userId: session.user.id },
    select: { date: true, clockIn: true, clockOut: true },
  });
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Determine base (effective) date
  let effectiveDate = current.date;
  if (typeof body.date === 'string') {
    try {
      effectiveDate = ymdToUTCDate(body.date);
    } catch {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
    }
  }

  // Build effective times
  // If provided in body as "HH:MM" → reconstruct DateTime on the effective date
  // If not, keep existing but shift to the effective date (preserve time-of-day)
  function hhmmFromDT(dt: Date): string {
    const h = String(dt.getUTCHours()).padStart(2, '0');
    const m = String(dt.getUTCMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  const inHHMM =
    typeof body.clockIn === 'string' ? body.clockIn : hhmmFromDT(current.clockIn as Date);
  const outHHMM =
    typeof body.clockOut === 'string' ? body.clockOut : hhmmFromDT(current.clockOut as Date);

  let inDT: Date, outDT: Date;
  try {
    inDT = datePlusTimeUTC(effectiveDate, inHHMM);
    outDT = datePlusTimeUTC(effectiveDate, outHHMM);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Invalid time(s)' }, { status: 400 });
  }

  // Overnight
  if (outDT <= inDT) {
    outDT = new Date(
      Date.UTC(
        effectiveDate.getUTCFullYear(),
        effectiveDate.getUTCMonth(),
        effectiveDate.getUTCDate() + 1,
        outDT.getUTCHours(),
        outDT.getUTCMinutes(),
      ),
    );
  }

  const hours = hoursBetweenRoundQuarter(inDT, outDT);
  if (hours <= 0)
    return NextResponse.json({ error: 'Computed hours must be > 0' }, { status: 400 });

  const updated = await prisma.shift.update({
    where: { id },
    data: {
      date: effectiveDate, // ✅ keep date at UTC midnight
      clockIn: inDT, // ✅ DateTime
      clockOut: outDT, // ✅ DateTime
      hours,
      // Optional updates
      casino: typeof body.casino === 'string' ? body.casino.trim() : undefined,
      tokesCash: Number.isFinite(body.tokesCash) ? Number(body.tokesCash) : undefined,
      downs: Number.isFinite(body.downs) ? Number(body.downs) : undefined,
      notes: typeof body.notes === 'string' ? body.notes.trim() || null : undefined,
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
      updatedAt: true,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const exists = await prisma.shift.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.shift.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
