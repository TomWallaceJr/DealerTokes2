import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Distinct list of room names the user has used
  const rows = await prisma.shift.findMany({
    where: { userId: user.id },
    distinct: ["casino"],
    select: { casino: true },
    orderBy: { casino: "asc" },
  });

  const rooms = rows
    .map((r) => r.casino)
    .filter((v): v is string => !!v)
    .sort((a, b) => a.localeCompare(b));

  return NextResponse.json({ rooms });
}
