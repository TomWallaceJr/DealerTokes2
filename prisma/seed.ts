import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randFloat(min: number, max: number, digits = 2) {
  const n = Math.random() * (max - min) + min;
  return Number(n.toFixed(digits));
}
function startOfISOWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();              // 0..6
  const delta = (day + 6) % 7;         // Monday=0
  x.setDate(x.getDate() - delta);
  return x;
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

function combineDateMinutes(dateOnly: Date, minutes: number) {
  const d = new Date(dateOnly);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(minutes);
  return d;
}

async function main() {
  // User
  const email = "example@example.com";
  const name = "Jon Doe";
  const passwordHash = await bcrypt.hash("Demo123!", 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash },
    create: { email, name, passwordHash },
  });

  // Clear existing shifts for idempotency
  await prisma.shift.deleteMany({ where: { userId: user.id } });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 365 * 2); // ~2 years

  const ROOMS = ["Wind Creek", "Mohegan"];
  const createdAt = new Date();
  const batch: Parameters<typeof prisma.shift.createMany>[0]["data"] = [];

  let cursor = new Date(start);
  while (cursor <= today) {
    const weekStart = startOfISOWeek(cursor);

    // All 7 days of this ISO week
    const weekDays: Date[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      d.setHours(0, 0, 0, 0);
      return d;
    });

    // Eligible indices (don’t go past today)
    const eligibleIdx = weekDays.map((_, i) => i).filter(i => weekDays[i] <= today);
    const pickCount = Math.min(5, eligibleIdx.length);

    // Pick 5 distinct days
    const picked = new Set<number>();
    while (picked.size < pickCount) picked.add(eligibleIdx[randInt(0, eligibleIdx.length - 1)]);

    for (const i of picked) {
      const day = weekDays[i];
      const dow = day.getDay(); // 0=Sun..6=Sat
      const isWeekend = dow === 0 || dow === 6;

      // Start time: day shift between 08:00 and 14:00, in 15-minute increments
      const startHour = randInt(8, 14);             // 8..14
      const startMinStep = randInt(0, 3) * 15;      // 0,15,30,45
      const startMinutes = startHour * 60 + startMinStep;

      // Hours worked: 1.00..10.00 (quarter-hour)
      const hoursQ = randInt(4, 40) / 4;            // 1.00..10.00
      const endMinutesRaw = startMinutes + Math.round(hoursQ * 60);
      const overnight = endMinutesRaw >= 24 * 60;
      const endMinutes = endMinutesRaw % (24 * 60);

      const clockIn = combineDateMinutes(day, startMinutes);
      const clockOut = combineDateMinutes(overnight ? new Date(day.getTime() + 86400000) : day, endMinutes);

      // Cash Downs ≈ 2 per hour
      const downs = Math.max(0, Math.round(hoursQ * 2));

      // Cash Tokes: $10..$500
      const tokesCash = randInt(10, 500);

      // Tournament only Tue/Wed/Thu
      let tournamentDowns = 0;
      let tournamentRatePerDown = 0;
      if (dow === 2 || dow === 3 || dow === 4) {
        tournamentDowns = randInt(1, 6);
        tournamentRatePerDown = randFloat(9.5, 25, 2);
      }

      // Hourly rate: 8.75 weekday, 9.25 weekend
      const hourlyRate = isWeekend ? 9.25 : 8.75;

      const casino = ROOMS[randInt(0, ROOMS.length - 1)];

      batch.push({
        userId: user.id,
        date: day, // stays the clock-in date
        casino,
        hours: hoursQ,
        tokesCash,
        downs,
        tournamentDowns,
        tournamentRatePerDown,
        hourlyRate,
        clockIn,
        clockOut,
        notes: null,
        createdAt,
        updatedAt: createdAt,
      });
    }

    // next week
    const nextWeek = new Date(weekStart);
    nextWeek.setDate(weekStart.getDate() + 7);
    cursor = nextWeek;
  }

  // Insert in chunks
  const chunk = 500;
  for (let i = 0; i < batch.length; i += chunk) {
    await prisma.shift.createMany({ data: batch.slice(i, i + chunk) });
  }

  console.log(`Seeded ${batch.length} shifts for ${name} <${email}> with day-shift times and 15-min steps.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
