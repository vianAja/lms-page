/**
 * CSRF handling note:
 * Route-level CSRF validation is enforced per handler using `withCsrf`
 * (for POST/PUT/PATCH/DELETE API handlers), not in this middleware.
 *
 * This middleware is intentionally limited to authentication and role checks.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function getBaseUrl(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') || request.nextUrl.host;
  // Note: x-forwarded-proto might be a list like "https,http" in some proxies, 
  // but usually it's just "https" from ngrok.
  const protoHeader = request.headers.get('x-forwarded-proto');
  const protocol = protoHeader ? protoHeader.split(',')[0] : request.nextUrl.protocol.replace(':', '');
  return `${protocol}://${host}`;
}

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('user_session');
  
  // Public paths
  if (
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/lab') ||
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  const baseUrl = getBaseUrl(request);

  // Not logged in redirect
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', baseUrl));
  }

  try {
    const session = JSON.parse(sessionCookie.value);
    
    // Protect dashboard route for admins only
    if (request.nextUrl.pathname.startsWith('/dashboard') && session.role !== 'admin') {
      return NextResponse.redirect(new URL('/403', baseUrl));
    }
  } catch {
    // Corrupted cookie
    return NextResponse.redirect(new URL('/login', baseUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
