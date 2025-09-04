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
  const email = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? 'example@example.com';
  const name = 'Demo User';
  const passwordRaw = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? 'Demo123!';
  const passwordHash = await bcrypt.hash(passwordRaw, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash },
    create: { email, name, passwordHash },
  });

  // idempotent for demo user
  await prisma.shift.deleteMany({ where: { userId: user.id } });

  const todayUTC = utcMidnight(new Date());
  // Seed last 10 years for richer demo data
  const startUTC = addDaysUTC(todayUTC, -365 * 10);

  const ROOMS = ['Wind Creek', 'Mohegan'];
  const createdAt = new Date();

  // ✅ Type batch explicitly for Prisma v6
  const batch: Prisma.ShiftCreateManyInput[] = [];

  // Hourly rate periods within the 10-year range
  const p1End = addDaysUTC(startUTC, 365 * 3); // first 3 years
  const p2End = addDaysUTC(p1End, 365 * 3); // next 3 years

  for (let cursor = startUTC; cursor <= todayUTC; ) {
    const weekStart = startOfISOWeekUTC(cursor);
    const weekDays: Date[] = Array.from({ length: 7 }, (_, i) => addDaysUTC(weekStart, i));
    const eligibleIdx = weekDays.map((_, i) => i).filter((i) => weekDays[i] <= todayUTC);
    const pickCount = Math.min(5, eligibleIdx.length);
    const picked = new Set<number>();
    while (picked.size < pickCount) picked.add(eligibleIdx[randInt(0, eligibleIdx.length - 1)]);

    // Choose up to 3 tournament days within this week's picked shifts
    const pickedArr = Array.from(picked);
    const tourSet = new Set<number>();
    const tourGoal = Math.min(3, pickedArr.length);
    while (tourSet.size < tourGoal) {
      const idx = pickedArr[randInt(0, pickedArr.length - 1)];
      tourSet.add(idx);
    }

    for (const i of picked) {
      const dayUTC = weekDays[i]; // UTC midnight
      const hoursQ = randQuarter(2, 12); // 2.00..12.00 in 0.25 steps

      // Downs constraints: 1 down = 0.5h, so total downs <= floor(hours * 2)
      const maxDownsAllowed = Math.floor(hoursQ * 2);
      const isTourneyDay = tourSet.has(i);

      // Cash downs: Non-tourney days => 1 or 2 per hour. Tourney days => fewer (1 per hour).
      const nonTourneyCashRatio = Math.random() < 0.5 ? 1 : 2; // 1x or 2x per hour
      const desiredCash = Math.max(1, Math.floor(hoursQ * (isTourneyDay ? 1 : nonTourneyCashRatio)));

      // Tournament downs 1..5 on tourney days, else 0; ensure totals fit hours cap and cash >= 1
      let tournamentDowns = 0;
      if (isTourneyDay && maxDownsAllowed >= 2) {
        const maxTourney = Math.min(5, Math.max(1, maxDownsAllowed - 1));
        tournamentDowns = randInt(1, maxTourney);
      }

      // Fit cash downs under remaining capacity
      const remainingForCash = Math.max(1, maxDownsAllowed - tournamentDowns);
      const downs = Math.max(1, Math.min(desiredCash, remainingForCash));

      const tournamentRate = tournamentDowns > 0
        ? Math.round((12 + Math.random() * (16 - 12)) * 100) / 100 // ~$14 average ($12..$16)
        : 0;

      // Cashout targets $10..$40 per cash down (average around mid-20s)
      const cashPerDown = randInt(10, 40);
      const tokesCash = Math.max(0, Math.floor(downs * cashPerDown)); // whole dollars
      const casino = ROOMS[randInt(0, ROOMS.length - 1)];
      const hourlyRate = dayUTC < p1End ? 8.75 : dayUTC < p2End ? 9.0 : 9.25;

      batch.push({
        userId: user.id,
        date: dayUTC,
        casino,
        hours: hoursQ,
        hourlyRate,
        tokesCash,
        downs,
        tournamentDowns,
        tournamentRate,
        jackpotTips: 0,
        notes: null,
        createdAt,
        updatedAt: createdAt,
      });
    }

    cursor = addDaysUTC(weekStart, 7);
  }

  // Inject 4 jackpot tips: one big ($5,600) sometime last month, and three random $1,000–$3,000
  try {
    const now = new Date();
    const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const thisMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const lastMonthIdx = batch
      .map((b, idx) => ({ idx, date: b.date as Date }))
      .filter((x) => x.date >= lastMonthStart && x.date < thisMonthStart)
      .map((x) => x.idx);

    if (lastMonthIdx.length) {
      const i = lastMonthIdx[randInt(0, lastMonthIdx.length - 1)];
      batch[i].jackpotTips = 5600;
    }

    // three more random jackpots (avoid reusing the last-month pick if any)
    const used = new Set<number>();
    batch.forEach((b, i) => {
      if (b.jackpotTips && b.jackpotTips > 0) used.add(i);
    });
    const needed = 3;
    let attempts = 0;
    while (used.size < (lastMonthIdx.length ? 1 : 0) + needed && attempts < batch.length * 2) {
      const i = randInt(0, batch.length - 1);
      if (!used.has(i)) {
        used.add(i);
        batch[i].jackpotTips = randInt(1000, 3000);
      }
      attempts++;
    }
  } catch {}

  // Insert in chunks
  const chunk = 500;
  for (let i = 0; i < batch.length; i += chunk) {
    await prisma.shift.createMany({
      data: batch.slice(i, i + chunk),
      // skipDuplicates: true, // optional; your seed deletes first, so not needed
    });
  }

  const jackpots = batch.filter((b) => (b as any).jackpotTips && (b as any).jackpotTips! > 0).length;
  console.log(`Seeded ${batch.length} shifts (${jackpots} jackpots) for ${name} <${email}>.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
