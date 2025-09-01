// prisma/seed.ts
import { Prisma, PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randQuarter(minHours: number, maxHours: number) {
  const qMin = Math.round(minHours * 4);
  const qMax = Math.round(maxHours * 4);
  return Math.round(randInt(qMin, qMax)) / 4; // quarter increments
}
function utcMidnight(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function addDaysUTC(d: Date, days: number) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + days));
}
function startOfISOWeekUTC(d: Date) {
  const x = utcMidnight(d);
  const day = x.getUTCDay(); // 0..6
  const delta = (day + 6) % 7; // Monday=0
  return addDaysUTC(x, -delta);
}

async function main() {
  const email = 'example@example.com';
  const name = 'Jon Doe';
  const passwordHash = await bcrypt.hash('Demo123!', 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash },
    create: { email, name, passwordHash },
  });

  // idempotent for demo user
  await prisma.shift.deleteMany({ where: { userId: user.id } });

  const todayUTC = utcMidnight(new Date());
  const startUTC = addDaysUTC(todayUTC, -365 * 2);

  const ROOMS = ['Wind Creek', 'Mohegan'];
  const createdAt = new Date();

  // ✅ Type batch explicitly for Prisma v6
  const batch: Prisma.ShiftCreateManyInput[] = [];

  for (let cursor = startUTC; cursor <= todayUTC; ) {
    const weekStart = startOfISOWeekUTC(cursor);
    const weekDays: Date[] = Array.from({ length: 7 }, (_, i) => addDaysUTC(weekStart, i));
    const eligibleIdx = weekDays.map((_, i) => i).filter((i) => weekDays[i] <= todayUTC);
    const pickCount = Math.min(5, eligibleIdx.length);
    const picked = new Set<number>();
    while (picked.size < pickCount) picked.add(eligibleIdx[randInt(0, eligibleIdx.length - 1)]);

    for (const i of picked) {
      const dayUTC = weekDays[i]; // UTC midnight
      const hoursQ = randQuarter(1, 10); // 1.00..10.00 in 0.25 steps
      const downs = Math.max(0, Math.round(hoursQ * 2));
      const tokesCash = randInt(10, 500); // whole dollars
      const casino = ROOMS[randInt(0, ROOMS.length - 1)];

      batch.push({
        userId: user.id,
        date: dayUTC,
        casino,
        hours: hoursQ,
        tokesCash,
        downs,
        notes: null,
        createdAt,
        updatedAt: createdAt,
      });
    }

    cursor = addDaysUTC(weekStart, 7);
  }

  // Insert in chunks
  const chunk = 500;
  for (let i = 0; i < batch.length; i += chunk) {
    await prisma.shift.createMany({
      data: batch.slice(i, i + chunk),
      // skipDuplicates: true, // optional; your seed deletes first, so not needed
    });
  }

  console.log(`Seeded ${batch.length} hours-only shifts for ${name} <${email}>.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
