// ============================================================================
// File: /app/api/shifts/route.ts
// Purpose: List (optional date range) & create shifts
// ============================================================================
import { roundQuarterUp, ymdToUtcDate } from '@/lib/calc';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const CreateSchema = z.object({
  userId: z.string(), // TODO: derive from session in production
  date: z.string().refine((s) => /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.test(s), 'Invalid date'),
  casino: z.string().min(1).max(120),
  hours: z.number().positive().max(24),
  downs: z.number().min(0).max(1000).default(0),
  tokesCash: z.number().int().min(0).max(100000).default(0),
  notes: z.string().max(500).optional().nullable(),
});

type ListQuery = { from?: string | null; to?: string | null; userId?: string | null };

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q: ListQuery = {
    from: searchParams.get('from'),
    to: searchParams.get('to'),
    userId: searchParams.get('userId'),
  };

  const where: any = {};
  if (q.userId) where.userId = q.userId;
  if (q.from || q.to) where.date = {};
  if (q.from) where.date.gte = ymdToUtcDate(q.from);
  if (q.to) where.date.lte = ymdToUtcDate(q.to);

  const list = await prisma.shift.findMany({
    where,
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = CreateSchema.parse(body);
    const created = await prisma.shift.create({
      data: {
        userId: input.userId,
        date: ymdToUtcDate(input.date),
        casino: input.casino.trim(),
        hours: roundQuarterUp(input.hours),
        downs: Math.max(0, roundQuarterUp(input.downs ?? 0)),
        tokesCash: Math.max(0, Math.floor(input.tokesCash ?? 0)),
        notes: input.notes?.trim() || null,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json(
        { error: 'A shift for this date already exists for this user.' },
        { status: 409 },
      );
    }
    if (err?.issues) return NextResponse.json({ error: err.issues }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create shift' }, { status: 500 });
  }
}
