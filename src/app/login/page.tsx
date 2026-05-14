'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandMark, Icon } from '@/components/vn-ui';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const loadCsrfToken = async () => {
      try {
        const res = await fetch('/api/csrf');
        const data = await res.json();
        setCsrfToken(data.csrf_token || '');
      } catch {
        setError('Unable to initialize secure login. Refresh and try again.');
      }
    };

    loadCsrfToken();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
      });

      const data = await res.json();

      if (res.ok) {
        router.push(data.role === 'admin' ? '/dashboard' : '/');
        return;
      }

      setError(data.message || 'Invalid credentials. Check your username and password.');
    } catch {
      setError('Login failed. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid-pattern relative flex min-h-dvh items-center justify-center overflow-hidden bg-surface-container-lowest px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.15),transparent_32%)] blur-[100px]" />
      <div className="relative z-10 w-full max-w-[420px] rounded-lg border border-outline-variant border-t-2 border-t-primary-container bg-surface-container-low p-8 shadow-2xl shadow-black/60">
        <div className="space-y-5">
          <div className="space-y-4">
            <BrandMark />
            <div className="h-px bg-outline-variant" />
          </div>

          <div className="space-y-2">
            <h1 className="font-headline text-headline-md text-on-surface">Welcome back</h1>
            <p className="text-body-md text-on-surface-variant">Sign in to access your lab environment</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-label-caps text-on-surface-variant" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your-username"
                className={`field font-code ${error ? 'border-error' : ''}`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-label-caps text-on-surface-variant" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`field font-code ${error ? 'border-error' : ''}`}
              />
            </div>

            {error ? (
              <p role="alert" aria-live="assertive" className="flex items-center gap-2 text-body-sm text-error">
                <span className="h-2 w-2 rounded-full bg-error" />
                {error}
              </p>
            ) : null}

            <button type="submit" disabled={isSubmitting} className="button-primary w-full">
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Signing In
                </>
              ) : (
                <>
                  Sign In
                  <Icon name="arrow_forward" className="text-[18px]" />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-on-surface-variant">
            <Icon name="lock" className="text-[14px]" />
            Secure login • Session expires in 8 hours
          </div>
        </div>
      </div>
    </main>
  );
}
