import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${process.env.APP_URL || req.nextUrl.origin}/api/auth/callback/google`;

  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json({ error: 'Missing GOOGLE_CLIENT_ID in environment variables' }, { status: 500 });
  }

  const scope = 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

  return NextResponse.redirect(url);
}
