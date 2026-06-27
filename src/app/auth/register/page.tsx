'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';

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
    <div className="min-h-screen bg-white">
      {/* Mobile header with logo */}
      <div className="lg:hidden p-4 border-b border-slate-200">
        <div className="flex justify-center mb-4">
          <Image
            src="/logo.png"
            alt="CirclePact"
            width={100}
            height={60}
            priority
            className="object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 text-center">Join CirclePact</h1>
      </div>

      <div className="flex flex-col lg:flex-row min-h-screen lg:min-h-auto">
        {/* Left side - Branding (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-50 to-slate-100 flex-col items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="mb-8 flex justify-center">
              <Image
                src="/logo.png"
                alt="CirclePact"
                width={200}
                height={120}
                priority
                className="object-contain"
              />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-4">Join CirclePact</h1>
            <p className="text-slate-600 mb-8">Turn your goals into reality with real stakes and real accountability.</p>

            <div className="space-y-4 mt-12 text-left">
              <div>
                <p className="font-semibold text-slate-900">💰 Your Money Matters</p>
                <p className="text-sm text-slate-600">Stake real money on your commitments</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">👥 Build Your Circle</p>
                <p className="text-sm text-slate-600">Get verified by people you trust</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">🔥 Earn Your Streak</p>
                <p className="text-sm text-slate-600">Win money and build your reputation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 sm:p-8 pb-12">
          <div className="w-full max-w-sm">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 text-sm placeholder:text-slate-400"
                  placeholder="Full name"
                />
              </div>

              <div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 text-sm placeholder:text-slate-400"
                  placeholder="Username"
                />
              </div>

              <div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 text-sm placeholder:text-slate-400"
                  placeholder="Email"
                />
              </div>

              <div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 text-sm placeholder:text-slate-400"
                  placeholder="Password"
                />
              </div>

              <div>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 text-sm placeholder:text-slate-400"
                  placeholder="Confirm password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed text-sm mt-4"
              >
                {isLoading ? 'Creating account...' : 'Sign Up'}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">OR</span>
              </div>
            </div>

            <p className="text-center text-slate-600 text-sm">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
