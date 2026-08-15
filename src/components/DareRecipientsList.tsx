'use client';

import React from 'react';
import Image from 'next/image';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { DareRecipient } from '@/types';

interface DareRecipientsListProps {
  recipients: DareRecipient[];
  isLoading?: boolean;
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-[var(--pact-gold)]',
  },
  accepted: {
    label: 'Accepted',
    icon: CheckCircle2,
    color: 'text-[var(--pact-violet)]',
  },
  declined: {
    label: 'Declined',
    icon: XCircle,
    color: 'text-[var(--pact-pink)]',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-[var(--pact-violet)]',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    color: 'text-[var(--pact-pink)]',
  },
};

export default function DareRecipientsList({ recipients, isLoading }: DareRecipientsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="pact-shimmer h-12 rounded-[28px]" />
        ))}
      </div>
    );
  }

  if (!recipients || recipients.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[var(--pact-text-dim)]">No recipients yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recipients.map((recipient) => {
        const user = recipient.user;
        const statusConfig = STATUS_CONFIG[recipient.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
        const StatusIcon = statusConfig.icon;

        const avatarSrc = user?.avatar_url?.trim()
          ? user.avatar_url
          : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || recipient.user_id}`;

        return (
          <div
            key={recipient.id}
            className="flex items-center gap-3 p-3 rounded-[28px] border border-[var(--pact-hairline)]"
            style={{ background: 'var(--pact-surface)' }}
          >
            <div className="relative w-10 h-10 rounded-full flex-shrink-0 overflow-hidden" style={{ background: 'var(--pact-surface-2)' }}>
              <Image
                src={avatarSrc}
                alt={user?.username || 'user'}
                fill
                className="object-cover"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.style.display = 'none';
                }}
              />
              {!avatarSrc || avatarSrc.includes('dicebear') ? (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[var(--pact-text-muted)]">
                  {(user?.username || '?')[0].toUpperCase()}
                </div>
              ) : null}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--pact-text)] truncate">
                {user?.full_name || user?.username || 'Unknown User'}
              </p>
              <p className="text-xs text-[var(--pact-text-faint)]">@{user?.username || 'user'}</p>
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className={`flex items-center gap-1 text-xs font-semibold ${statusConfig.color}`}>
                <StatusIcon className="w-4 h-4" />
                {statusConfig.label}
              </div>
              {recipient.responded_at && (
                <p className="text-xs text-[var(--pact-text-faint)]">{new Date(recipient.responded_at).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
