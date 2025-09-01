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

/** Round to nearest 0.25 */
function roundQuarter(n: number) {
  return Math.round(n * 4) / 4;
}

function toNonNegInt(v: unknown): number | undefined {
  if (v === undefined) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
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
      hours: true,
      tokesCash: true,
      downs: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
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

  // Build partial update payload (no time-of-day fields at all)
  const data: any = {};

  if (typeof body.date === 'string') {
    try {
      data.date = ymdToUTCDate(body.date); // keep UTC midnight convention
    } catch {
      return NextResponse.json({ error: 'Invalid date (YYYY-MM-DD)' }, { status: 400 });
    }
  }

  if (typeof body.casino === 'string') {
    const c = body.casino.trim();
    if (!c) return NextResponse.json({ error: 'casino cannot be empty' }, { status: 400 });
    data.casino = c;
  }

  if (body.hours !== undefined) {
    const h = roundQuarter(Number(body.hours));
    if (!Number.isFinite(h) || h <= 0) {
      return NextResponse.json({ error: 'hours must be a positive number' }, { status: 400 });
    }
    data.hours = h;
  }

  if (body.downs !== undefined) {
    const d = roundQuarter(Number(body.downs));
    if (!Number.isFinite(d) || d < 0) {
      return NextResponse.json({ error: 'downs must be ≥ 0' }, { status: 400 });
    }
    data.downs = d;
  }

  if (body.tokesCash !== undefined) {
    const cents = toNonNegInt(body.tokesCash);
    if (cents === undefined) {
      return NextResponse.json({ error: 'tokesCash is invalid' }, { status: 400 });
    }
    data.tokesCash = cents;
  }

  if (body.notes !== undefined) {
    if (typeof body.notes === 'string') {
      data.notes = body.notes.trim() || null;
    } else if (body.notes === null) {
      data.notes = null;
    }
  }

  // Nothing to update?
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
  }

  // Ownership-safe update
  const updated = await prisma.shift.updateMany({
    where: { id, userId: session.user.id },
    data,
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Return the fresh row (no clockIn/clockOut in response)
  const row = await prisma.shift.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      date: true,
      casino: true,
      hours: true,
      tokesCash: true,
      downs: true,
      notes: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(row);
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
