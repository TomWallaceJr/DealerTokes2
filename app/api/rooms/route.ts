// ============================================================================
// File: /app/api/rooms/route.ts
// Purpose: Datalist values for casinos/rooms (distinct per all shifts)
// ============================================================================
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const rows = await prisma.shift.findMany({ distinct: ['casino'], select: { casino: true } });
  const rooms = rows
    .map((r) => r.casino)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  return NextResponse.json({ rooms });
}
