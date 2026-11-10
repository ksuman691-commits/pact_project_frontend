'use client';

import { useEffect, useState } from 'react';
import { readNext } from '@/lib/authNext';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AuthShell, { authInputClass, authLabelClass, authPrimaryButtonClass } from '@/components/AuthShell';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import ConsentNotice from '@/components/legal/ConsentNotice';
import { EMPTY_CONSENT, isPolicyVersionMismatch, type ConsentChoices } from '@/lib/consent';

const MIN_AGE = 18;
const MIN_PASSWORD = 8;

/** "Priya Sharma" → "priya_sharma" (letters, numbers and _ only). */
function suggestUsername(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 20);
}

function ageOn(isoDate: string, today = new Date()): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age -= 1;
  return age;
}

export default function Register() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [loginHref, setLoginHref] = useState('/auth/login');
  useEffect(() => {
    const next = readNext('');
    if (next) setLoginHref(`/auth/login?next=${encodeURIComponent(next)}`);
  }, []);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameEdited, setUsernameEdited] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [tooYoung, setTooYoung] = useState(false);
  const [consent, setConsent] = useState<ConsentChoices>(EMPTY_CONSENT);

  const maxDob = new Date().toISOString().slice(0, 10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTooYoung(false);
    if (password.length < MIN_PASSWORD) {
      toast.error(`Use a password with at least ${MIN_PASSWORD} characters`);
      return;
    }
    if (!dateOfBirth || Number.isNaN(Date.parse(dateOfBirth)) || dateOfBirth > maxDob) {
      toast.error('Add your date of birth');
      return;
    }
    // Checked before anything is sent, so nothing is stored for under-18s.
    if (ageOn(dateOfBirth) < MIN_AGE) {
      setTooYoung(true);
      return;
    }
    if (!consent.accepted) {
      toast.error('Please read and agree to how we use your data');
      return;
    }
    try {
      await register(username.trim(), email.trim(), fullName.trim(), password, dateOfBirth, consent);
      toast.success('Account created');
      // Back to the invite they opened; otherwise straight into a first pact (they can skip it).
      router.push(readNext('') || '/pacts/create?first=1');
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      if (detail?.code === 'underage_user') setTooYoung(true);
      else if (isPolicyVersionMismatch(error)) toast.error('Our Terms or Privacy Policy just changed. Refresh the page to see the latest.');
      else toast.error(typeof detail === 'string' ? detail : detail?.message || 'Registration failed');
    }
  };

  return (
    <AuthShell heading="Create your account">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="full_name" className={authLabelClass}>Name</label>
          <input
            id="full_name"
            autoComplete="name"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (!usernameEdited) setUsername(suggestUsername(e.target.value));
            }}
            required
            className={authInputClass}
          />
        </div>
        <div>
          <label htmlFor="username" className={authLabelClass}>Username</label>
          <input
            id="username"
            autoComplete="username"
            autoCapitalize="none"
            value={username}
            onChange={(e) => {
              setUsernameEdited(true);
              setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''));
            }}
            required
            className={authInputClass}
          />
        </div>
        <div>
          <label htmlFor="email" className={authLabelClass}>Email</label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={authInputClass} />
        </div>
        <div>
          <label htmlFor="password" className={authLabelClass}>Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={MIN_PASSWORD}
              className={`${authInputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-[var(--muted)]"
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
          <p className="mt-1.5 text-[12px] text-[var(--muted)]">At least {MIN_PASSWORD} characters.</p>
        </div>
        <div>
          <label htmlFor="dob" className={authLabelClass}>Date of birth</label>
          <input id="dob" type="date" max={maxDob} value={dateOfBirth} onChange={(e) => { setDateOfBirth(e.target.value); setTooYoung(false); }} required className={authInputClass} />
          <p className="mt-1.5 text-[12px] text-[var(--muted)]">CirclePact is for people {MIN_AGE} and over. Your birthday isn’t shown to anyone.</p>
        </div>
        {tooYoung && (
          <p role="alert" className="rounded-[14px] px-4 py-3 text-[14px] leading-snug" style={{ background: '#FDECEA', color: '#8A1C12' }}>
            You need to be {MIN_AGE} or older to use CirclePact. We haven’t saved anything you entered.
          </p>
        )}
        <ConsentNotice value={consent} onChange={setConsent} />
        <button type="submit" disabled={isLoading || !consent.accepted} className={`${authPrimaryButtonClass} mt-1`}>
          {isLoading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <div className="mt-3 overflow-hidden rounded-full border border-[var(--hairline)] bg-[var(--card)] [&>*]:w-full">
        <GoogleSignInButton consent={consent} />
      </div>

      <p className="mt-6 text-center text-[14px] text-[var(--muted)]">
        Already have an account?{' '}
        <Link href={loginHref} className="font-semibold text-[var(--navy)] hover:text-[var(--navy-hover)] hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
