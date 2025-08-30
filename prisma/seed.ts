import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const email = process.env.DEMO_EMAIL ?? "demo@dealertokes.local";
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Demo User", passwordHash: null },
  });

  const now = new Date();
  for (let i = 1; i <= 7; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    await prisma.shift.create({
      data: {
        userId: user.id,
        date,
        casino: i % 2 === 0 ? "Wind Creek" : "Palms",
        hours: 8,
        tokesCash: 200 + i * 10,
        downs: 16, // e.g., 30-min downs in an 8h shift
        notes: "Seed data",
      },
    });
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
