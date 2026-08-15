'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Clock, Users, CheckCircle2, XCircle } from 'lucide-react';
import type { Dare } from '@/types';

interface DareCardProps {
  dare: Dare;
  onClick?: () => void;
}

function formatEndsIn(endDateRaw?: string) {
  if (!endDateRaw) return 'Ends soon';

  const endDate = new Date(endDateRaw);
  if (Number.isNaN(endDate.getTime())) return 'Ends soon';

  const diffMs = endDate.getTime() - Date.now();
  if (diffMs <= 0) return 'Ended';

  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (days < 1) return 'Ends today';
  if (days <= 6) return `${days} day${days === 1 ? '' : 's'} left`;
  if (days < 30) return `${Math.round(days / 7)} week${Math.round(days / 7) === 1 ? '' : 's'} left`;
  return `${Math.round(days / 30)} month${Math.round(days / 30) === 1 ? '' : 's'} left`;
}

function getUrgencyColor(endDate?: string): string {
  if (!endDate) return 'text-[var(--pact-violet)]';

  const diffMs = new Date(endDate).getTime() - Date.now();
  const hours = diffMs / (1000 * 60 * 60);

  if (hours < 24) return 'text-[var(--pact-pink)]'; // Urgent
  if (hours < 72) return 'text-[var(--pact-gold)]'; // Medium
  return 'text-[var(--pact-violet)]'; // Comfortable
}

export default function DareCard({ dare, onClick }: DareCardProps) {
  const creatorAvatar = dare.creator_avatar_url?.trim()
    ? dare.creator_avatar_url
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${dare.creator_username || dare.creator_id}`;

  const initials = (dare.creator_full_name || dare.creator_username || '?')
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const timeRemaining = formatEndsIn(dare.complete_by_date);
  const urgencyClass = getUrgencyColor(dare.complete_by_date);

  return (
    <div
      onClick={onClick}
      className="pact-card rounded-[28px] overflow-hidden cursor-pointer transition"
      style={{ background: 'var(--pact-surface)', border: '1px solid var(--pact-hairline)' }}
    >
      {/* Header */}
      <div className="p-4 border-b border-[var(--pact-hairline)]">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
            style={{ background: 'var(--pact-surface-2)' }}
          >
            {creatorAvatar && (
              <Image
                src={creatorAvatar}
                alt={dare.creator_username || 'creator'}
                fill
                className="object-cover"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.style.display = 'none';
                }}
              />
            )}
            {!creatorAvatar || creatorAvatar.includes('dicebear') ? (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[var(--pact-text-muted)]">
                {initials}
              </div>
            ) : null}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--pact-text)] truncate">
              {dare.creator_full_name || dare.creator_username || 'Anonymous'}
            </p>
            <p className="text-xs text-[var(--pact-text-faint)]">@{dare.creator_username || 'user'}</p>
          </div>
        </div>

        {/* Title and Description */}
        <h3 className="font-bold text-base text-[var(--pact-text)] mb-1 line-clamp-2">{dare.title}</h3>
        <p className="text-sm text-[var(--pact-text-dim)] line-clamp-2">{dare.description}</p>
      </div>

      {/* Stats */}
      <div
        className="px-4 py-3 border-b border-[var(--pact-hairline)] grid grid-cols-3 gap-2"
        style={{ background: 'var(--pact-surface-2)' }}
      >
        <div className="text-center">
          <p className="text-lg font-bold text-[var(--pact-violet)]">{dare.recipientCount || 0}</p>
          <p className="text-xs text-[var(--pact-text-faint)]">Recipients</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-[var(--pact-violet)]">{dare.acceptedCount || 0}</p>
          <p className="text-xs text-[var(--pact-text-faint)]">Accepted</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-[var(--pact-violet)]">{dare.completedCount || 0}</p>
          <p className="text-xs text-[var(--pact-text-faint)]">Completed</p>
        </div>
      </div>

      {/* Footer with deadline */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock className={`w-4 h-4 ${urgencyClass}`} />
          <span className={`text-sm font-semibold ${urgencyClass}`}>{timeRemaining}</span>
        </div>
        <ChevronRight className="w-5 h-5 text-[var(--pact-text-faint)]" />
      </div>
    </div>
  );
}
