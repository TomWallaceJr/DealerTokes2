// app/api/signup/route.ts
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs'; // bcrypt needs Node, not Edge

const schema = z.object({
  email: z
    .string()
    .email()
    .transform((v) => v.trim().toLowerCase()),
  name: z.string().trim().min(1),
  password: z.string().min(8), // 8+ is a better floor
});

function json(status: number, data: any) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return json(400, { error: 'Invalid input', details: parsed.error.flatten() });
    }

    const { email, name, password } = parsed.data;

    // Optional: quick existence check (still race-prone)
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return json(409, { error: 'Email already in use.' });

    const passwordHash = await bcrypt.hash(password, 12);

    // Create; also handle duplicate email races on unique constraint
    await prisma.user.create({
      data: { email, name, passwordHash },
      // Return nothing sensitive
      select: { id: true }, // minimal
    });

    return json(201, { ok: true });
  } catch (e: any) {
    // Prisma unique violation safety net
    if (e?.code === 'P2002') {
      return json(409, { error: 'Email already in use.' });
    }
    console.error(e);
    return json(500, { error: 'Server error' });
  }
}
