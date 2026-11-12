'use client';

import { pausedFrom, rememberPaused } from '@/lib/paused';
import { useState } from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';
import { readNext } from '@/lib/authNext';
import { EMPTY_CONSENT, isPolicyVersionMismatch, type ConsentChoices } from '@/lib/consent';
import ConsentNotice from '@/components/legal/ConsentNotice';
import { authPrimaryButtonClass } from '@/components/AuthShell';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/**
 * Sign in (or up) with Google. A new Google account isn't created until the person has
 * accepted the notice: the backend answers 409 consent_required, we show the notice in a
 * sheet, and send the same Google token again with their choices. If the sign-up form's
 * notice is already ticked (`consent`), that is used and no sheet appears.
 */
export default function GoogleSignInButton({ consent }: { consent?: ConsentChoices }) {
  const router = useRouter();
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [pendingCredential, setPendingCredential] = useState<string | null>(null);
  const [choices, setChoices] = useState<ConsentChoices>(EMPTY_CONSENT);

  const finish = async (credential: string, given?: ConsentChoices) => {
    try {
      await loginWithGoogle(credential, given);
      setPendingCredential(null);
      toast.success('Signed in');
      router.push(readNext('/'));
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      const paused = pausedFrom(error);
      if (paused) {
        rememberPaused(paused);
        router.push('/auth/paused');
        return;
      }
      if (error.response?.status === 409 && detail?.code === 'consent_required') {
        setChoices({ ...EMPTY_CONSENT, ai_training: !!consent?.ai_training, ads_sharing: !!consent?.ads_sharing });
        setPendingCredential(credential);
        return;
      }
      if (isPolicyVersionMismatch(error)) {
        toast.error('Our Terms or Privacy Policy just changed. Refresh the page to see the latest.');
        return;
      }
      toast.error(typeof detail === 'string' ? detail : detail?.message || 'Google sign-in failed');
    }
  };

  const handleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      toast.error('Google sign-in did not return a credential');
      return;
    }
    await finish(credentialResponse.credential, consent?.accepted ? consent : undefined);
  };

  const handleError = () => {
    toast.error('Google sign-in was cancelled or could not be completed');
  };

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="flex h-11 w-full items-center justify-center rounded-[18px] border border-[var(--hairline)] bg-[var(--card-muted)] text-sm text-[var(--muted)]">
        Google sign-in unavailable until Client ID is configured
      </div>
    );
  }

  return (
    <>
      <div className={`flex justify-center ${isLoading ? 'pointer-events-none opacity-60' : ''}`}>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap={false}
            theme="outline"
            size="large"
            text="continue_with"
            shape="pill"
            width="340"
          />
        </GoogleOAuthProvider>
      </div>

      {pendingCredential && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Before we create your account"
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 sm:items-center sm:p-6"
        >
          <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[22px] bg-[var(--paper)] px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-5 sm:rounded-[22px]">
            <h2 className="m-0 mb-1 text-[20px] font-bold text-[var(--ink)]">Before we create your account</h2>
            <p className="m-0 mb-4 text-[14px] text-[var(--muted)]">Nothing is saved until you agree.</p>
            <ConsentNotice value={choices} onChange={setChoices} idPrefix="google-consent" />
            <button
              type="button"
              disabled={!choices.accepted || isLoading}
              onClick={() => finish(pendingCredential, choices)}
              className={`${authPrimaryButtonClass} mt-4`}
            >
              {isLoading ? 'Creating account…' : 'Agree and continue'}
            </button>
            <button
              type="button"
              onClick={() => setPendingCredential(null)}
              className="mt-2 h-11 w-full text-[15px] font-semibold text-[var(--muted)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
