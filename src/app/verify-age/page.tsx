'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import AuthShell from '@/components/AuthShell';
import { useAuthStore } from '@/store/auth';
import { isAgeVerifiedLocally } from '@/lib/ageVerification';

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
    const isVerified = Boolean(user.date_of_birth) || isAgeVerifiedLocally(user.user_uuid);
    if (isVerified) {
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
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isInitialized || !user) {
    return null;
  }

  return (
    <AuthShell heading="confirm your age" subheading="one quick step before you get started">
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="date_of_birth" className="mb-1.5 block text-xs font-semibold text-[#8E7C73]">
            date of birth
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
            className="w-full rounded-[18px] border border-[#E8DED7] bg-white px-5 py-3.5 text-sm text-[#2F211D] outline-none focus:border-[#E5373B]"
          />
        </div>

        {underageMessage && (
          <p role="alert" className="rounded-[18px] bg-[#FBEAEA] px-4 py-3 text-sm text-[#B3261E]">
            {underageMessage}
          </p>
        )}

        <label className="flex items-start gap-2.5 text-sm text-[#5B4C45]">
          <input
            type="checkbox"
            checked={tosAccepted}
            onChange={(e) => setTosAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#E8DED7] text-[#E5373B] focus:ring-[#E5373B]"
          />
          <span>
            I confirm I am {MIN_AGE} or older and agree to CirclePact&apos;s{' '}
            <span className="font-semibold text-[#2F211D]">Terms of Service</span>.
          </span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-[18px] bg-[#E5373B] py-3.5 text-sm font-semibold lowercase text-white transition hover:bg-[#C92F34] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'verifying...' : 'continue'}
        </button>
      </form>
    </AuthShell>
  );
}
