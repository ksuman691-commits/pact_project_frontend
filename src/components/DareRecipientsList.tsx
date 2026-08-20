'use client';

import React from 'react';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { DareRecipient } from '@/types';
import Avatar from '@/components/Avatar';
import MemberAvatarStack from '@/components/MemberAvatarStack';
import { parseApiDate } from '@/lib/dareCountdown';

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

  // Compact "who" summary above the detailed rows — reuses the exact
  // same MemberAvatarStack built for Circle cards rather than a second
  // one-off implementation, so both surfaces stay visually consistent.
  const stackMembers = recipients.map((recipient) => ({
    userId: recipient.user_id,
    name: recipient.full_name || recipient.username,
    username: recipient.username,
    avatarUrl: recipient.avatar_url,
  }));

  return (
    <div className="space-y-4">
      <MemberAvatarStack members={stackMembers} size={36} />

      <div className="space-y-2">
        {recipients.map((recipient) => {
          const statusConfig = STATUS_CONFIG[recipient.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={recipient.id}
              className="flex items-center gap-3 p-3 rounded-[28px] border border-[var(--pact-hairline)]"
              style={{ background: 'var(--pact-surface)' }}
            >
              <Avatar name={recipient.full_name || recipient.username} avatarUrl={recipient.avatar_url} size={40} />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--pact-text)] truncate">
                  {recipient.full_name || recipient.username || 'Unknown User'}
                </p>
                <p className="text-xs text-[var(--pact-text-faint)]">@{recipient.username || 'user'}</p>
              </div>

              <div className="flex flex-col items-end gap-1">
                <div className={`flex items-center gap-1 text-xs font-semibold ${statusConfig.color}`}>
                  <StatusIcon className="w-4 h-4" />
                  {statusConfig.label}
                </div>
                {parseApiDate(recipient.responded_at) && (
                  <p className="text-xs text-[var(--pact-text-faint)]">
                    {parseApiDate(recipient.responded_at)!.toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
