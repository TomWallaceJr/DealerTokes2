import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const CreateShift = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  casino: z.string().min(1),

  // raw inputs
  clockIn: z.string().regex(/^\d{2}:\d{2}$/),    // "HH:MM" 00..23 : 00..59 (UI already snaps to 15s)
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

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = { userId: user.id };
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }

  const shifts = await prisma.shift.findMany({
    where,
    orderBy: { date: "desc" },
  });
  return NextResponse.json(shifts);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  if (endMin <= startMin) { // overnight into next day
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
