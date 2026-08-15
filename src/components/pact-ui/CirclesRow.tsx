'use client';

import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import Avatar from '@/components/Avatar';

interface CircleSummary {
  id: number;
  name: string;
  avatar_url?: string | null;
  member_count?: number;
}

interface CirclesRowProps {
  circles: CircleSummary[];
  className?: string;
}

/**
 * Horizontal avatar-stack strip of circles the user belongs to, linking to
 * each circle's detail page.
 */
export default function CirclesRow({ circles, className = '' }: CirclesRowProps) {
  const router = useRouter();

  if (circles.length === 0) {
    return (
      <div className={`pact-card rounded-2xl p-4 text-center ${className}`}>
        <p className="text-sm text-[var(--pact-text-faint)]">Not in any circles yet.</p>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 overflow-x-auto scrollbar-hide pb-1 ${className}`}>
      {circles.map((circle) => (
        <button
          key={circle.id}
          onClick={() => router.push(`/circles/${circle.id}`)}
          className="pact-card pact-btn-glow flex flex-shrink-0 flex-col items-center gap-1.5 rounded-2xl px-3 py-2.5"
        >
          <Avatar name={circle.name} avatarUrl={circle.avatar_url} size={40} />
          <span className="max-w-[72px] truncate text-xs font-medium text-[var(--pact-text-dim)]">
            {circle.name}
          </span>
          {typeof circle.member_count === 'number' && (
            <span className="flex items-center gap-0.5 text-[10px] text-[var(--pact-text-faint)]">
              <Users className="h-2.5 w-2.5" />
              {circle.member_count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
