/**
 * CSRF handling note:
 * Route-level CSRF validation is enforced per handler using `withCsrf`
 * (for POST/PUT/PATCH/DELETE API handlers), not in this middleware.
 *
 * This middleware is intentionally limited to authentication and role checks.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('user_session');
  
  // Public paths
  if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Not logged in redirect
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const session = JSON.parse(sessionCookie.value);
    
    // Protect dashboard route for admins only
    if (request.nextUrl.pathname.startsWith('/dashboard') && session.role !== 'admin') {
      return NextResponse.redirect(new URL('/lab/1-1', request.url));
    }
  } catch (error) {
    // Corrupted cookie
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
