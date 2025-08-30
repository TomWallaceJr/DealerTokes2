import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDemoUser } from "@/lib/demoUser";
import { z } from "zod";

const UpdateShift = z.object({
  date: z.string().optional(),
  casino: z.string().min(1).optional(),
  hours: z.number().positive().optional(),
  tokesCash: z.number().int().nonnegative().optional(),
  tokesCards: z.number().int().nonnegative().optional(),
  tokesChips: z.number().int().nonnegative().optional(),
  tokesOther: z.number().int().nonnegative().optional(),
  notes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await ensureDemoUser();
  const shift = await prisma.shift.findFirst({ where: { id: params.id, userId: user.id } });
  if (!shift) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(shift);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await ensureDemoUser();
  const body = await req.json();
  const parsed = UpdateShift.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data: any = parsed.data;
  if (data.date) data.date = new Date(data.date);
  const shift = await prisma.shift.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(shift);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await ensureDemoUser();
  const existing = await prisma.shift.findFirst({ where: { id: params.id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.shift.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
