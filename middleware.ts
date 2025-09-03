// middleware.ts
// Purpose: Set basic security headers on all responses in production.
import { NextResponse, type NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  if (process.env.NODE_ENV === 'production') {
    // Strict transport security (only over HTTPS in production)
    res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    // Mitigate MIME sniffing
    res.headers.set('X-Content-Type-Options', 'nosniff');
    // Clickjacking protection
    res.headers.set('X-Frame-Options', 'DENY');
    // Referrer policy
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Limit powerful features by default
    res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // A conservative default CSP. Tune as needed if you add external scripts.
    // Note: Using a relaxed style-src to accommodate Tailwind and Next <style> tags.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');
    res.headers.set('Content-Security-Policy', csp);
  }

  return res;
}

// Match all routes (static files are fine)
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

