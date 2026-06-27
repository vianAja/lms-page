'use client';

function readMetaToken(): string {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

function writeMetaToken(token: string) {
  let meta = document.querySelector('meta[name="csrf-token"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'csrf-token');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', token);
}

export async function refreshCsrfToken(): Promise<string> {
  const response = await fetch('/api/csrf', { credentials: 'same-origin' });
  if (!response.ok) return '';

  const payload = (await response.json().catch(() => ({}))) as { csrf_token?: string };
  const token = payload.csrf_token || '';
  if (token) {
    writeMetaToken(token);
  }
  return token;
}

export function resolveCsrfToken(fallbackToken = ''): string {
  return readMetaToken() || fallbackToken;
}

export async function csrfFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  fallbackToken = ''
): Promise<Response> {
  const method = (init.method || 'GET').toUpperCase();
  const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  const requestWithToken = async (token: string) => {
    const headers = new Headers(init.headers || {});
    if (needsCsrf && token) {
      headers.set('X-CSRF-Token', token);
    }
    return fetch(input, { ...init, headers, credentials: 'same-origin' });
  };

  const firstToken = resolveCsrfToken(fallbackToken);
  let response = await requestWithToken(firstToken);

  if (response.status !== 403 || !needsCsrf) {
    return response;
  }

  const payload = (await response.clone().json().catch(() => ({}))) as { message?: string };
  if (payload.message !== 'Invalid CSRF token') {
    return response;
  }

  const freshToken = await refreshCsrfToken();
  if (!freshToken) {
    return response;
  }

  response = await requestWithToken(freshToken);
  return response;
}
