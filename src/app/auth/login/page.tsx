'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AuthShell, { authInputClass, authPrimaryButtonClass } from '@/components/AuthShell';
import GoogleSignInButton from '@/components/GoogleSignInButton';

export default function Login() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [formData, setFormData] = useState({
    email: 'demo@example.com',
    password: 'password123',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData.email, formData.password);
      toast.success('Signed in');
      router.push('/');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Sign in failed');
    }
  };

  return (
    <AuthShell heading="Welcome back." subheading="Sign in to the circles that hold you to it.">
      <form onSubmit={handleSubmit} className="mt-8 space-y-3">
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          aria-label="Email"
          className={authInputClass}
          placeholder="Email"
        />
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          aria-label="Password"
          className={authInputClass}
          placeholder="Password"
        />
        <button type="submit" disabled={isLoading} className={authPrimaryButtonClass}>
          {isLoading ? 'Signing in…' : 'Continue'}
        </button>
      </form>

      <div className="my-7 flex items-center gap-3 text-xs text-[var(--muted)]">
        <span className="h-px flex-1 bg-[var(--hairline)]" />
        <span>or</span>
        <span className="h-px flex-1 bg-[var(--hairline)]" />
      </div>

      <div className="rounded-[6px] bg-[var(--card)]">
        <GoogleSignInButton />
      </div>

      <p className="mt-7 text-center text-xs text-[var(--muted)]">By continuing you agree to our terms.</p>
      <p className="mt-4 text-center text-sm text-[var(--muted)]">
        New here?{' '}
        <Link href="/auth/register" className="font-semibold text-[var(--navy)] hover:text-[var(--navy-hover)] hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
