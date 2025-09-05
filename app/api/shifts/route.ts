// ============================================================================
// Purpose: Add filters used by stats page; apply DOW filtering after fetch;
// paginate AFTER filtering so the list only shows matched rows.
// ============================================================================
import { authOptions as _authOptions } from '@/lib/auth';
import { prisma as _prisma } from '@/lib/prisma';
import { ShiftUpdateSchema, toPrismaUpdateData } from '@/lib/validation/shift';
import { getServerSession as _getServerSession } from 'next-auth';
import { NextRequest as _NextRequest, NextResponse as _NextResponse } from 'next/server';
import { z as _z } from 'zod';

const MAX_FETCH = 5000; // safety guard
function _clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}
function _ymdToUtcDate(ymd: string) {
  const [y, m, d] = ymd.split('-').map((x) => parseInt(x, 10));
  if (!y || !m || !d) throw new Error('Bad ymd');
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}
function _rangeForYearMonth(year?: number, month?: number): { from?: Date; to?: Date } {
  if (!year) return {};
  if (!month)
    return { from: new Date(Date.UTC(year, 0, 1)), to: new Date(Date.UTC(year + 1, 0, 1)) };
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1));
  return { from, to };
}

export async function GET(req: _NextRequest) {
  const { searchParams } = new URL(req.url);

  const limit = _clamp(Number(searchParams.get('limit') ?? 20), 1, 1000);
  const offset = Math.max(Number(searchParams.get('offset') ?? 0), 0);

  // Filters
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

  const session = await _getServerSession(_authOptions);
  const where: any = {};
  if (session?.user?.id) where.userId = session.user.id;
  else return _NextResponse.json({ items: [], total: 0, hasMore: false, limit, offset });

  let from: Date | undefined;
  let to: Date | undefined;
  if (fromParam || toParam) {
    if (fromParam) from = _ymdToUtcDate(fromParam);
    if (toParam) to = _ymdToUtcDate(toParam);
  } else if (year) {
    const r = _rangeForYearMonth(year, month);
    from = r.from;
    to = r.to;
  }

  if (from || to) {
    where.date = {};
    if (from) where.date.gte = from;
    if (to) where.date.lt = to;
  }
  if (casinos.length) where.casino = { in: casinos };

  const rows = await _prisma.shift.findMany({
    where,
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    take: MAX_FETCH,
    select: {
      id: true,
      date: true,
      casino: true,
      hours: true,
      downs: true,
      tokesCash: true,
      tournamentDowns: true,
      tournamentRate: true,
      notes: true,
    },
  });

  const filtered = dows.length
    ? rows.filter((r) => dows.includes((r.date as Date).getUTCDay()))
    : rows;

  const total = filtered.length;
  const page = filtered.slice(offset, offset + limit);
  const items = page.map((r) => ({
    id: r.id,
    date: (r.date as Date).toISOString().slice(0, 10),
    casino: r.casino,
    hours: r.hours,
    downs: r.downs,
    tokesCash: r.tokesCash ?? 0,
    tournamentDowns: r.tournamentDowns ?? 0,
    tournamentRate: r.tournamentRate ?? 0,
    notes: r.notes,
  }));

  const hasMore = offset + items.length < total;
  return _NextResponse.json({ items, total, hasMore, limit, offset });
}

export async function POST(req: _NextRequest) {
  try {
    const session = await _getServerSession(_authOptions);
    if (!session?.user?.id) {
      return _NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const input = ShiftUpdateSchema.parse(body);
    const data = toPrismaUpdateData(input);

    const created = await _prisma.shift.create({
      data: { ...data, userId: session.user.id },
    });
    return _NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return _NextResponse.json(
        { error: 'A shift for this date already exists for this user.' },
        { status: 409 },
      );
    }
    if (err instanceof _z.ZodError) {
      const msg = err.issues.map((e) => `${e.path.join('.') || 'field'}: ${e.message}`).join('; ');
      return _NextResponse.json({ error: msg }, { status: 400 });
    }
    return _NextResponse.json({ error: 'Failed to create shift' }, { status: 500 });
  }
}
