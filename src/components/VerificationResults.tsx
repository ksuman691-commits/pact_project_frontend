'use client';

import React, { useEffect, useState } from 'react';
import { Loader, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

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
        const response = await fetch(`/api/verifications/${pactId}/stats`);

        if (!response.ok) {
          throw new Error('Failed to fetch verification stats');
        }

        const data = await response.json();
        setStats(data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching verification stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [pactId]);

  if (loading) {
    return (
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-6 flex items-center justify-center min-h-[200px]">
        <Loader className="w-6 h-6 animate-spin text-indigo-600 mr-3" />
        <p className="text-slate-600 font-medium">Loading verification results...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <h3 className="font-semibold text-red-900">Unable to load verification results</h3>
        </div>
        <p className="text-sm text-red-700">{error || 'No verifications yet'}</p>
      </div>
    );
  }

  // Determine confidence level color
  const getConfidenceColor = (score: number): string => {
    if (score >= 80) return 'from-emerald-500 to-green-600';
    if (score >= 60) return 'from-yellow-500 to-orange-600';
    if (score >= 40) return 'from-orange-500 to-red-600';
    return 'from-red-500 to-red-600';
  };

  const getConfidenceLevel = (score: number): string => {
    if (score >= 80) return 'High';
    if (score >= 60) return 'Moderate';
    if (score >= 40) return 'Low';
    return 'Very Low';
  };

  return (
    <div className="space-y-4">
      {/* Main Confidence Card */}
      <div className={`rounded-xl bg-gradient-to-br ${getConfidenceColor(stats.confidence_score)} p-6 text-white`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-white/90">Verified Confidence</p>
            <p className="text-4xl font-black mt-1">{Math.round(stats.confidence_score)}%</p>
          </div>
          <CheckCircle2 className="w-10 h-10 text-white/80" strokeWidth={1.5} />
        </div>
        <p className="text-sm text-white/80 mb-4">
          {getConfidenceLevel(stats.confidence_score)} confidence level based on {stats.total_verifications} verification
          {stats.total_verifications !== 1 ? 's' : ''}
        </p>
        <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/90 transition-all"
            style={{ width: `${stats.confidence_score}%` }}
          />
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <ScoreCard
          label="Completion"
          score={stats.completion_score}
          weight={40}
          color="bg-blue-50 border-blue-200"
          textColor="text-blue-900"
        />
        <ScoreCard
          label="Authenticity"
          score={stats.authenticity_score}
          weight={30}
          color="bg-purple-50 border-purple-200"
          textColor="text-purple-900"
        />
        <ScoreCard
          label="Rule Adherence"
          score={stats.rule_adherence_score}
          weight={20}
          color="bg-emerald-50 border-emerald-200"
          textColor="text-emerald-900"
        />
        <ScoreCard
          label="Reputation"
          score={stats.reputation_confidence_score}
          weight={10}
          color="bg-orange-50 border-orange-200"
          textColor="text-orange-900"
        />
      </div>

      {/* Verification Count */}
      <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">Total Verifications</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total_verifications}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-600 font-medium">COMMUNITY REVIEWED</p>
          <p className="text-sm text-slate-700 mt-2">
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
  color,
  textColor,
}: {
  label: string;
  score: number;
  weight: number;
  color: string;
  textColor: string;
}) {
  return (
    <div className={`rounded-lg border ${color} p-4`}>
      <div className="flex items-center justify-between mb-2">
        <p className={`text-sm font-semibold ${textColor}`}>{label}</p>
        <span className="text-xs font-medium text-slate-600">{weight}% weight</span>
      </div>
      <p className={`text-2xl font-bold ${textColor}`}>{Math.round(score)}%</p>
      <div className="w-full h-1.5 bg-slate-300/50 rounded-full overflow-hidden mt-2">
        <div
          className={`h-full bg-gradient-to-r ${getScoreGradient(label)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function getScoreGradient(label: string): string {
  const gradients: Record<string, string> = {
    Completion: 'from-blue-400 to-blue-600',
    Authenticity: 'from-purple-400 to-purple-600',
    'Rule Adherence': 'from-emerald-400 to-emerald-600',
    Reputation: 'from-orange-400 to-orange-600',
  };
  return gradients[label] || 'from-slate-400 to-slate-600';
}
