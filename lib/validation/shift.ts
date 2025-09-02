// ============================================================================
// File: /lib/validation/shift.ts
// Purpose: Zod schemas aligned to Prisma Shift model
// ============================================================================
import { z } from 'zod';
import { roundQuarterUp, ymdToUtcDate } from '../calc';

export const ShiftUpdateSchema = z.object({
  date: z
    .string()
    .refine((s) => /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.test(s), 'Invalid date (YYYY-MM-DD)'),
  casino: z
    .string()
    .min(1)
    .max(120)
    .transform((s) => s.trim()),
  hours: z.number().positive().max(24),
  downs: z.number().min(0).max(1000),
  tokesCash: z.number().int().min(0).max(100000),
  notes: z.string().max(500).optional().nullable(),
});

export type ShiftUpdateInput = z.infer<typeof ShiftUpdateSchema>;

export function toPrismaUpdateData(input: ShiftUpdateInput) {
  const hours = roundQuarterUp(input.hours);
  const downs = Math.max(0, roundQuarterUp(input.downs));
  return {
    date: ymdToUtcDate(input.date),
    casino: input.casino.trim(),
    hours,
    downs,
    tokesCash: Math.max(0, Math.floor(input.tokesCash)),
    notes: input.notes?.trim() || null,
  };
}
