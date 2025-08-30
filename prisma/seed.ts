import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const email = process.env.DEMO_EMAIL ?? "demo@dealertokes.local";
  let user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Demo User" },
  });

  const now = new Date();
  const days = [1,2,3,4,5,6,7];
  for (const i of days) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    await prisma.shift.create({
      data: {
        userId: user.id,
        date,
        casino: i % 2 === 0 ? "Wind Creek" : "Palms",
        hours: 8,
        tokesCash: 200 + i * 10,
        tokesCards: 50,
        tokesChips: 0,
        tokesOther: 0,
        notes: "Seed data",
      },
    });
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
