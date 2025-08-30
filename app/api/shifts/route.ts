import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDemoUser } from "@/lib/demoUser";
import { z } from "zod";

const CreateShift = z.object({
  date: z.string(),
  casino: z.string().min(1),
  hours: z.number().positive(),
  tokesCash: z.number().int().nonnegative().default(0),
  tokesCards: z.number().int().nonnegative().default(0),
  tokesChips: z.number().int().nonnegative().default(0),
  tokesOther: z.number().int().nonnegative().default(0),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const user = await ensureDemoUser();
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
  const user = await ensureDemoUser();
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
      tokesCards: d.tokesCards ?? 0,
      tokesChips: d.tokesChips ?? 0,
      tokesOther: d.tokesOther ?? 0,
      notes: d.notes,
    },
  });
  return NextResponse.json(shift, { status: 201 });
}
