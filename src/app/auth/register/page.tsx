'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AuthShell, { authInputClass, authLabelClass, authPrimaryButtonClass } from '@/components/AuthShell';
import GoogleSignInButton from '@/components/GoogleSignInButton';

const FIELDS = [
  { name: 'full_name', type: 'text', label: 'Full name', autoComplete: 'name' },
  { name: 'username', type: 'text', label: 'Username', autoComplete: 'username' },
  { name: 'email', type: 'email', label: 'Email', autoComplete: 'email' },
  { name: 'password', type: 'password', label: 'Password', autoComplete: 'new-password' },
  { name: 'confirmPassword', type: 'password', label: 'Confirm password', autoComplete: 'new-password' },
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
    <AuthShell heading="Create your account">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {FIELDS.map((field) => (
          <div key={field.name}>
            <label htmlFor={field.name} className={authLabelClass}>{field.label}</label>
            <input
              id={field.name}
              type={field.type}
              name={field.name}
              autoComplete={field.autoComplete}
              value={formData[field.name]}
              onChange={handleChange}
              required
              className={authInputClass}
            />
          </div>
        ))}
        <button type="submit" disabled={isLoading} className={`${authPrimaryButtonClass} mt-1`}>
          {isLoading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <div className="mt-3 overflow-hidden rounded-full border border-[var(--hairline)] bg-[var(--card)] [&>*]:w-full">
        <GoogleSignInButton />
      </div>

      <p className="mt-6 text-center text-[14px] text-[var(--muted)]">
        Already have an account?{' '}
        <Link href="/auth/login" className="font-semibold text-[var(--navy)] hover:text-[var(--navy-hover)] hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
