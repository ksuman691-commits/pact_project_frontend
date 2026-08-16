'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';
import LogoMark from '@/components/LogoMark';

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
      <div className="lg:hidden p-4 border-b border-[rgba(20,18,31,0.06)]">
        <div className="flex justify-center mb-4">
          <LogoMark size={52} withWordmark wordmarkPlacement="right" />
        </div>
        <h1 className="text-2xl font-bold text-[#14121F] text-center">Join CirclePact</h1>
      </div>

      <div className="flex flex-col lg:flex-row min-h-screen lg:min-h-auto">
        {/* Left side - Branding (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-50 to-slate-100 flex-col items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="mb-8 flex justify-center">
              <LogoMark size={72} withWordmark wordmarkPlacement="right" />
            </div>
            <h1 className="text-3xl font-black text-[#14121F] mb-4">Join CirclePact</h1>
            <p className="text-[#6B7280] mb-8">Turn your goals into reality with real commitments and real accountability.</p>

            <div className="space-y-4 mt-12 text-left">
              <div>
                <p className="font-semibold text-[#14121F]">🎯 Make It a Pact</p>
                <p className="text-sm text-[#6B7280]">Commit to a goal with a deadline that holds you to it</p>
              </div>
              <div>
                <p className="font-semibold text-[#14121F]">👥 Build Your Circle</p>
                <p className="text-sm text-[#6B7280]">Get verified by people you trust</p>
              </div>
              <div>
                <p className="font-semibold text-[#14121F]">🔥 Earn Your Streak</p>
                <p className="text-sm text-[#6B7280]">Build your reputation with every Pact you keep</p>
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
                  className="w-full px-4 py-2.5 bg-[#F4F2FB] border border-[rgba(20,18,31,0.06)] rounded-[28px] focus:outline-none focus:border-slate-400 text-sm placeholder:text-slate-400"
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
                  className="w-full px-4 py-2.5 bg-[#F4F2FB] border border-[rgba(20,18,31,0.06)] rounded-[28px] focus:outline-none focus:border-slate-400 text-sm placeholder:text-slate-400"
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
                  className="w-full px-4 py-2.5 bg-[#F4F2FB] border border-[rgba(20,18,31,0.06)] rounded-[28px] focus:outline-none focus:border-slate-400 text-sm placeholder:text-slate-400"
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
                  className="w-full px-4 py-2.5 bg-[#F4F2FB] border border-[rgba(20,18,31,0.06)] rounded-[28px] focus:outline-none focus:border-slate-400 text-sm placeholder:text-slate-400"
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
                  className="w-full px-4 py-2.5 bg-[#F4F2FB] border border-[rgba(20,18,31,0.06)] rounded-[28px] focus:outline-none focus:border-slate-400 text-sm placeholder:text-slate-400"
                  placeholder="Confirm password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold rounded-[28px] transition-all disabled:cursor-not-allowed text-sm mt-4"
              >
                {isLoading ? 'Creating account...' : 'Sign Up'}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[rgba(20,18,31,0.06)]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-[#9CA3AF]">OR</span>
              </div>
            </div>

            <p className="text-center text-[#6B7280] text-sm">
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
