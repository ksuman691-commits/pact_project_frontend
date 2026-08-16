'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';
import LogoMark from '@/components/LogoMark';

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
      toast.success('login successful');
      router.push('/');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'login failed');
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FAF6F0] px-5 py-12 text-[#2F211D]">
      <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-32 h-80 w-80 rounded-full bg-[rgba(127,119,221,0.20)]" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-[rgba(127,119,221,0.13)]" />

      <section className="relative w-full max-w-md rounded-[30px] bg-white px-7 py-9 shadow-[0_24px_70px_rgba(75,53,42,0.12)] sm:px-10 sm:py-11">
        <div className="flex flex-col items-center text-center">
          <LogoMark size={52} />
          <h1 className="mt-7 text-4xl font-bold lowercase tracking-[-0.05em] text-[#2F211D]">welcome back</h1>
          <p className="mt-2 text-sm text-[#8E7C73]">sign in to your circles</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-3">
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
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-[18px] bg-[#E5373B] py-3.5 text-sm font-semibold lowercase text-white transition hover:bg-[#C92F34] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'continuing...' : 'continue'}
          </button>
        </form>

        <div className="my-7 flex items-center gap-3 text-xs text-[#B4A59D]">
          <span className="h-px flex-1 bg-[#EEE5DF]" />
          <span>or</span>
          <span className="h-px flex-1 bg-[#EEE5DF]" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button type="button" className="rounded-[18px] border border-[#E8DED7] bg-white py-3 text-sm lowercase text-[#5E4C45] transition hover:bg-[#FAF6F0]">google</button>
          <button type="button" className="rounded-[18px] border border-[#E8DED7] bg-white py-3 text-sm lowercase text-[#5E4C45] transition hover:bg-[#FAF6F0]">apple</button>
        </div>

        <p className="mt-7 text-center text-xs text-[#A99991]">by continuing you agree to our terms</p>
        <p className="mt-4 text-center text-sm text-[#8E7C73]">
          new here?{' '}
          <Link href="/auth/register" className="font-semibold text-[#E5373B] hover:underline">sign up</Link>
        </p>
      </section>
    </main>
  );
}
