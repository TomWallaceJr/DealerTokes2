import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const CreateShift = z.object({
  date: z.string(),
  casino: z.string().min(1),
  hours: z.number().positive(),

  tokesCash: z.number().int().nonnegative().default(0), // Cash Tokes
  downs: z.number().int().nonnegative().default(0),     // Cash Downs

  tournamentDowns: z.number().int().nonnegative().default(0),
  tournamentRatePerDown: z.number().nonnegative().default(0),

  hourlyRate: z.number().nonnegative().default(0),

  notes: z.string().optional(),
});

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

  const shifts = await prisma.shift.findMany({ where, orderBy: { date: "desc" } });
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

  const shift = await prisma.shift.create({
    data: {
      userId: user.id,
      date: new Date(d.date),
      casino: d.casino,

      hours: d.hours,
      tokesCash: d.tokesCash ?? 0,
      downs: d.downs ?? 0,

      tournamentDowns: d.tournamentDowns ?? 0,
      tournamentRatePerDown: d.tournamentRatePerDown ?? 0,

      hourlyRate: d.hourlyRate ?? 0,

      notes: d.notes,
    },
  });
  return NextResponse.json(shift, { status: 201 });
}
