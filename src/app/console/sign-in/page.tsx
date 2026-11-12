'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ConsoleBrand from '@/components/console/ConsoleBrand';
import CodeInput from '@/components/console/CodeInput';
import { consoleApi, consoleSession, errorText } from '@/lib/console/api';

/** Team sign in: email and password, then the code from the authenticator (or a backup code). */
export default function ConsoleSignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [challenge, setChallenge] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [useBackup, setUseBackup] = useState(false);
  const [backup, setBackup] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    setExpired(new URLSearchParams(window.location.search).has('expired'));
    if (consoleSession.get()) router.replace('/console');
  }, [router]);

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { challenge: next } = await consoleApi.signIn(email.trim(), password);
      setChallenge(next);
      setPassword('');
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (value?: string) => {
    if (!challenge) return;
    setBusy(true);
    setError(null);
    try {
      const { token } = await consoleApi.verify(challenge, useBackup ? { backup_code: backup } : { code: value ?? code });
      consoleSession.set(token);
      router.replace('/console');
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(errorText(err));
      setCode('');
      if (status === 401 && errorText(err).startsWith('That took too long')) setChallenge(null);
    } finally {
      setBusy(false);
    }
  };

  const field = 'mt-1.5 h-12 w-full rounded-[12px] border border-[var(--hairline)] bg-white px-3.5 text-[16px] text-[var(--ink)] outline-none focus:border-[var(--ink)]';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-7">
        <ConsoleBrand size={26} />
      </div>
      <div className="w-full max-w-[400px] rounded-[24px] border border-[var(--hairline)] bg-[var(--card)] p-7">
        {!challenge ? (
          <form onSubmit={submitPassword}>
            <h1 className="text-[26px] font-bold tracking-[-0.035em]">Team sign in</h1>
            <p className="mt-1.5 text-[14.5px] leading-[1.45] text-[var(--muted)]">For the CirclePact team only. Your app account won&apos;t work here.</p>
            {expired && <p className="mt-3 rounded-[12px] bg-[var(--card-muted)] px-3 py-2 text-[13.5px] font-semibold">You were signed out. Sign in again.</p>}
            <label className="mt-5 block text-[13.5px] font-bold">
              Work email
              <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
            </label>
            <label className="mt-3.5 block text-[13.5px] font-bold">
              Password
              <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
            </label>
            {error && <p className="mt-3 text-[13.5px] font-semibold text-[#B3261E]" role="alert">{error}</p>}
            <button type="submit" disabled={busy} className="mt-5 h-[50px] w-full rounded-full bg-[var(--ink)] text-[16px] font-bold text-white disabled:opacity-50">
              {busy ? 'Checking…' : 'Continue'}
            </button>
            <p className="mt-3.5 text-center text-[13px] text-[var(--muted)]">Forgot your password? Ask the owner to send a new invite.</p>
          </form>
        ) : (
          <div>
            <button type="button" onClick={() => { setChallenge(null); setError(null); }} className="text-[13.5px] font-semibold text-[var(--muted)]">
              ← {email}
            </button>
            <h1 className="mt-3.5 text-[26px] font-bold tracking-[-0.035em]">{useBackup ? 'Use a backup code' : 'Enter your code'}</h1>
            <p className="mt-1.5 text-[14.5px] leading-[1.45] text-[var(--muted)]">
              {useBackup ? 'Type one of the backup codes you saved when you set up. Each works once.' : 'Open your authenticator app and type the 6-digit code for CirclePact Console.'}
            </p>
            <div className="mt-5">
              {useBackup ? (
                <input value={backup} onChange={(e) => setBackup(e.target.value)} placeholder="abcd-efgh" autoFocus aria-label="Backup code" className={`${field} font-mono tracking-[0.1em]`} />
              ) : (
                <CodeInput value={code} onChange={setCode} onComplete={(v) => void submitCode(v)} disabled={busy} />
              )}
            </div>
            {error && <p className="mt-3 text-[13.5px] font-semibold text-[#B3261E]" role="alert">{error}</p>}
            <button
              type="button"
              disabled={busy || (useBackup ? backup.trim().length < 8 : code.length !== 6)}
              onClick={() => void submitCode()}
              className="mt-5 h-[50px] w-full rounded-full bg-[var(--ink)] text-[16px] font-bold text-white disabled:opacity-40"
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
            <p className="mt-3.5 text-center text-[13px] text-[var(--muted)]">
              {useBackup ? (
                <button type="button" onClick={() => setUseBackup(false)} className="font-bold text-[var(--navy)]">Use the authenticator instead</button>
              ) : (
                <>
                  Lost your phone?{' '}
                  <button type="button" onClick={() => setUseBackup(true)} className="font-bold text-[var(--navy)]">Use a backup code</button>
                </>
              )}
            </p>
          </div>
        )}
      </div>
      <p className="mt-5 max-w-[400px] text-center text-[12.5px] leading-[1.5] text-[var(--muted)]">
        Every sign-in and every action here is recorded. After 5 wrong tries the account locks for 15 minutes.
      </p>
    </div>
  );
}
