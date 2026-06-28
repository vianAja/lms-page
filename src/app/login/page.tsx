'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BrandMark, Icon } from '@/components/vn-ui';

function LoginForm() {
  const [error, setError] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const ssoError = searchParams.get('error');
    if (ssoError === 'UnauthorizedEmail') {
      setError('Access Denied: Your Google account is not authorized.');
    } else if (ssoError) {
      setError(`Authentication Error: ${ssoError}`);
    }
  }, [searchParams]);

  return (
    <main
      className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10"
      style={{ background: '#F1F7D4' }}
    >
      {/* Subtle grid background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(159,203,173,0.20) 1px, transparent 1px),
            linear-gradient(90deg, rgba(159,203,173,0.20) 1px, transparent 1px)
          `,
          backgroundSize: '28px 28px',
        }}
      />

      {/* Radial gradient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(110,173,188,0.12), transparent)',
        }}
      />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-[420px] space-y-6 rounded-2xl p-8"
        style={{
          background: '#ffffff',
          border: '1px solid #c8dfc9',
          borderTop: '3px solid #4A4466',
          boxShadow: '0 4px 40px rgba(74,68,102,0.12), 0 1px 8px rgba(74,68,102,0.06)',
        }}
      >
        {/* Logo + divider */}
        <div className="space-y-4">
          <BrandMark />
          <div className="h-px" style={{ background: '#c8dfc9' }} />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1
            className="font-headline text-xl font-bold"
            style={{ color: '#4A4466' }}
          >
            Welcome back
          </h1>
          <p
            className="text-sm"
            style={{ color: 'rgba(74,68,102,0.65)' }}
          >
            Sign in to access your lab environment
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div
            className="flex items-start gap-2 rounded-lg px-4 py-3 text-sm"
            style={{
              background: 'rgba(176,64,64,0.08)',
              border: '1px solid rgba(176,64,64,0.25)',
              color: '#b04040',
            }}
            role="alert"
            aria-live="assertive"
          >
            <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full" style={{ background: '#b04040' }} />
            {error}
          </div>
        )}

        {/* Google SSO button */}
        <a
          href="/api/auth/google"
          className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold transition-all"
          style={{
            background: '#4A4466',
            color: '#F1F7D4',
            border: '1px solid #4A4466',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.background = '#5c5580';
            el.style.borderColor = '#5c5580';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.background = '#4A4466';
            el.style.borderColor = '#4A4466';
          }}
        >
          {/* Google "G" icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#F1F7D4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#9FCBAD" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#6EADBC" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#e8c86a" />
          </svg>
          Sign in with Google
        </a>

        {/* Footer note */}
        <div
          className="flex items-center gap-2 text-[11px] uppercase tracking-[0.10em]"
          style={{ color: 'rgba(74,68,102,0.45)' }}
        >
          <Icon name="lock" className="text-[13px]" />
          Secure login · Session expires in 8 hours
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
