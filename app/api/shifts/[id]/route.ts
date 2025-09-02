// ============================================================================
// File: /app/api/shifts/[id]/route.ts
// Purpose: Update & delete a single shift (used by EditShiftForm)
// ============================================================================
import { prisma } from '@/lib/prisma';
import { ShiftUpdateSchema, toPrismaUpdateData } from '@/lib/validation/shift';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await _req.json();
    const input = ShiftUpdateSchema.parse(body);
    const data = toPrismaUpdateData(input);

    const updated = await prisma.shift.update({ where: { id: params.id }, data });
    return NextResponse.json(updated);
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json(
        { error: 'A shift for this date already exists for this user.' },
        { status: 409 },
      );
    }
    if (err?.issues) return NextResponse.json({ error: err.issues }, { status: 400 });
    return NextResponse.json({ error: 'Failed to update shift' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.shift.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete shift' }, { status: 500 });
  }
}
