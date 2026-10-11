'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@needit/ui';
import { useAuth } from '@/components/auth-provider';
import { api } from '@/lib/api';
import type { AuthTokens } from '@/lib/types';

type Mode = 'phone' | 'email';

export default function LoginPage() {
  const router = useRouter();
  const { user, signIn } = useAuth();
  const [next, setNext] = useState('/');
  const [mode, setMode] = useState<Mode>('phone');

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignup, setIsSignup] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get('next');
    if (n && n.startsWith('/')) setNext(n);
  }, []);

  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next, router]);

  async function complete(tokens: AuthTokens) {
    await signIn(tokens);
    router.replace(next);
  }

  async function sendOtp() {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await api('/auth/request-otp', { method: 'POST', body: { phone } });
      setOtpSent(true);
      setInfo('Code sent. In development, check the API console for the OTP.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send code');
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    setBusy(true);
    setError(null);
    try {
      const tokens = await api<AuthTokens>('/auth/verify-otp', {
        method: 'POST',
        body: { phone, code },
      });
      await complete(tokens);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code');
      setBusy(false);
    }
  }

  async function submitEmail() {
    setBusy(true);
    setError(null);
    try {
      const tokens = isSignup
        ? await api<AuthTokens>('/auth/signup', {
            method: 'POST',
            body: { email, password, displayName: displayName || undefined },
          })
        : await api<AuthTokens>('/auth/login', { method: 'POST', body: { email, password } });
      await complete(tokens);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in');
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <div className="card auth-card">
        <h1 className="text-title-lg" style={{ marginTop: 0 }}>
          Welcome to NeedIt
        </h1>
        <p className="hint">Sign in to submit needs, save favourites, and contact providers.</p>

        <div className="auth-switch">
          <Button variant={mode === 'phone' ? 'primary' : 'ghost'} size="sm" onClick={() => setMode('phone')}>
            Phone
          </Button>
          <Button variant={mode === 'email' ? 'primary' : 'ghost'} size="sm" onClick={() => setMode('email')}>
            Email
          </Button>
        </div>

        {mode === 'phone' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void (otpSent ? verifyOtp() : sendOtp());
            }}
          >
            <div className="field">
              <label htmlFor="phone">Phone number</label>
              <input
                id="phone"
                className="input"
                inputMode="tel"
                placeholder="+2348012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={otpSent}
              />
            </div>
            {otpSent ? (
              <div className="field">
                <label htmlFor="code">6-digit code</label>
                <input
                  id="code"
                  className="input"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
            ) : null}
            {info ? <p className="hint">{info}</p> : null}
            <Button type="submit" block disabled={busy || !phone} style={{ marginTop: 6 }}>
              {busy ? 'Please wait...' : otpSent ? 'Verify & continue' : 'Send code'}
            </Button>
            {otpSent ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ marginTop: 8, width: '100%' }}
                onClick={() => {
                  setOtpSent(false);
                  setCode('');
                }}
              >
                Use a different number
              </button>
            ) : null}
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitEmail();
            }}
          >
            {isSignup ? (
              <div className="field">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  className="input"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            ) : null}
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                className="input"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" block disabled={busy || !email || password.length < 6} style={{ marginTop: 6 }}>
              {busy ? 'Please wait...' : isSignup ? 'Create account' : 'Sign in'}
            </Button>
          </form>
        )}

        {error ? <p className="error-msg" style={{ marginTop: 10 }}>{error}</p> : null}

        {mode === 'email' ? (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 12, width: '100%' }}
            onClick={() => {
              setIsSignup((v) => !v);
              setError(null);
            }}
          >
            {isSignup ? 'Already have an account? Sign in' : 'New here? Create an account'}
          </button>
        ) : null}
      </div>
    </main>
  );
}
