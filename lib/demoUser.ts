import { prisma } from "./prisma";

export async function ensureDemoUser() {
  const email = process.env.DEMO_EMAIL ?? "demo@dealertokes.local";
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, name: "Demo User" },
    });
  }
  return user;
}
