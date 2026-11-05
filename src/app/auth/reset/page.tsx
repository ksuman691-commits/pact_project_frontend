'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthShell, { authInputClass, authLabelClass, authPrimaryButtonClass } from '@/components/AuthShell';
import { publicApi } from '@/services/publicApi';

const MIN = 8;

export default function ResetPassword() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [state, setState] = useState<'checking' | 'ok' | 'bad'>('checking');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token') || '';
    setToken(t);
    if (!t) {
      setState('bad');
      return;
    }
    publicApi
      .get(`/api/auth/password/reset/${encodeURIComponent(t)}`)
      .then((r) => setState(r.data?.valid ? 'ok' : 'bad'))
      .catch(() => setState('ok')); // can't check right now; the submit will tell
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < MIN) {
      toast.error(`Use at least ${MIN} characters`);
      return;
    }
    setBusy(true);
    try {
      await publicApi.post('/api/auth/password/reset', { token, password });
      toast.success('Password changed. Sign in with your new password.');
      router.replace('/auth/login');
    } catch (error: any) {
      if (error?.response?.status === 400) setState('bad');
      else toast.error(error?.response?.data?.detail || 'Could not change your password. Try again.');
      setBusy(false);
    }
  };

  if (state === 'bad') {
    return (
      <AuthShell heading="This link has expired">
        <p className="text-center text-[15px] leading-relaxed text-[var(--ink-soft)]">
          Reset links work once, for 30 minutes. Ask for a new one and use the latest email.
        </p>
        <Link href="/auth/forgot" className={`${authPrimaryButtonClass} mt-5 flex items-center justify-center`}>
          Send a new link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell heading="Choose a new password" subheading="You’ll be signed out on your other devices.">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="password" className={authLabelClass}>New password</label>
          <div className="relative">
            <input
              id="password"
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={MIN}
              disabled={state === 'checking'}
              className={`${authInputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? 'Hide password' : 'Show password'}
              className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-[var(--muted)]"
            >
              {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
          <p className="mt-1.5 text-[12px] text-[var(--muted)]">At least {MIN} characters.</p>
        </div>
        <button type="submit" disabled={busy || state === 'checking'} className={`${authPrimaryButtonClass} mt-1`}>
          {busy ? 'Saving…' : 'Save new password'}
        </button>
      </form>
    </AuthShell>
  );
}
