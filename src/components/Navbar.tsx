'use client';

import Link from 'next/link';
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
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg"></div>
            <span className="font-bold text-xl text-slate-900">CirclePact</span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/profile" className="text-slate-600 hover:text-slate-900">
                  My Profile
                </Link>
                <Link href="/pacts" className="text-slate-600 hover:text-slate-900">
                  Pacts
                </Link>
                <Link href="/circles" className="text-slate-600 hover:text-slate-900">
                  Circles
                </Link>
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                  <span className="text-sm text-slate-600">{user.username}</span>
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
