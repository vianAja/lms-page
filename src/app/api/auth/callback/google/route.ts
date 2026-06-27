import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateCsrfToken, storeCsrfToken } from '@/lib/csrf';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (!code) {
    return NextResponse.redirect(new URL('/login?error=NoCode', request.url));
  }

  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://unfretting-hintingly-susy.ngrok-free.dev/api/auth/callback/google';

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
      return NextResponse.redirect(new URL('/login?error=TokenFailed', request.url));
    }

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userResponse.json();
    const email = userData.email;

    // Strict access control: only najwanoctavian@gmail.com is allowed
    if (!email || email !== 'najwanoctavian@gmail.com') {
      return NextResponse.redirect(new URL('/login?error=UnauthorizedEmail', request.url));
    }

    // Map this specific user to the admin account
    const result = await db.query('SELECT * FROM users WHERE username = $1', ['admin']);
    const user = result.rows[0];

    if (!user) {
      return NextResponse.redirect(new URL('/login?error=AdminUserNotFound', request.url));
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
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('SSO Error:', error);
    return NextResponse.redirect(new URL('/login?error=ServerError', request.url));
  }
}
