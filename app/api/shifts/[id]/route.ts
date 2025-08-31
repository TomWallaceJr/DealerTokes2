import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const UpdateShift = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  casino: z.string().min(1).optional(),

  // If you provide one of these, provide both
  clockIn: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  clockOut: z.string().regex(/^\d{2}:\d{2}$/).optional(),

  tokesCash: z.number().int().nonnegative().optional(),
  downs: z.number().int().nonnegative().optional(),

  tournamentDowns: z.number().int().nonnegative().optional(),
  tournamentRatePerDown: z.number().nonnegative().optional(),
  hourlyRate: z.number().nonnegative().optional(),

  notes: z.string().optional().nullable(),
});

function toMinutes(hhmm: string): number {
  const [hh, mm] = hhmm.split(":").map(Number);
  return hh * 60 + mm;
}
function combine(dateStr: string, minutes: number): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d, 0, 0, 0, 0);
  dt.setMinutes(minutes);
  return dt;
}
function roundQuarterHours(hours: number) {
  return Math.round(hours * 4) / 4;
}

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({ where: { email: session.user.email! } });
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
  const existing = await prisma.shift.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = UpdateShift.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  // Decide base date for combining times
  const baseDate = d.date ?? existing.date.toISOString().slice(0, 10);

  const data: any = {
    casino: d.casino,
    tokesCash: d.tokesCash,
    downs: d.downs,
    tournamentDowns: d.tournamentDowns,
    tournamentRatePerDown: d.tournamentRatePerDown,
    hourlyRate: d.hourlyRate,
    notes: d.notes ?? undefined,
  };

  if (d.date) data.date = new Date(d.date);

  // If times provided, recompute hours + clockIn/out
  if ((d.clockIn && !d.clockOut) || (!d.clockIn && d.clockOut)) {
    return NextResponse.json({ error: "Provide both clockIn and clockOut if updating times." }, { status: 400 });
  }
  if (d.clockIn && d.clockOut) {
    const startMin = toMinutes(d.clockIn);
    let endMin = toMinutes(d.clockOut);
    if (endMin <= startMin) endMin += 24 * 60;

    const clockIn = combine(baseDate, startMin);
    const clockOut = combine(baseDate, endMin);

    data.clockIn = clockIn;
    data.clockOut = clockOut;
    data.hours = roundQuarterHours((endMin - startMin) / 60);
  }

  const updated = await prisma.shift.update({
    where: { id },
    data,
  });
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
