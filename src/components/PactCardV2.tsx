'use client';

import React, { useState } from 'react';
import { MessageCircle, Share2, Camera, MoreVertical, ThumbsUp, ThumbsDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import ProofUploadModal from './ProofUploadModal';
import ShareModal from './ShareModal';
import ReportPactModal from './ReportPactModal';
import { useVoteSupport, useVoteSkip } from '@/hooks/useReportingMutations';

interface PactCardV2Props {
  pact: any;
  userVote?: string | null;
  onProofUpload?: (pactId: number, proof?: any) => void;
}

export default function PactCardV2({
  pact,
  userVote,
  onProofUpload,
}: PactCardV2Props) {
  const [proofUploadModal, setProofUploadModal] = useState(false);
  const [shareModal, setShareModal] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [currentVote, setCurrentVote] = useState<'support' | 'skip' | null>(userVote as any);
  
  const voteSupportMutation = useVoteSupport();
  const voteSkipMutation = useVoteSkip();

  // Use new support_count field (from reporting system)
  const supportCount = pact.support_count ?? pact.believers ?? 0;
  const recentSupporters = pact.recent_supporters ?? [];
  const reportCount = pact.report_count ?? 0;
  const isReportedByMe = pact.is_reported_by_me ?? false;

  // Handle auto-hidden pacts (report_count >= 4)
  if (reportCount >= 4) {
    return null; // Auto-hide from feed
  }

  const creatorLabel = pact.creator || pact.creator_username || 'unknown';
  const creatorUsername = pact.creator_username || null;
  const creatorProfileHref = creatorUsername
    ? `/profile/${encodeURIComponent(creatorUsername)}`
    : null;
  const circleLabel = pact.circle || pact.circle_name || null;
  const creatorAvatarUrl = pact.creatorAvatarUrl || pact.creator_avatar_url || null;

  const formatVoteCount = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return `${count}`;
  };

  const handleVoteSupport = async () => {
    setCurrentVote('support');
    try {
      await voteSupportMutation.mutateAsync(pact.id);
      toast.success('You voted support!');
    } catch (error) {
      setCurrentVote(userVote as any);
      console.error('[v0] Vote support error:', error);
    }
  };

  const handleVoteSkip = async () => {
    setCurrentVote('skip');
    try {
      await voteSkipMutation.mutateAsync(pact.id);
      toast.success('You voted skip!');
    } catch (error) {
      setCurrentVote(userVote as any);
      console.error('[v0] Vote skip error:', error);
    }
  };

  // Media display from proof_url or proofClips
  const proofUrl = pact.proof_url || null;
  const proofType = pact.proof_type || null;
  const proofClips = Array.isArray(pact.proofClips) ? pact.proofClips : [];
  const mediaUrl = proofUrl || (proofClips.length > 0 ? proofClips[0]?.url : null);
  const mediaType = proofType || (proofClips.length > 0 ? proofClips[0]?.type : 'photo');

  return (
    <>
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow mb-4 mx-2 sm:mx-0">
        
        {/* 1. HEADER ROW - Avatar, Username, Label, Menu */}
        <div className="px-4 py-4 flex items-start justify-between border-b border-slate-100">
          <div className="flex items-start gap-3 flex-1">
            {/* Avatar */}
            {creatorProfileHref ? (
              <Link href={creatorProfileHref} className="block" aria-label={`View @${creatorLabel} profile`}>
                {creatorAvatarUrl ? (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-slate-200">
                    <Image
                      src={creatorAvatarUrl}
                      alt={creatorLabel}
                      fill
                      unoptimized
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {pact.avatar || creatorLabel.charAt(0).toUpperCase() || '🔥'}
                  </div>
                )}
              </Link>
            ) : creatorAvatarUrl ? (
              <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-slate-200">
                <Image
                  src={creatorAvatarUrl}
                  alt={creatorLabel}
                  fill
                  unoptimized
                  sizes="48px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                {pact.avatar || creatorLabel.charAt(0).toUpperCase() || '🔥'}
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              {/* Username and label row */}
              <div className="flex items-baseline gap-2 mb-0.5">
                {creatorProfileHref ? (
                  <Link href={creatorProfileHref} className="font-bold text-slate-900 hover:text-emerald-700 transition-colors">
                    @{creatorLabel}
                  </Link>
                ) : (
                  <h3 className="font-bold text-slate-900">@{creatorLabel}</h3>
                )}
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                  {pact.daysCurrent && pact.daysTotal ? `Day ${pact.daysCurrent} of ${pact.daysTotal}` : 'Active pact'}
                </p>
              </div>
              {circleLabel && (
                <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide">
                  {circleLabel}
                </p>
              )}
            </div>
          </div>

          {/* Menu button with report option */}
          <button
            onClick={() => setReportModal(true)}
            className="p-1 text-slate-400 hover:text-red-600 transition flex-shrink-0"
            title="Report or options"
            aria-label="Report pact"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* 2. HERO SECTION - Large title */}
        <Link href={`/pact-details/${pact.id}`}>
          <div className="px-4 py-5 cursor-pointer hover:bg-slate-50 transition">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
              {pact.title}
            </h2>
          </div>
        </Link>

        {/* 3. PROOF GRID - Full width media or grid */}
        {mediaUrl ? (
          <div className="px-4 py-4 border-t border-slate-100">
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              {mediaType === 'video' ? (
                <video
                  src={mediaUrl}
                  className="w-full aspect-video object-cover"
                  muted
                  playsInline
                />
              ) : (
                <Image
                  src={mediaUrl}
                  alt={pact.title}
                  width={400}
                  height={300}
                  unoptimized
                  className="w-full aspect-video object-cover"
                />
              )}
            </div>
          </div>
        ) : (
          <div className="px-4 py-4 border-t border-slate-100">
            <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="text-sm text-slate-600 font-medium">No proof uploaded yet</p>
            </div>
          </div>
        )}

        {/* SUPPORT SECTION - Only show support_count (no skip shown) */}
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-end gap-4 mb-4">
            {/* Progress bar - simple support percentage */}
            <div className="flex-1">
              <div className="h-6 rounded-full overflow-hidden bg-emerald-100">
                <div
                  className="h-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold transition-all"
                  style={{ width: `${Math.min(supportCount / 10, 100)}%` }}
                >
                  {supportCount > 0 && `${Math.min(supportCount, 100)}+`}
                </div>
              </div>
            </div>

            {/* Time remaining */}
            <div className="text-right flex-shrink-0 min-w-max">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Ends in</p>
              <p className="text-sm font-black text-emerald-600">{pact.timeRemaining}</p>
            </div>
          </div>

          {/* Support summary - only support count visible */}
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-lg font-black text-slate-900">
                {formatVoteCount(supportCount)} Supporters
              </p>
              {recentSupporters.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  {recentSupporters.slice(0, 3).map((supporter: any, idx: number) => (
                    <div
                      key={idx}
                      className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold border border-white"
                      title={supporter.name}
                    >
                      {supporter.avatar ? (
                        <Image
                          src={supporter.avatar}
                          alt={supporter.name}
                          fill
                          unoptimized
                          sizes="24px"
                          className="object-cover rounded-full"
                        />
                      ) : (
                        supporter.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                  ))}
                  {recentSupporters.length > 3 && (
                    <span className="text-xs text-slate-600 font-semibold ml-1">+{recentSupporters.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* VOTING BUTTONS - Support and Skip */}
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex gap-3">
            <button
              onClick={handleVoteSupport}
              disabled={voteSupportMutation.isPending}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full font-bold text-base transition-all transform ${
                currentVote === 'support'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/40'
                  : 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300 hover:bg-emerald-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <ThumbsUp className="w-5 h-5" />
              Support
            </button>

            <button
              onClick={handleVoteSkip}
              disabled={voteSkipMutation.isPending}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full font-bold text-base transition-all transform ${
                currentVote === 'skip'
                  ? 'bg-slate-600 text-white shadow-lg shadow-slate-600/40'
                  : 'bg-slate-100 text-slate-700 border-2 border-slate-300 hover:bg-slate-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <ThumbsDown className="w-5 h-5" />
              Skip
            </button>
          </div>
        </div>

        {/* FOOTER - Members, action icons */}
        <div className="px-4 py-4 flex items-center justify-between border-t border-slate-100">
          {/* Report badge if I reported it */}
          {isReportedByMe && (
            <div className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
              Reported
            </div>
          )}
          {!isReportedByMe && <div />}

          {/* Proof count */}
          <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide">
            {proofClips.length || 0} Proofs
          </p>

          {/* Action icons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setProofUploadModal(true)}
              className="text-slate-600 hover:text-slate-900 transition"
              title="Submit progress"
            >
              <Camera className="w-5 h-5" />
            </button>

            <Link href={`/pact-details/${pact.id}`}>
              <button
                className="text-slate-600 hover:text-slate-900 transition flex items-center gap-1"
                title="Comments"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-xs font-medium">{pact.comments?.length || 0}</span>
              </button>
            </Link>

            <button
              onClick={() => setShareModal(true)}
              className="text-slate-600 hover:text-slate-900 transition"
              title="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProofUploadModal
        isOpen={proofUploadModal}
        onClose={() => setProofUploadModal(false)}
        pactId={pact.id}
        onUpload={(pactId, proof) => onProofUpload?.(pactId, proof)}
      />
      <ShareModal
        isOpen={shareModal}
        onClose={() => setShareModal(false)}
        pact={pact}
      />
      <ReportPactModal
        isOpen={reportModal}
        onClose={() => setReportModal(false)}
        pactId={pact.id}
        pactTitle={pact.title}
      />
    </>
  );
}
