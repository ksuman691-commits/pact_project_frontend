'use client';

import React, { useState, useCallback } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useGetMyReports } from '@/hooks/useReportingMutations';

const REPORT_REASON_LABELS = {
  fake_or_ai: 'Fake or AI Generated',
  spam: 'Spam',
  offensive: 'Offensive Content',
};

export default function ReportedPactsTab() {
  const [skip, setSkip] = useState(0);
  const limit = 10;
  const { data: response, isLoading, hasNextPage = false, fetchNextPage } = useGetMyReports(skip, limit);

  const reportedPacts = response?.data || [];
  const pagination = response?.pagination || {};
  const hasMore = pagination?.has_more ?? false;

  const handleLoadMore = useCallback(() => {
    if (hasMore) {
      setSkip((prev) => prev + limit);
    }
  }, [hasMore]);

  if (isLoading && reportedPacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin mb-3" />
        <p className="text-slate-600 font-medium">Loading reported pacts...</p>
      </div>
    );
  }

  if (reportedPacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
        <p className="text-slate-700 font-semibold text-center mb-1">No Reported Pacts</p>
        <p className="text-slate-600 text-sm text-center">
          When you report pacts, they&apos;ll appear here for tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reportedPacts.map((pact: any) => {
        const reason = pact.report_reason || 'unknown';
        const reasonLabel = REPORT_REASON_LABELS[reason as keyof typeof REPORT_REASON_LABELS] || reason;

        return (
          <div
            key={pact.id}
            className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition"
          >
            <div className="flex items-start gap-3 mb-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {pact.creator?.charAt(0)?.toUpperCase() || '?'}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <Link href={`/pact-details/${pact.id}`}>
                    <h3 className="font-bold text-slate-900 hover:text-emerald-700 transition text-sm line-clamp-2">
                      {pact.title}
                    </h3>
                  </Link>
                  <div className="flex-shrink-0 px-2 py-1 rounded-md bg-red-100 text-red-700 text-xs font-semibold whitespace-nowrap">
                    Reported
                  </div>
                </div>
                <p className="text-xs text-slate-600 mb-2">
                  by <span className="font-semibold">@{pact.creator}</span>
                </p>

                {/* Report Reason Badge */}
                <div className="flex items-center gap-2">
                  <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-md">
                    {reasonLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Action */}
            <Link href={`/pact-details/${pact.id}`}>
              <button className="w-full px-3 py-2 rounded-lg border border-emerald-600 text-emerald-700 text-sm font-semibold hover:bg-emerald-50 transition">
                View Pact
              </button>
            </Link>
          </div>
        );
      })}

      {/* Load More Button */}
      {hasMore && (
        <button
          onClick={handleLoadMore}
          disabled={isLoading}
          className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 text-slate-900 font-semibold hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
