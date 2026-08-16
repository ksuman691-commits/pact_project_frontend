'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, Star, Flame, ChevronRight } from 'lucide-react';
import { cardHoverTap } from '@/components/pact-ui/cardMotion';
import UserAvatarLink from '@/components/UserAvatarLink';
import MemberAvatarStack from '@/components/MemberAvatarStack';
import PremiumJoinButton from '@/components/PremiumJoinButton';
import { useCircleMembers } from '@/hooks/useCircles';
import { getDisplayName } from '@/lib/displayName';

interface CircleCardProps {
  circle: {
    id: number;
    name: string;
    description: string;
    avatar?: string;
    ownerId?: number | null;
    ownerUsername?: string | null;
    ownerAvatarUrl?: string | null;
    memberCount: number;
    isJoined: boolean;
    isTrending?: boolean;
    /** Active pact count for this circle. Omitted (not 0) when the backend
     * hasn't shipped this field yet — see the pact_count note below. */
    pactCount?: number;
  };
  onJoin?: (circleId: number) => void;
  index?: number;
}

export default function CircleCard({ circle, onJoin, index = 0 }: CircleCardProps) {
  const router = useRouter();
  // Real per-member avatars/usernames aren't included on the circle
  // list/public endpoints — only member_count is. Fetching them here (one
  // cheap, cached-by-id request per card) is what makes the avatar row
  // real data instead of placeholder initials.
  const { data: members } = useCircleMembers(circle.id);
  const avatarStackMembers = (members || []).map((member: any) => ({
    userId: member.user_id,
    name: member.full_name || member.username,
    username: member.username,
    avatarUrl: member.avatar_url,
  }));

  const handleCardClick = () => router.push(`/circles/${circle.id}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      {...cardHoverTap}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
        className="pact-card cursor-pointer rounded-3xl p-6"
      >
        {/* Header: icon + name + vibe tag */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-[var(--pact-text)] line-clamp-2">{circle.name}</h3>
              {circle.isTrending && (
                <Star className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--pact-gold)' }} />
              )}
            </div>
            {circle.description && (
              <p className="mt-1 text-sm text-[var(--pact-text-dim)] line-clamp-2">{circle.description}</p>
            )}
          </div>
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white"
            style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))' }}
          >
            {circle.avatar || circle.name.charAt(0)}
          </div>
        </div>

        {/* Overlapping member avatars — WHO is in the circle. Each avatar
            is independently clickable to that member's profile via
            stopPropagation, separate from the "N member(s)" stat below
            which covers the count. */}
        {avatarStackMembers.length > 0 && (
          <MemberAvatarStack members={avatarStackMembers} totalCount={circle.memberCount} className="mt-4" />
        )}

        {/* Icon-led stat row — replaces the old boxed MEMBERS / CIRCLE pairs */}
        <div className="mt-4 flex items-center gap-5 text-sm">
          <div className="flex items-center gap-1.5 text-[var(--pact-text-dim)]">
            <Users className="h-4 w-4" style={{ color: 'var(--pact-violet)' }} />
            <span className="font-semibold text-[var(--pact-text)]">{circle.memberCount}</span>
            <span className="text-[var(--pact-text-faint)]">member{circle.memberCount === 1 ? '' : 's'}</span>
          </div>
          {typeof circle.pactCount === 'number' && (
            <div className="flex items-center gap-1.5 text-[var(--pact-text-dim)]">
              <Flame className="h-4 w-4" style={{ color: 'var(--pact-pink)' }} />
              <span className="font-semibold text-[var(--pact-text)]">{circle.pactCount}</span>
              <span className="text-[var(--pact-text-faint)]">active pact{circle.pactCount === 1 ? '' : 's'}</span>
            </div>
          )}
        </div>

        {circle.ownerUsername && (
          <div className="mt-3 flex items-center gap-2">
            <UserAvatarLink
              name={getDisplayName(circle.ownerId, circle.ownerUsername)}
              avatarUrl={circle.ownerAvatarUrl}
              username={circle.ownerUsername}
              size={20}
              stopPropagation
            />
            <p className="text-xs font-medium text-[var(--pact-text-faint)]">
              {getDisplayName(circle.ownerId, circle.ownerUsername) === 'You'
                ? 'Your circle'
                : `Owner @${circle.ownerUsername}`}
            </p>
          </div>
        )}

        {/* Footer action */}
        <div className="mt-5">
          {circle.isJoined ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              className="pact-btn-glow flex w-full items-center justify-between rounded-full px-4 py-2 text-sm font-medium transition"
              style={{ background: 'var(--pact-surface-2)', color: 'var(--pact-violet)' }}
            >
              <span>View Circle</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <PremiumJoinButton
              label="Join Circle"
              fullWidth
              onClick={(e) => {
                e.stopPropagation();
                onJoin?.(circle.id);
              }}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
