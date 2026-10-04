'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AuthShell, { authInputClass, authPrimaryButtonClass } from '@/components/AuthShell';
import GoogleSignInButton from '@/components/GoogleSignInButton';

const FIELDS = [
  { name: 'full_name', type: 'text', label: 'Full name' },
  { name: 'username', type: 'text', label: 'Username' },
  { name: 'email', type: 'email', label: 'Email' },
  { name: 'password', type: 'password', label: 'Password' },
  { name: 'confirmPassword', type: 'password', label: 'Confirm password' },
] as const;

export default function Register() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      await register(formData.username, formData.email, formData.full_name, formData.password);
      toast.success('Account created');
      router.push('/profile');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    }
  };

  return (
    <AuthShell heading="Create your account." subheading="Join CirclePact and make your first pact.">
      <form onSubmit={handleSubmit} className="mt-8 space-y-3">
        {FIELDS.map((field) => (
          <input
            key={field.name}
            type={field.type}
            name={field.name}
            value={formData[field.name]}
            onChange={handleChange}
            required
            aria-label={field.label}
            className={authInputClass}
            placeholder={field.label}
          />
        ))}
        <button type="submit" disabled={isLoading} className={authPrimaryButtonClass}>
          {isLoading ? 'Creating account…' : 'Create account'}
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
        Already have an account?{' '}
        <Link href="/auth/login" className="font-semibold text-[var(--navy)] hover:text-[var(--navy-hover)] hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
