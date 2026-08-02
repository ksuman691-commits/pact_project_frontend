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
  if (!endDateRaw) return 'soon';

  const endDate = new Date(endDateRaw);
  if (Number.isNaN(endDate.getTime())) return 'soon';

  const diffMs = endDate.getTime() - Date.now();
  if (diffMs <= 0) return 'ended';

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days > 0) return `${days}d ${hours}h`;
  if (totalHours > 0) return `${totalHours}h`;

  const minutes = Math.max(Math.floor(diffMs / (1000 * 60)), 1);
  return `${minutes}m`;
}

function getUrgencyColor(endDate?: string): string {
  if (!endDate) return 'text-emerald-600';

  const diffMs = new Date(endDate).getTime() - Date.now();
  const hours = diffMs / (1000 * 60 * 60);

  if (hours < 24) return 'text-red-600'; // Red for urgent
  if (hours < 72) return 'text-amber-600'; // Amber for medium
  return 'text-emerald-600'; // Green for comfortable
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
      className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
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
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-600">
                {initials}
              </div>
            ) : null}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {dare.creator_full_name || dare.creator_username || 'Anonymous'}
            </p>
            <p className="text-xs text-slate-500">@{dare.creator_username || 'user'}</p>
          </div>
        </div>

        {/* Title and Description */}
        <h3 className="font-bold text-base text-slate-900 mb-1 line-clamp-2">{dare.title}</h3>
        <p className="text-sm text-slate-600 line-clamp-2">{dare.description}</p>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 grid grid-cols-3 gap-2">
        <div className="text-center">
          <p className="text-lg font-bold text-emerald-600">{dare.recipientCount || 0}</p>
          <p className="text-xs text-slate-600">Recipients</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-emerald-600">{dare.acceptedCount || 0}</p>
          <p className="text-xs text-slate-600">Accepted</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-emerald-600">{dare.completedCount || 0}</p>
          <p className="text-xs text-slate-600">Completed</p>
        </div>
      </div>

      {/* Footer with deadline */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock className={`w-4 h-4 ${urgencyClass}`} />
          <span className={`text-sm font-semibold ${urgencyClass}`}>{timeRemaining}</span>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </div>
    </div>
  );
}
