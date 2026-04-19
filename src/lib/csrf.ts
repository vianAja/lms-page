import crypto from 'node:crypto';
import { db } from '@/lib/db';

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function storeCsrfToken(username: string, token: string): Promise<void> {
  await db.query(
    `
      INSERT INTO csrf_tokens (username, token, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '8 hours')
      ON CONFLICT (username)
      DO UPDATE SET
        token = EXCLUDED.token,
        expires_at = EXCLUDED.expires_at
    `,
    [username, token]
  );
}

export async function validateCsrfToken(username: string, token: string): Promise<boolean> {
  const result = await db.query(
    `
      SELECT 1
      FROM csrf_tokens
      WHERE username = $1
        AND token = $2
        AND expires_at > NOW()
      LIMIT 1
    `,
    [username, token]
  );

  return result.rowCount > 0;
}

export function getCsrfFromRequest(request: Request): string | null {
  return request.headers.get('X-CSRF-Token');
}
