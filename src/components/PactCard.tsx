'use client';

import React, { useState } from 'react';
import { MessageCircle, Share2, Camera, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import ProofUploadModal from './ProofUploadModal';
import ShareModal from './ShareModal';

interface PactCardProps {
  pact: any;
  onVote?: (pactId: number, vote: string) => void;
  userVote?: string | null;
  onProofUpload?: (pactId: number, proof?: any) => void;
}

export default function PactCard({
  pact,
  onVote,
  userVote,
  onProofUpload,
}: PactCardProps) {
  const [proofUploadModal, setProofUploadModal] = useState(false);
  const [shareModal, setShareModal] = useState(false);
  const [currentVote, setCurrentVote] = useState<'believe' | 'doubt' | null>(userVote as any);
  
  // Calculate percentages, handling zero/null values
  const believers = pact.believers ?? 0;
  const doubters = pact.doubters ?? 0;
  const totalVotes = believers + doubters;
  const believePercent = totalVotes > 0 ? Math.round((believers / totalVotes) * 100) : 50;
  const doubtPercent = 100 - believePercent;
  const proofClips = Array.isArray(pact.proofClips) ? pact.proofClips : [];
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

  const handleVote = (vote: 'believe' | 'doubt') => {
    setCurrentVote(vote);
    onVote?.(pact.id, vote);
    toast.success(`You voted ${vote}!`);
  };

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
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
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
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                {pact.avatar || creatorLabel.charAt(0).toUpperCase() || '🔥'}
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              {/* Username and label row */}
              <div className="flex items-baseline gap-2 mb-0.5">
                {creatorProfileHref ? (
                  <Link href={creatorProfileHref} className="font-bold text-slate-900 hover:text-blue-700 transition-colors">
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

          {/* Menu button */}
          <button className="p-1 text-slate-400 hover:text-slate-600 transition flex-shrink-0">
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

        {/* 3. PROOF GRID - 2-column layout with thumbnails */}
        {proofClips.length > 0 ? (
          <div className="px-4 py-4 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-3">
              {proofClips.slice(0, 2).map((clip: any, idx: number) => (
                (() => {
                  const mediaUrl = clip.url || clip.file_url || '';
                  const hasMediaUrl = typeof mediaUrl === 'string' && mediaUrl.trim().length > 0;
                  const isVideo = clip.type === 'video' || clip.proof_type === 'video';

                  return (
                <div
                  key={clip.id || idx}
                  className="aspect-square rounded-xl bg-slate-100 border-2 border-slate-300 overflow-hidden relative"
                >
                  {isVideo && hasMediaUrl ? (
                    <video
                      src={mediaUrl}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  ) : hasMediaUrl ? (
                    <Image
                      src={mediaUrl}
                      alt={clip.text || clip.caption || `Proof ${idx + 1}`}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 50vw, 240px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-medium bg-slate-100">
                      No media
                    </div>
                  )}
                  <div className="absolute left-2 bottom-2 px-2 py-1 rounded-md bg-black/60 text-white text-xs">
                    {clip.text || clip.caption || `Proof ${idx + 1}`}
                  </div>
                </div>
                  );
                })()
              ))}
            </div>
          </div>
        ) : (
          <div className="px-4 py-4 border-t border-slate-100">
            <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="text-sm text-slate-600 font-medium">No proof uploaded yet</p>
            </div>
          </div>
        )}

        {/* SENTIMENT BAR - Blue-red gradient with vote summary */}
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-end gap-4 mb-4">
            {/* Progress bar */}
            <div className="flex-1">
              <div className="h-6 rounded-full overflow-hidden flex shadow-sm">
                {/* Believe segment - ensure minimum width if not 0 */}
                <div
                  className="bg-blue-600 flex items-center justify-center text-white text-xs font-bold transition-all"
                  style={{ 
                    width: `${believePercent}%`,
                    minWidth: believePercent > 0 ? '40px' : '0'
                  }}
                >
                  {believePercent > 25 && `${believePercent}%`}
                </div>
                {/* Doubt segment - ensure minimum width if not 0 */}
                <div
                  className="bg-red-400 flex items-center justify-center text-white text-xs font-bold transition-all"
                  style={{ 
                    width: `${doubtPercent}%`,
                    minWidth: doubtPercent > 0 ? '40px' : '0'
                  }}
                >
                  {doubtPercent > 25 && `${doubtPercent}%`}
                </div>
              </div>
            </div>

            {/* Time remaining */}
            <div className="text-right flex-shrink-0 min-w-max">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Ends in</p>
              <p className="text-sm font-black text-red-600">{pact.timeRemaining}</p>
            </div>
          </div>

          {/* Vote summary */}
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-lg font-black text-slate-900">
                {believePercent}% Believe
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatVoteCount(believers)} believers · {formatVoteCount(doubters)} doubters
              </p>
            </div>
          </div>
        </div>

        {/* VOTING BUTTONS - Believe (blue) and Doubt (gray) */}
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex gap-3">
            <button
              onClick={() => handleVote('believe')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full font-bold text-base transition-all transform ${
                currentVote === 'believe'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40'
                  : 'bg-blue-100 text-blue-700 border-2 border-blue-300 hover:bg-blue-200'
              }`}
            >
              <span className="text-lg">✓</span>
              Believe
            </button>

            <button
              onClick={() => handleVote('doubt')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full font-bold text-base transition-all transform ${
                currentVote === 'doubt'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/40'
                  : 'bg-slate-100 text-slate-700 border-2 border-slate-300 hover:bg-slate-200'
              }`}
            >
              <span className="text-lg">✕</span>
              Doubt
            </button>
          </div>
        </div>

        {/* FOOTER - Members, Proofs count, and action icons */}
        <div className="px-4 py-4 flex items-center justify-between border-t border-slate-100">
          {/* Members avatars - overlapped circles */}
          <div className="flex items-center gap-1">
            <div className="flex -space-x-2">
              {['A', 'P', 'R'].map((letter, idx) => (
                <div
                  key={idx}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white ${
                    idx === 0 ? 'bg-blue-600' : idx === 1 ? 'bg-red-600' : 'bg-slate-900'
                  }`}
                >
                  {letter}
                </div>
              ))}
            </div>
            <span className="text-xs text-slate-600 font-medium ml-1">+2</span>
          </div>

          {/* Proof count */}
          <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide">
            {proofClips.length} Proofs
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
    </>
  );
}
