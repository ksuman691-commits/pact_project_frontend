'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AuthShell, { authInputClass, authLabelClass, authPrimaryButtonClass } from '@/components/AuthShell';
import GoogleSignInButton from '@/components/GoogleSignInButton';

export default function Login() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [formData, setFormData] = useState({ email: '', password: '' });

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
    <AuthShell heading="Welcome back">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className={authLabelClass}>Email</label>
          <input id="email" type="email" name="email" autoComplete="email" value={formData.email} onChange={handleChange} required className={authInputClass} />
        </div>
        <div>
          <label htmlFor="password" className={authLabelClass}>Password</label>
          <input id="password" type="password" name="password" autoComplete="current-password" value={formData.password} onChange={handleChange} required className={authInputClass} />
        </div>
        <button type="submit" disabled={isLoading} className={`${authPrimaryButtonClass} mt-1`}>
          {isLoading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="mt-3 overflow-hidden rounded-full border border-[var(--hairline)] bg-[var(--card)] [&>*]:w-full">
        <GoogleSignInButton />
      </div>

      <p className="mt-6 text-center text-[14px] text-[var(--muted)]">
        New here?{' '}
        <Link href="/auth/register" className="font-semibold text-[var(--navy)] hover:text-[var(--navy-hover)] hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
