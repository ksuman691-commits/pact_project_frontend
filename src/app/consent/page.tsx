'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import AuthShell, { authPrimaryButtonClass } from '@/components/AuthShell';
import ConsentNotice from '@/components/legal/ConsentNotice';
import { useAuthStore } from '@/store/auth';
import { readNext } from '@/lib/authNext';
import { EMPTY_CONSENT, isPolicyVersionMismatch, type ConsentChoices } from '@/lib/consent';

/**
 * Accept the current Terms and Privacy Policy. Reached through the global gate by anyone signed
 * in whose account has no record of accepting the current versions: accounts made before consent
 * was recorded, and everyone again whenever the texts' versions are bumped.
 */
export default function ConsentPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const acceptConsent = useAuthStore((state) => state.acceptConsent);
  const logout = useAuthStore((state) => state.logout);
  const [choices, setChoices] = useState<ConsentChoices>(EMPTY_CONSENT);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;
    if (!user) router.replace('/auth/login');
    else if (!user.needs_consent) router.replace(readNext('/'));
  }, [isInitialized, user, router]);

  const accept = async () => {
    if (!choices.accepted) return;
    setSaving(true);
    try {
      await acceptConsent(choices);
      router.replace(readNext('/'));
    } catch (error: any) {
      if (isPolicyVersionMismatch(error)) toast.error('Our Terms or Privacy Policy just changed. Refresh the page to see the latest.');
      else toast.error("Couldn't save that. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isInitialized || !user || !user.needs_consent) return null;

  return (
    <AuthShell heading="Our Terms and Privacy Policy">
      <p className="mb-4 mt-0 text-[14px] leading-snug text-[var(--muted)]">
        We&apos;ve updated how we explain what we do with your data, under India&apos;s data protection law. Please read
        it and agree to keep using CirclePact. AI training and advertising stay off unless you tick them.
      </p>
      <ConsentNotice value={choices} onChange={setChoices} />
      <button type="button" disabled={!choices.accepted || saving} onClick={accept} className={`${authPrimaryButtonClass} mt-4`}>
        {saving ? 'Saving…' : 'Agree and continue'}
      </button>
      <p className="mt-4 text-center text-[13px] leading-snug text-[var(--muted)]">
        Don&apos;t agree? You can{' '}
        <button type="button" onClick={() => { logout(); router.replace('/'); }} className="font-semibold text-[var(--navy)] underline">
          sign out
        </button>
        , or delete your account from Edit profile.
      </p>
    </AuthShell>
  );
}
