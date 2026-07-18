'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';

export default function Login() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [formData, setFormData] = useState({
    email: 'demo@example.com',
    password: 'password123',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData.email, formData.password);
      toast.success('Login successful!');
      router.push('/');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left side - Logo and branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-50 to-slate-100 flex-col items-center justify-center p-8">
        <div className="text-center">
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
          <h1 className="text-4xl font-black text-slate-900 mb-4">CirclePact</h1>
          <p className="text-lg text-slate-600 mb-2">Real Commitments.</p>
          <p className="text-lg text-slate-600 mb-8">Real Money.</p>
          <p className="text-lg text-slate-600 mb-12">Real Accountability.</p>

          <div className="space-y-6 mt-12">
            <div className="flex items-start gap-4">
              <div className="text-2xl">🎯</div>
              <div className="text-left">
                <p className="font-semibold text-slate-900">Set Goals with Stakes</p>
                <p className="text-sm text-slate-600">Put real money behind your commitments</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-2xl">👥</div>
              <div className="text-left">
                <p className="font-semibold text-slate-900">Invite Your Circle</p>
                <p className="text-sm text-slate-600">Get accountability from followers who care</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-2xl">✅</div>
              <div className="text-left">
                <p className="font-semibold text-slate-900">Prove. Vote. Win.</p>
                <p className="text-sm text-slate-600">Upload proof daily and earn rewards</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 sm:p-8">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex justify-center">
          <Image
            src="/logo.png"
            alt="CirclePact"
            width={120}
            height={72}
            priority
            className="object-contain"
          />
        </div>

        <div className="w-full max-w-sm">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 text-sm placeholder:text-slate-400"
                placeholder="Email or username"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">OR</span>
            </div>
          </div>

          {/* Demo credentials */}
          <p className="text-center text-xs text-slate-600 mb-4">Demo credentials pre-filled</p>

          {/* Forgot password and register */}
          <div className="space-y-4 text-center">
            <p className="text-sm">
              <a href="#" className="text-slate-600 hover:text-slate-900 font-medium">
                Forgot password?
              </a>
            </p>

            <div className="pt-4 border-t border-slate-200">
              <p className="text-slate-600 text-sm mb-3">
                Don&apos;t have an account?{' '}
                <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
