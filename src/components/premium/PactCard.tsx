import React from 'react';
import { Pact } from '@/types';
import { DollarSign, Clock, TrendingUp, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PremiumCard from './PremiumCard';

interface PactCardProps {
  pact: Pact;
  confidence?: number;
  cheers?: number;
  skipped?: number;
  proofToday?: boolean;
}

export default function PactCard({
  pact,
  confidence = 75,
  cheers = 342,
  skipped = 28,
  proofToday = false,
}: PactCardProps) {
  const router = useRouter();
  const deadline = pact.deadline ?? pact.end_date;
  const daysRemaining = Math.max(0, Math.floor(
    (new Date(deadline ?? '').getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ));

  const progressPercent = 65; // TODO: Calculate from real data

  return (
    <PremiumCard
      clickable
      onClick={() => router.push(`/pacts/${pact.id}`)}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-[#14121F] text-base leading-tight mb-1">
              {pact.title}
            </h3>
            <p className="text-xs text-[#6B7280]">{pact.description}</p>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
            pact.status === 'active'
              ? 'bg-[var(--card)] text-[var(--navy)]'
              : 'bg-[#FAF9FE] text-[var(--ink-soft)]'
          }`}>
            {pact.status}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-2">
          {/* Confidence */}
          <div className="bg-[var(--card)] rounded-md p-2.5 border border-[var(--line)]">
            <p className="text-xs font-medium text-[var(--navy)] mb-0.5">Confidence</p>
            <p className="text-lg font-bold text-[var(--ink)]">{confidence}%</p>
          </div>

          {/* Time Remaining */}
          <div className="bg-[var(--warn-bg)] rounded-md p-2.5 border border-[var(--line)]">
            <div className="flex items-center gap-1 mb-0.5">
              <Clock className="w-3 h-3 text-[var(--warn-text)]" />
              <p className="text-xs font-medium text-[var(--warn-text)]">Days</p>
            </div>
            <p className="text-lg font-bold text-[var(--ink)]">{daysRemaining}</p>
          </div>

          {/* Participants */}
          <div className="bg-card-muted rounded-md p-2.5 border border-hairline">
            <div className="flex items-center gap-1 mb-0.5">
              <Users className="w-3 h-3 text-ink" />
              <p className="text-xs font-medium text-ink">People</p>
            </div>
            <p className="text-lg font-bold text-ink">4</p>
          </div>
        </div>

        {/* Cheer / Skip */}
        <div className="flex gap-2">
          <div className="flex-1 bg-card rounded-md p-2 border border-hairline text-center">
            <p className="text-xs text-[var(--navy)] font-medium">Cheers</p>
            <p className="text-sm font-bold text-[var(--ink)]">{cheers}</p>
          </div>
          <div className="flex-1 bg-[var(--warn-bg)] rounded-md p-2 border border-[var(--line)] text-center">
            <p className="text-xs text-[var(--warn-text)] font-medium">Skipped</p>
            <p className="text-sm font-bold text-[var(--ink)]">{skipped}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-[var(--ink-soft)]">Progress</p>
            <p className="text-xs font-bold text-[#14121F]">{progressPercent}%</p>
          </div>
          <div className="w-full h-2 bg-[var(--line)] rounded-full overflow-hidden">
            <div
              className="h-full bg-navy rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* CTA Buttons */}
        <button className="w-full py-2.5 rounded-md bg-navy hover:bg-navy-hover text-white font-semibold text-sm transition-all">
          {proofToday ? 'View Proof' : 'Upload Proof'}
        </button>
      </div>
    </PremiumCard>
  );
}
