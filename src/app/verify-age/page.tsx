'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import AuthShell from '@/components/AuthShell';
import { useAuthStore } from '@/store/auth';

const MIN_AGE = 18;

/**
 * Provider-agnostic post-signup age gate. Reached only via the global
 * AgeVerificationGate (mounted in the root layout) redirecting any
 * signed-in, not-yet-verified user here — never linked to directly from a
 * specific signup form, since Google sign-in and manual registration (and
 * any OAuth provider added later) all funnel through the same gate rather
 * than each wiring this up individually.
 *
 * Self-declared, not ID-verified: same trade-off as most consumer apps'
 * age gates. The under-18 block below is a UX nicety, not a security
 * control — a user can just re-enter a different date. Real enforcement
 * has to happen server-side once BACKEND_SPEC_CONTENT_MODERATION.md's
 * `date_of_birth` column and per-request checks exist.
 */
export default function VerifyAgePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const completeAgeVerification = useAuthStore((state) => state.completeAgeVerification);

  const [dateOfBirth, setDateOfBirth] = useState('');
  const [tosAccepted, setTosAccepted] = useState(false);
  const [underageMessage, setUnderageMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Guards direct navigation: signed-out visitors have nothing to verify
  // (bounce to login), already-verified users don't need to see this again
  // (bounce to the feed) — e.g. a bookmarked link or the back button.
  useEffect(() => {
    if (!isInitialized) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    if (user.date_of_birth) {
      router.replace('/feed');
    }
  }, [isInitialized, user, router]);

  const calculateAge = (isoDate: string): number => {
    const dob = new Date(isoDate);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age -= 1;
    }
    return age;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnderageMessage(null);

    if (!dateOfBirth) {
      toast.error('Please enter your date of birth');
      return;
    }

    const parsed = new Date(dateOfBirth);
    if (Number.isNaN(parsed.getTime()) || parsed.getTime() > Date.now()) {
      toast.error('Please enter a valid date of birth');
      return;
    }

    if (!tosAccepted) {
      toast.error('Please confirm you agree to the Terms of Service');
      return;
    }

    const age = calculateAge(dateOfBirth);
    if (age < MIN_AGE) {
      setUnderageMessage(
        `You must be ${MIN_AGE} or older to use CirclePact. Based on the date you entered, you don't currently meet that requirement.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await completeAgeVerification(dateOfBirth);
      toast.success('Age verified — welcome to CirclePact!');
      router.replace('/feed');
    } catch (err: any) {
      // The client-side check above already caught this in the normal
      // case — this only fires if the backend's own calculation disagrees
      // (e.g. clock skew, or a client-side bypass attempt), per
      // BACKEND_SPEC_CONTENT_MODERATION.md's 403 { code: 'underage_user' }
      // response. Any other failure (after the store's retries) means the
      // backend never saved the date, so the user must try again.
      const detail = err?.response?.data?.detail;
      if (err?.response?.status !== 403 || detail?.code !== 'underage_user') {
        toast.error("Couldn't save your date of birth. Please try again.");
        return;
      }
      setUnderageMessage(
        detail?.message ||
          `You must be ${MIN_AGE} or older to use CirclePact. Based on the date you entered, you don't currently meet that requirement.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isInitialized || !user) {
    return null;
  }

  return (
    <AuthShell heading="Confirm your age">
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="date_of_birth" className="mb-1.5 block text-[13px] font-medium text-ink-soft">
            Date of birth
          </label>
          <input
            id="date_of_birth"
            type="date"
            value={dateOfBirth}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => {
              setDateOfBirth(e.target.value);
              setUnderageMessage(null);
            }}
            required
            aria-label="date of birth"
            className="h-12 w-full rounded-[6px] border border-[#DCD3C1] bg-card px-3.5 text-sm text-ink outline-none focus:ring-2 focus:ring-navy"
          />
        </div>

        {underageMessage && (
          <p role="alert" className="rounded-[6px] bg-[#F1E6CF] px-4 py-3 text-sm text-[#6E4B12]">
            {underageMessage}
          </p>
        )}

        <label className="flex items-start gap-2.5 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={tosAccepted}
            onChange={(e) => setTosAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--seat-border)] accent-[var(--navy)] focus:ring-navy"
          />
          <span>
            I confirm I am {MIN_AGE} or older and agree to CirclePact&apos;s{' '}
            <span className="font-semibold text-ink">Terms of Service</span>.
          </span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-[52px] w-full rounded-full bg-navy text-base font-semibold text-card transition hover:bg-[#142766] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Verifying…' : 'Continue'}
        </button>
      </form>
    </AuthShell>
  );
}
