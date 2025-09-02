// ============================================================================
// File: /app/api/shifts/route.ts
// Purpose: List (GET) & Create (POST) shifts
// - GET: paged, scoped to session user, supports from (inclusive) / to (exclusive)
// - POST: validates input, derives userId from NextAuth session, creates shift
// - Returns friendly errors on duplicate date and validation failures
// ============================================================================
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ---------- helpers ----------
function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}
const roundQuarterUp = (n: number) => Math.ceil(n * 4) / 4;
function ymdToUtcDate(ymd: string) {
  const [y, m, d] = ymd.split('-').map((x) => parseInt(x, 10));
  if (!y || !m || !d) throw new Error('Bad ymd');
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

const CreateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD (local)'),
  casino: z.string().min(1, 'casino is required').max(100),
  hours: z.number().positive('hours must be > 0').max(24, 'hours too large'),
  downs: z.number().min(0).max(300),
  tokesCash: z.number().int().min(0).max(100000),
  notes: z.string().max(1000).optional().nullable(),
  // Optional dev/testing override; ignored in production when session user exists
  userId: z.string().optional(),
});

// ---------- GET: list shifts (newest first) ----------
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const limit = clamp(Number(searchParams.get('limit') ?? 20), 1, 1000);
  const offset = Math.max(Number(searchParams.get('offset') ?? 0), 0);
  const from = searchParams.get('from'); // inclusive
  const to = searchParams.get('to'); // exclusive

  const session = await getServerSession(authOptions);
  const where: any = {};
  if (session?.user?.id) where.userId = session.user.id; // scope to current user

  if (from || to) {
    where.date = {};
    if (from) where.date.gte = ymdToUtcDate(from);
    if (to) where.date.lt = ymdToUtcDate(to); // exclusive
  }

  const [total, rows] = await Promise.all([
    prisma.shift.count({ where }),
    prisma.shift.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      skip: offset,
      take: limit,
      select: {
        id: true,
        date: true,
        casino: true,
        hours: true,
        downs: true,
        tokesCash: true,
        notes: true,
      },
    }),
  ]);

  const items = rows.map((r) => ({
    id: r.id,
    date: (r.date as Date).toISOString().slice(0, 10),
    casino: r.casino,
    hours: r.hours,
    downs: r.downs,
    tokesCash: r.tokesCash ?? 0,
    notes: r.notes,
  }));

  const hasMore = offset + items.length < total;
  return NextResponse.json({ items, total, hasMore, limit, offset });
}

// ---------- POST: create shift ----------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = CreateSchema.parse(body);

    // Derive user from session (id preferred), fallback to email -> user lookup
    const session = await getServerSession(authOptions);
    let uid: string | null = session?.user?.id ?? null;
    if (!uid && session?.user?.email) {
      const u = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      uid = u?.id ?? null;
    }

    // Dev-only fallback to first user to ease local testing
    if (!uid && process.env.NODE_ENV !== 'production') {
      const first = await prisma.user.findFirst({ select: { id: true } });
      uid = first?.id ?? null;
    }

    if (!uid) {
      return NextResponse.json(
        { error: 'Not signed in. Please sign in and try again.' },
        { status: 401 },
      );
    }

    const created = await prisma.shift.create({
      data: {
        userId: uid,
        date: ymdToUtcDate(input.date),
        casino: input.casino.trim(),
        hours: roundQuarterUp(input.hours),
        downs: Math.max(0, roundQuarterUp(input.downs ?? 0)),
        tokesCash: Math.max(0, Math.floor(input.tokesCash ?? 0)),
        notes: (input.notes ?? '').trim() || null,
      },
    });

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json(
        { error: 'A shift for this date already exists for this user.' },
        { status: 409 },
      );
    }
    if (err instanceof z.ZodError) {
      const msg = err.issues.map((e) => `${e.path.join('.') || 'field'}: ${e.message}`).join('; ');
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create shift' }, { status: 500 });
  }
}
