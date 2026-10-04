'use client';

import React, { useEffect, useState } from 'react';
import { Loader, CheckCircle2, AlertCircle } from 'lucide-react';
import { verificationService } from '@/services/api';

interface VerificationStats {
  confidence_score: number;
  total_verifications: number;
  completion_score: number;
  authenticity_score: number;
  rule_adherence_score: number;
  reputation_confidence_score: number;
}

interface VerificationResultsProps {
  pactId: number;
}

export default function VerificationResults({ pactId }: VerificationResultsProps) {
  const [stats, setStats] = useState<VerificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await verificationService.getStats(pactId);
        const apiStats = response.data || {};
        const normalizedStats: VerificationStats = {
          confidence_score: Number(
            apiStats.confidence_score ?? apiStats.average_confidence_score ?? 0
          ),
          total_verifications: Number(apiStats.total_verifications ?? 0),
          completion_score: Number(apiStats.completion_score ?? 0),
          authenticity_score: Number(apiStats.authenticity_score ?? 0),
          rule_adherence_score: Number(apiStats.rule_adherence_score ?? 0),
          reputation_confidence_score: Number(apiStats.reputation_confidence_score ?? 0),
        };
        setStats(normalizedStats);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching verification stats:', err);
        const message = err?.response?.data?.detail || err?.message || 'Failed to fetch verification stats';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [pactId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-[28px] border border-[rgba(20,18,31,0.06)] bg-[#F4F2FB] p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="h-4 w-32 animate-pulse rounded-full bg-[var(--line)]" />
              <div className="h-10 w-24 animate-pulse rounded-full bg-[var(--line)]" />
            </div>
            <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--line)]" />
          </div>
          <div className="mt-6 h-2 rounded-full bg-[var(--line)]">
            <div className="h-full w-2/3 rounded-full bg-[var(--line)]" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 animate-pulse rounded-[24px] border border-[rgba(20,18,31,0.06)] bg-[#F4F2FB]" />
          <div className="h-24 animate-pulse rounded-[24px] border border-[rgba(20,18,31,0.06)] bg-[#F4F2FB]" />
          <div className="h-24 animate-pulse rounded-[24px] border border-[rgba(20,18,31,0.06)] bg-[#F4F2FB]" />
          <div className="h-24 animate-pulse rounded-[24px] border border-[rgba(20,18,31,0.06)] bg-[#F4F2FB]" />
        </div>

        <div className="rounded-[20px] border border-[rgba(20,18,31,0.06)] bg-[#F4F2FB] p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-4 w-28 animate-pulse rounded-full bg-[var(--line)]" />
              <div className="h-7 w-16 animate-pulse rounded-full bg-[var(--line)]" />
            </div>
            <div className="h-8 w-24 animate-pulse rounded-full bg-[var(--line)]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-[24px] bg-[var(--warn-bg)] border border-[var(--line)] p-6">
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle className="w-6 h-6 text-[var(--warn-text)]" />
          <h3 className="font-semibold text-[var(--ink)]">Unable to load verification results</h3>
        </div>
        <p className="text-sm text-[var(--warn-text)]">{error || 'No verifications yet'}</p>
      </div>
    );
  }

  const getConfidenceLevel = (score: number): string => {
    if (score >= 80) return 'High';
    if (score >= 60) return 'Moderate';
    if (score >= 40) return 'Low';
    return 'Very Low';
  };

  return (
    <div className="space-y-4">
      {/* Main Confidence Card */}
      <div className="rounded-[14px] bg-[var(--navy)] p-6 text-[var(--card)]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-[var(--card)]/80">Verified Confidence</p>
            <p className="text-4xl font-bold mt-1">{Math.round(stats.confidence_score)}%</p>
          </div>
          <CheckCircle2 className="w-10 h-10 text-[var(--card)]/70" strokeWidth={1.5} />
        </div>
        <p className="text-sm text-[var(--card)]/75 mb-4">
          {getConfidenceLevel(stats.confidence_score)} confidence level based on {stats.total_verifications} verification
          {stats.total_verifications !== 1 ? 's' : ''}
        </p>
        <div className="w-full h-2 bg-[var(--card)]/25 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--card)] transition-all"
            style={{ width: `${stats.confidence_score}%` }}
          />
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <ScoreCard label="Completion" score={stats.completion_score} weight={40} />
        <ScoreCard label="Authenticity" score={stats.authenticity_score} weight={30} />
        <ScoreCard label="Rule Adherence" score={stats.rule_adherence_score} weight={20} />
        <ScoreCard label="Reputation" score={stats.reputation_confidence_score} weight={10} />
      </div>

      {/* Verification Count */}
      <div className="rounded-[14px] bg-[var(--card)] border border-[var(--hairline)] p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--muted)]">Total Verifications</p>
          <p className="text-2xl font-bold text-[var(--ink)] mt-1">{stats.total_verifications}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--muted)] font-medium">Community reviewed</p>
          <p className="text-sm text-[var(--ink-soft)] mt-2">
            {stats.total_verifications === 0
              ? 'Awaiting reviews'
              : `${Math.round((stats.confidence_score / 100) * stats.total_verifications)} approved`}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Individual score card component
 */
function ScoreCard({
  label,
  score,
  weight,
}: {
  label: string;
  score: number;
  weight: number;
}) {
  return (
    <div className="rounded-[14px] border border-[var(--hairline)] bg-[var(--card)] p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-[var(--ink)]">{label}</p>
        <span className="text-xs font-medium text-[var(--muted)]">{weight}% weight</span>
      </div>
      <p className="text-2xl font-bold text-[var(--ink)]">{Math.round(score)}%</p>
      <div className="w-full h-1.5 bg-[var(--hairline)] rounded-full overflow-hidden mt-2">
        <div
          className="h-full bg-[var(--navy)]"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
