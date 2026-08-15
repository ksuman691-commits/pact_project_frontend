'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, Star, ChevronRight } from 'lucide-react';
import { cardHoverTap } from '@/components/pact-ui/cardMotion';
import Avatar from '@/components/Avatar';

interface CircleCardProps {
  circle: {
    id: number;
    name: string;
    description: string;
    avatar?: string;
    ownerUsername?: string | null;
    ownerAvatarUrl?: string | null;
    memberCount: number;
    isJoined: boolean;
    isTrending?: boolean;
    memberList?: string[];
    winRate?: number;
  };
  onJoin?: (circleId: number) => void;
  index?: number;
}

export default function CircleCard({ circle, onJoin, index = 0 }: CircleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      {...cardHoverTap}
    >
      <Link href={`/circles/${circle.id}`}>
        <div className="pact-card rounded-3xl cursor-pointer h-full">
          {/* Circle Header */}
          <div className="p-6 border-b" style={{ borderColor: 'var(--pact-hairline)' }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-[var(--pact-text)] line-clamp-2">
                    {circle.name}
                  </h3>
                  {circle.isTrending && (
                    <Star className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--pact-gold)' }} />
                  )}
                </div>
                <p className="text-sm text-[var(--pact-text-dim)] line-clamp-2">
                  {circle.description}
                </p>
                {circle.ownerUsername && (
                  <div className="mt-2 flex items-center gap-2">
                    <Avatar name={circle.ownerUsername} avatarUrl={circle.ownerAvatarUrl} size={24} />
                    <p className="text-xs font-medium text-[var(--pact-text-faint)]">Owner @{circle.ownerUsername}</p>
                  </div>
                )}
              </div>
              <div
                className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg"
                style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))', color: 'var(--pact-text)' }}
              >
                {circle.avatar || circle.name.charAt(0)}
              </div>
            </div>
          </div>

          {/* Circle Stats */}
          <div className="px-6 py-4 grid grid-cols-2 gap-6 border-b" style={{ borderColor: 'var(--pact-hairline)' }}>
            <div className="flex flex-col min-w-0">
              <p className="text-xs text-[var(--pact-text-faint)] font-medium mb-2 uppercase tracking-wide">Members</p>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--pact-violet)' }} />
                <span className="text-lg font-bold text-[var(--pact-text)]">
                  {circle.memberCount}
                </span>
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-xs text-[var(--pact-text-faint)] font-medium mb-2 uppercase tracking-wide">Circle</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--pact-text)] whitespace-nowrap">Joinable</span>
              </div>
            </div>
          </div>

          {/* Member Avatars */}
          {circle.memberList && circle.memberList.length > 0 && (
            <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--pact-hairline)' }}>
              <p className="text-xs text-[var(--pact-text-faint)] font-medium mb-3">Recent Members</p>
              <div className="flex -space-x-2">
                {circle.memberList.slice(0, 5).map((member, idx) => (
                  <div
                    key={idx}
                    className="rounded-full border-2"
                    style={{ borderColor: 'var(--pact-surface)' }}
                    title={member}
                  >
                    <Avatar name={member} size={32} />
                  </div>
                ))}
                {circle.memberList.length > 5 && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2"
                    style={{ background: 'var(--pact-surface-2)', color: 'var(--pact-text-faint)', borderColor: 'var(--pact-surface)' }}
                  >
                    +{circle.memberList.length - 5}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Action */}
          <div className="px-6 py-4">
            {circle.isJoined ? (
              <button
                className="pact-btn-glow w-full flex items-center justify-between px-4 py-2 rounded-full font-medium text-sm transition"
                style={{ background: 'var(--pact-surface-2)', color: 'var(--pact-violet)' }}
              >
                <span>Joined</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onJoin?.(circle.id);
                }}
                className="pact-btn-glow w-full px-4 py-2 rounded-full font-medium text-sm transition"
                style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))', color: 'var(--pact-text)' }}
              >
                Join Circle
              </button>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
