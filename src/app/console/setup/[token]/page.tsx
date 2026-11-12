'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import ConsoleBrand from '@/components/console/ConsoleBrand';
import CodeInput from '@/components/console/CodeInput';
import { ROLE_LABEL } from '@/components/console/ConsoleFrame';
import { consoleApi, consoleSession, errorText, type TeamRole } from '@/lib/console/api';

type Step = 'password' | 'authenticator' | 'backup';

/**
 * Opened from an invite link: set a password, connect an authenticator app,
 * then save the backup codes (shown only this once).
 */
export default function ConsoleSetup() {
  const router = useRouter();
  const { token } = useParams<{ token: string }>();
  const [info, setInfo] = useState<{ name: string; email: string; role: TeamRole } | null>(null);
  const [dead, setDead] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('password');
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [secret, setSecret] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [code, setCode] = useState('');
  const [codes, setCodes] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    consoleApi
      .setupInfo(token)
      .then(setInfo)
      .catch((err) => setDead(errorText(err, 'This link has expired or was already used. Ask the owner for a new one.')));
  }, [token]);

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== again) {
      setError("The two passwords don't match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const started = await consoleApi.setupPassword(token, password);
      setSecret(started.secret);
      setQr(await QRCode.toDataURL(started.otpauth_uri, { margin: 1, width: 400, color: { dark: '#17181D', light: '#FFFFFF' } }));
      setStep('authenticator');
      setPassword('');
      setAgain('');
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (value?: string) => {
    setBusy(true);
    setError(null);
    try {
      const done = await consoleApi.setupAuthenticator(token, value ?? code);
      consoleSession.set(done.token);
      setCodes(done.backup_codes);
      setStep('backup');
    } catch (err) {
      setError(errorText(err));
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    const text = `CirclePact Console backup codes for ${info?.email}\nEach code works once.\n\n${codes.join('\n')}\n`;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'circlepact-console-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
    setSaved(true);
  };

  const field = 'mt-1.5 h-12 w-full rounded-[12px] border border-[var(--hairline)] bg-white px-3.5 text-[16px] text-[var(--ink)] outline-none focus:border-[var(--ink)]';
  const steps: { id: Step; label: string }[] = [
    { id: 'password', label: '1 · Set a password' },
    { id: 'authenticator', label: '2 · Connect your authenticator' },
    { id: 'backup', label: '3 · Save backup codes' },
  ];
  const at = steps.findIndex((s) => s.id === step);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[720px]">
        <ConsoleBrand size={22} />
        {dead ? (
          <div className="mt-6 rounded-[24px] border border-[var(--hairline)] bg-[var(--card)] p-7">
            <h1 className="text-[24px] font-bold tracking-[-0.035em]">This link doesn&apos;t work any more</h1>
            <p className="mt-2 text-[15px] text-[var(--muted)]">{dead}</p>
          </div>
        ) : !info ? (
          <div className="mt-6 h-[320px] rounded-[24px] pact-shimmer" aria-busy="true" />
        ) : (
          <>
            <ol className="mt-6 grid grid-cols-3 gap-2" aria-label="Setup steps">
              {steps.map((s, i) => (
                <li key={s.id} className="flex flex-col gap-1.5" aria-current={i === at ? 'step' : undefined}>
                  <span className="h-1 rounded-full" style={{ background: i <= at ? 'var(--ink)' : 'var(--hairline)' }} />
                  <span className={`text-[13px] ${i === at ? 'font-bold' : 'font-semibold text-[var(--muted)]'}`}>{s.label}</span>
                </li>
              ))}
            </ol>

            <section className="mt-4 rounded-[24px] border border-[var(--hairline)] bg-[var(--card)] p-7">
              {step === 'password' && (
                <form onSubmit={savePassword} className="max-w-[400px]">
                  <h1 className="text-[26px] font-bold tracking-[-0.035em]">Welcome, {info.name.split(' ')[0]}</h1>
                  <p className="mt-1.5 text-[14.5px] leading-[1.5] text-[var(--muted)]">
                    Set a password for <b className="text-[var(--ink)]">{info.email}</b>. Use at least 12 characters; a few words strung together works well.
                  </p>
                  <input type="email" value={info.email} autoComplete="username" readOnly hidden />
                  <label className="mt-5 block text-[13.5px] font-bold">
                    New password
                    <input type="password" autoComplete="new-password" required minLength={12} value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
                  </label>
                  <label className="mt-3.5 block text-[13.5px] font-bold">
                    Type it again
                    <input type="password" autoComplete="new-password" required value={again} onChange={(e) => setAgain(e.target.value)} className={field} />
                  </label>
                  {error && <p className="mt-3 text-[13.5px] font-semibold text-[#B3261E]" role="alert">{error}</p>}
                  <button type="submit" disabled={busy || password.length < 12} className="mt-5 h-12 rounded-full bg-[var(--ink)] px-6 text-[15px] font-bold text-white disabled:opacity-40">
                    {busy ? 'Saving…' : 'Continue'}
                  </button>
                </form>
              )}

              {step === 'authenticator' && (
                <div className="flex flex-wrap items-start gap-7">
                  <div className="min-w-0 flex-[1_1_280px]">
                    <h1 className="text-[26px] font-bold tracking-[-0.035em]">Connect your authenticator</h1>
                    <p className="mt-2 text-[14.5px] leading-[1.5] text-[var(--muted)]">
                      You&apos;ll need a code from it every time you sign in. Use Google Authenticator, Microsoft Authenticator or Authy on your phone.
                    </p>
                    <ol className="mt-4 list-decimal space-y-1 pl-5 text-[15px]">
                      <li>Open the app and tap <b>Add</b> or <b>+</b>.</li>
                      <li>Scan the code{' '}<span className="hidden sm:inline">on the right</span><span className="sm:hidden">below</span>.</li>
                      <li>Type the 6-digit code it shows.</li>
                    </ol>
                    <div className="mt-5 max-w-[360px]">
                      <CodeInput value={code} onChange={setCode} onComplete={(v) => void confirm(v)} disabled={busy} label="Code from your app" />
                    </div>
                    {error && <p className="mt-3 text-[13.5px] font-semibold text-[#B3261E]" role="alert">{error}</p>}
                    <button type="button" disabled={busy || code.length !== 6} onClick={() => void confirm()} className="mt-5 h-12 rounded-full bg-[var(--ink)] px-6 text-[15px] font-bold text-white disabled:opacity-40">
                      {busy ? 'Checking…' : 'Confirm'}
                    </button>
                  </div>
                  <div className="flex flex-[0_0_220px] flex-col items-center gap-2.5">
                    {qr && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qr} alt="QR code to add CirclePact Console to your authenticator app" width={200} height={200} className="rounded-[16px] border border-[var(--hairline)] bg-white p-2.5" />
                    )}
                    {showKey ? (
                      <code className="break-all rounded-[10px] bg-white px-3 py-2 text-center font-mono text-[13px] tracking-[0.08em]">{secret?.match(/.{1,4}/g)?.join(' ')}</code>
                    ) : (
                      <button type="button" onClick={() => setShowKey(true)} className="h-9 rounded-full border border-[var(--hairline)] px-3 text-[13px] font-semibold">
                        Can&apos;t scan? Show the key
                      </button>
                    )}
                  </div>
                </div>
              )}

              {step === 'backup' && (
                <div>
                  <h1 className="text-[26px] font-bold tracking-[-0.035em]">Save your backup codes</h1>
                  <p className="mt-2 max-w-[520px] text-[14.5px] leading-[1.5] text-[var(--muted)]">
                    If you lose your phone, each of these gets you in once. Keep them somewhere safe, like a password manager. You won&apos;t see them again.
                  </p>
                  <ul className="mt-5 grid max-w-[420px] grid-cols-2 gap-2 font-mono text-[16px] tracking-[0.06em]">
                    {codes.map((c) => (
                      <li key={c} className="rounded-[10px] bg-white px-3 py-2 text-center">{c}</li>
                    ))}
                  </ul>
                  <div className="mt-5 flex flex-wrap gap-2.5">
                    <button type="button" onClick={download} className="h-12 rounded-full border-[1.5px] border-[var(--ink)] px-5 text-[15px] font-bold">
                      Download as a file
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(codes.join('\n'));
                          setSaved(true);
                        } catch {
                          /* the download still works */
                        }
                      }}
                      className="h-12 rounded-full border-[1.5px] border-[var(--ink)] px-5 text-[15px] font-bold"
                    >
                      Copy
                    </button>
                  </div>
                  <label className="mt-5 flex items-center gap-2.5 text-[15px] font-semibold">
                    <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="size-5 accent-[var(--ink)]" />
                    I&apos;ve saved them somewhere safe
                  </label>
                  <button type="button" disabled={!saved} onClick={() => router.replace('/console')} className="mt-5 h-12 rounded-full bg-[var(--ink)] px-6 text-[15px] font-bold text-white disabled:opacity-40">
                    Go to the console
                  </button>
                </div>
              )}
            </section>
            {step !== 'backup' && (
              <p className="mt-3.5 px-1 text-[13px] text-[var(--muted)]">
                Invited as <b className="text-[var(--ink)]">{ROLE_LABEL[info.role]}</b>. This link works once and expires 24 hours after it was sent.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
