import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const UpdateShift = z.object({
  date: z.string().optional(),
  casino: z.string().min(1).optional(),
  hours: z.number().positive().optional(),

  tokesCash: z.number().int().nonnegative().optional(),
  downs: z.number().int().nonnegative().optional(),

  tournamentDowns: z.number().int().nonnegative().optional(),
  tournamentRatePerDown: z.number().nonnegative().optional(),

  hourlyRate: z.number().nonnegative().optional(),

  notes: z.string().optional().nullable(),
});

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
  return user ?? null;
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const shift = await prisma.shift.findFirst({ where: { id, userId: user.id } });
  if (!shift) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(shift);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await req.json();
  const parsed = UpdateShift.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const exists = await prisma.shift.findFirst({ where: { id, userId: user.id } });
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: any = parsed.data;
  if (data.date) data.date = new Date(data.date);

  const updated = await prisma.shift.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const exists = await prisma.shift.findFirst({ where: { id, userId: user.id } });
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.shift.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
