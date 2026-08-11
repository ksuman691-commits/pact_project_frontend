'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className="bg-white shadow-[0_4px_12px_rgba(94,84,142,0.08)] border-b border-[rgba(20,18,31,0.06)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <Image
              src="/logo.png"
              alt="CirclePact Logo"
              width={40}
              height={40}
              className="w-10 h-10"
              priority
            />
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/profile" className="text-[#6B7280] hover:text-[#14121F]">
                  My Profile
                </Link>
                <Link href="/pacts" className="text-[#6B7280] hover:text-[#14121F]">
                  Pacts
                </Link>
                <Link href="/circles" className="text-[#6B7280] hover:text-[#14121F]">
                  Circles
                </Link>
                <div className="flex items-center gap-3 pl-4 border-l border-[rgba(20,18,31,0.06)]">
                  <span className="text-sm text-[#6B7280]">{user.username}</span>
                  <button
                    onClick={handleLogout}
                    className="btn-secondary text-sm"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="btn-ghost">
                  Login
                </Link>
                <Link href="/auth/register" className="btn-primary">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
