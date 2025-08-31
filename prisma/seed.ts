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
  const day = x.getDay(); // 0=Sun..6=Sat
  const delta = (day + 6) % 7; // Monday=0
  x.setDate(x.getDate() - delta);
  return x;
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

async function main() {
  // --- Example user (Jon Doe) with password Demo123! ---
  const email = "example@example.com";
  const name = "Jon Doe";
  const passwordHash = await bcrypt.hash("Demo123!", 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash },
    create: { email, name, passwordHash },
  });

  // Clear previous shifts for idempotent seeding
  await prisma.shift.deleteMany({ where: { userId: user.id } });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 365 * 2); // ~2 years back

  const ROOMS = ["Wind Creek", "Palms", "Borgata", "Bellagio", "Red Rock", "Aria"];
  const data: Array<Parameters<typeof prisma.shift.createMany>[0]["data"][number]> = [];
  const createdAt = new Date();

  // Walk week-by-week; pick 5 random workdays per full week (partial current week uses days up to today)
  let cursor = new Date(start);
  while (cursor <= today) {
    const weekStart = startOfISOWeek(cursor);

    const weekDays: Date[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      d.setHours(0, 0, 0, 0);
      return d;
    });

    // Eligible days for this week (don’t go past today)
    const eligibleIdx = weekDays.map((_, i) => i).filter(i => weekDays[i] <= today);
    const pickCount = Math.min(5, eligibleIdx.length);

    // Choose distinct indices for workdays
    const picked = new Set<number>();
    while (picked.size < pickCount) {
      picked.add(eligibleIdx[randInt(0, eligibleIdx.length - 1)]);
    }

    for (const i of picked) {
      const d = weekDays[i];
      const dow = d.getDay(); // 0=Sun,6=Sat
      const isWeekend = dow === 0 || dow === 6;

      // Hours Worked: 1.00..10.00 in quarter-hour increments
      const hours = randInt(4, 40) / 4;

      // Cash Downs: ~ two 30-min downs per hour
      const downs = Math.max(0, Math.round(hours * 2));

      // Cash Tokes: $10..$500 (integer)
      const tokesCash = randInt(10, 500);

      // Tournament: only Tue/Wed/Thu (2/3/4)
      let tournamentDowns = 0;
      let tournamentRatePerDown = 0;
      if (dow === 2 || dow === 3 || dow === 4) {
        tournamentDowns = randInt(1, 6);
        tournamentRatePerDown = randFloat(9.5, 25, 2);
      }

      // Hourly rate: 8.75 weekday, 9.25 weekends
      const hourlyRate = isWeekend ? 9.25 : 8.75;

      const casino = ROOMS[randInt(0, ROOMS.length - 1)];

      data.push({
        userId: user.id,
        date: d,
        casino,
        hours,
        tokesCash,
        downs,
        tournamentDowns,
        tournamentRatePerDown,
        hourlyRate,
        notes: null,
        createdAt,
        updatedAt: createdAt,
      });
    }

    // Next week
    const nextWeek = new Date(weekStart);
    nextWeek.setDate(weekStart.getDate() + 7);
    cursor = nextWeek;
  }

  // Insert in chunks
  const chunkSize = 500;
  for (let i = 0; i < data.length; i += chunkSize) {
    await prisma.shift.createMany({ data: data.slice(i, i + chunkSize) });
  }

  console.log(`Seeded ${data.length} shifts for ${name} <${email}>`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
