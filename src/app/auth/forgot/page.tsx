'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthShell, { authInputClass, authLabelClass, authPrimaryButtonClass } from '@/components/AuthShell';
import { publicApi } from '@/services/publicApi';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await publicApi.post('/api/auth/password/forgot', { email: email.trim() });
      setSentTo(email.trim());
    } catch (error: any) {
      toast.error(error?.response?.status === 422 ? 'That email doesn’t look right' : 'Could not send the link. Try again.');
    } finally {
      setBusy(false);
    }
  };

  if (sentTo) {
    return (
      <AuthShell heading="Check your email">
        <div className="flex flex-col items-center text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-[var(--navy)] text-white">
            <MailCheck className="size-7" />
          </span>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--ink-soft)]">
            If <b className="text-[var(--ink)]">{sentTo}</b> has a CirclePact account, we’ve sent it a link to choose a new password. It works for 30 minutes.
          </p>
          <p className="mt-3 text-[13px] text-[var(--muted)]">Nothing there? Check spam, or try again in a minute.</p>
          <button type="button" onClick={() => setSentTo(null)} className="mt-5 text-[14px] font-semibold text-[var(--navy)] hover:underline">
            Use a different email
          </button>
        </div>
        <p className="mt-6 text-center text-[14px] text-[var(--muted)]">
          <Link href="/auth/login" className="font-semibold text-[var(--navy)] hover:underline">Back to sign in</Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell heading="Forgot your password?" subheading="Enter your email and we’ll send you a link to choose a new one.">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className={authLabelClass}>Email</label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={authInputClass} />
        </div>
        <button type="submit" disabled={busy} className={`${authPrimaryButtonClass} mt-1`}>
          {busy ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      <p className="mt-6 text-center text-[14px] text-[var(--muted)]">
        Remembered it?{' '}
        <Link href="/auth/login" className="font-semibold text-[var(--navy)] hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}
