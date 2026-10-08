'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import LogoMark from '@/components/LogoMark';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className="bg-[var(--card)] shadow-[0_4px_12px_rgba(23,24,29,0.08)] border-b border-[var(--hairline)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <LogoMark size={20} />
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/profile" className="text-[var(--muted)] hover:text-[var(--ink)]">
                  My Profile
                </Link>
                <Link href="/pacts" className="text-[var(--muted)] hover:text-[var(--ink)]">
                  Pacts
                </Link>
                <Link href="/circles" className="text-[var(--muted)] hover:text-[var(--ink)]">
                  Circles
                </Link>
                <div className="flex items-center gap-3 pl-4 border-l border-[rgba(20,18,31,0.06)]">
                  <span className="text-sm text-[var(--muted)]">{user.username}</span>
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
