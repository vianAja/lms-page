import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCsrfFromRequest, validateCsrfToken } from '@/lib/csrf';

type RouteHandler = (request: Request, context?: unknown) => Response | Promise<Response>;

const CSRF_PROTECTED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function invalidCsrfResponse() {
  return NextResponse.json({ message: 'Invalid CSRF token' }, { status: 403 });
}

export function withCsrf(handler: RouteHandler): RouteHandler {
  return async (request: Request, context?: unknown) => {
    if (!CSRF_PROTECTED_METHODS.has(request.method.toUpperCase())) {
      return handler(request, context);
    }

    const headerToken = getCsrfFromRequest(request);
    if (!headerToken) {
      return invalidCsrfResponse();
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('user_session');
    if (!sessionCookie?.value) {
      return invalidCsrfResponse();
    }

    let username: string | null = null;

    try {
      const parsed = JSON.parse(sessionCookie.value) as { username?: unknown };
      if (typeof parsed.username === 'string' && parsed.username.trim().length > 0) {
        username = parsed.username;
      }
    } catch {
      return invalidCsrfResponse();
    }

    if (!username) {
      return invalidCsrfResponse();
    }

    const isValid = await validateCsrfToken(username, headerToken);
    if (!isValid) {
      return invalidCsrfResponse();
    }

    return handler(request, context);
  };
}
