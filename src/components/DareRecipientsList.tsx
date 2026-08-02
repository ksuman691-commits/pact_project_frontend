'use client';

import React from 'react';
import Image from 'next/image';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { DareRecipient, User } from '@/types';

interface DareRecipientsListProps {
  recipients: DareRecipient[];
  isLoading?: boolean;
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  accepted: {
    label: 'Accepted',
    icon: CheckCircle2,
    color: 'text-[#A78BFA]',
    bgColor: 'bg-[#EDE9FE]',
  },
  declined: {
    label: 'Declined',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-[#A78BFA]',
    bgColor: 'bg-[#EDE9FE]',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
};

export default function DareRecipientsList({ recipients, isLoading }: DareRecipientsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-200 rounded-[28px] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!recipients || recipients.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[#6B7280]">No recipients yet</p>
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
          <div key={recipient.id} className={`flex items-center gap-3 p-3 rounded-[28px] border border-[rgba(20,18,31,0.06)] ${statusConfig.bgColor}`}>
            <div className="relative w-10 h-10 rounded-full bg-slate-300 flex-shrink-0 overflow-hidden">
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
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[#6B7280]">
                  {(user?.username || '?')[0].toUpperCase()}
                </div>
              ) : null}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#14121F] truncate">
                {user?.full_name || user?.username || 'Unknown User'}
              </p>
              <p className="text-xs text-[#6B7280]">@{user?.username || 'user'}</p>
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className={`flex items-center gap-1 text-xs font-semibold ${statusConfig.color}`}>
                <StatusIcon className="w-4 h-4" />
                {statusConfig.label}
              </div>
              {recipient.responded_at && (
                <p className="text-xs text-[#9CA3AF]">{new Date(recipient.responded_at).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
