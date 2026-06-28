import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateCsrfToken, storeCsrfToken } from '@/lib/csrf';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const reqUrl = new URL(request.url);
  const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${reqUrl.origin}/api/auth/callback/google`;
  const baseUrl = reqUrl.origin;

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=NoCode', baseUrl));
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      console.error('Google token exchange failed:', tokenData);
      return NextResponse.redirect(new URL('/login?error=TokenFailed', baseUrl));
    }

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userResponse.json();
    const email = userData.email;

    // Strict access control: only najwanoctavian@gmail.com is allowed
    if (!email || email !== 'najwanoctavian@gmail.com') {
      return NextResponse.redirect(new URL('/login?error=UnauthorizedEmail', baseUrl));
    }

    // Map this specific user to the admin account
    const result = await db.query('SELECT * FROM users WHERE username = $1', ['admin']);
    const user = result.rows[0];

    if (!user) {
      return NextResponse.redirect(new URL('/login?error=AdminUserNotFound', baseUrl));
    }

    const csrfToken = generateCsrfToken();
    await storeCsrfToken(user.username, csrfToken);

    const cookieStore = await cookies();
    cookieStore.set('user_session', JSON.stringify({ 
      id: user.id, 
      username: user.username, 
      fullname: user.fullname,
      role: user.role,
      csrf_token: csrfToken
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    return NextResponse.redirect(new URL('/', baseUrl));
  } catch (error) {
    console.error('SSO Error:', error);
    return NextResponse.redirect(new URL('/login?error=ServerError', baseUrl));
  }
}
