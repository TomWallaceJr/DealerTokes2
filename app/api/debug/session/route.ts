// This canvas will always contain ONLY the files changed in the latest turn.
// Copy these files directly into your repo at the given paths.

// ============================================================================
// File: /app/api/debug/session/route.ts
// Purpose: Inspect NextAuth session (DEV ONLY). Returns minimal, non-sensitive fields.
// ============================================================================
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  // Disabled in production for safety
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const session = await getServerSession(authOptions);
    return NextResponse.json(
      {
        ok: true,
        authenticated: Boolean(session),
        user: session?.user
          ? {
              // Casting to any to avoid type friction if user.id is augmented
              id: (session.user as any)?.id ?? null,
              email: session.user.email ?? null,
              name: session.user.name ?? null,
            }
          : null,
        expires: session?.expires ?? null,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
