'use client';

import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function GoogleSignInButton() {
  const router = useRouter();
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const isLoading = useAuthStore((state) => state.isLoading);

  const handleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      toast.error('Google sign-in did not return a credential');
      return;
    }

    try {
      await loginWithGoogle(credentialResponse.credential);
      toast.success('login successful');
      router.push('/');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Google sign-in failed');
    }
  };

  const handleError = () => {
    toast.error('Google sign-in was cancelled or could not be completed');
  };

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="flex h-11 w-full items-center justify-center rounded-[18px] border border-[#E8DED7] bg-[#FAF6F0] text-sm text-[#A99991]">
        Google sign-in unavailable until Client ID is configured
      </div>
    );
  }

  return (
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
          width="360"
        />
      </GoogleOAuthProvider>
    </div>
  );
}
