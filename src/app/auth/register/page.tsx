'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AuthShell from '@/components/AuthShell';

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
      toast.success('Account created successfully!');
      router.push('/profile');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    }
  };

  return (
    <AuthShell heading="create account" subheading="join circlepact to start your first pact">
        <form onSubmit={handleSubmit} className="mt-8 space-y-3">
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            required
            aria-label="full name"
            className="w-full rounded-[18px] border border-[#E8DED7] bg-white px-5 py-3.5 text-sm text-[#2F211D] outline-none placeholder:text-[#B4A59D] focus:border-[#E5373B]"
            placeholder="full name"
          />
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            aria-label="username"
            className="w-full rounded-[18px] border border-[#E8DED7] bg-white px-5 py-3.5 text-sm text-[#2F211D] outline-none placeholder:text-[#B4A59D] focus:border-[#E5373B]"
            placeholder="username"
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            aria-label="email"
            className="w-full rounded-[18px] border border-[#E8DED7] bg-white px-5 py-3.5 text-sm text-[#2F211D] outline-none placeholder:text-[#B4A59D] focus:border-[#E5373B]"
            placeholder="email"
          />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            aria-label="password"
            className="w-full rounded-[18px] border border-[#E8DED7] bg-white px-5 py-3.5 text-sm text-[#2F211D] outline-none placeholder:text-[#B4A59D] focus:border-[#E5373B]"
            placeholder="password"
          />
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            aria-label="confirm password"
            className="w-full rounded-[18px] border border-[#E8DED7] bg-white px-5 py-3.5 text-sm text-[#2F211D] outline-none placeholder:text-[#B4A59D] focus:border-[#E5373B]"
            placeholder="confirm password"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-[18px] bg-[#E5373B] py-3.5 text-sm font-semibold lowercase text-white transition hover:bg-[#C92F34] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'creating account...' : 'create account'}
          </button>
        </form>

        <p className="mt-7 text-center text-xs text-[#A99991]">by continuing you agree to our terms</p>
        <p className="mt-4 text-center text-sm text-[#8E7C73]">
          already have an account?{' '}
          <Link href="/auth/login" className="font-semibold text-[#E5373B] hover:underline">sign in</Link>
        </p>
    </AuthShell>
  );
}
