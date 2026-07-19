'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Share2, Flag, MoreVertical, Camera } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import ReportPactModal from './ReportPactModal';
import { useVoteSupport, useVoteSkip } from '@/hooks/useReportingMutations';

interface PactCardMediaFirstProps {
  pact: any;
  userVote?: string | null;
  onProofUpload?: (pactId: number, proof?: any) => void;
  onNavigateNext?: () => void;
  onNavigatePrev?: () => void;
}

export default function PactCardMediaFirst({
  pact,
  userVote,
  onProofUpload,
  onNavigateNext,
  onNavigatePrev,
}: PactCardMediaFirstProps) {
  const [isClient, setIsClient] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [currentVote, setCurrentVote] = useState<'support' | 'skip' | null>(userVote as any);
  const [dragX, setDragX] = useState(0);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [showDirectionalTag, setShowDirectionalTag] = useState<'skip' | 'support' | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);
  
  const mediaRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);
  const voteSupportMutation = useVoteSupport();
  const voteSkipMutation = useVoteSkip();

  // Hydration fix: ensure client-only initialization
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Data extraction
  const supportCount = pact.support_count ?? pact.believers ?? 0;
  const recentSupporters = pact.recent_supporters ?? [];
  const reportCount = pact.report_count ?? 0;
  const isReportedByMe = pact.is_reported_by_me ?? false;

  // Auto-hide reported pacts
  if (reportCount >= 4) {
    return null;
  }

  const creatorLabel = pact.creator || pact.creator_username || 'unknown';
  const creatorUsername = pact.creator_username || null;
  const creatorProfileHref = creatorUsername
    ? `/profile/${encodeURIComponent(creatorUsername)}`
    : null;
  const creatorAvatarUrl = pact.creatorAvatarUrl || pact.creator_avatar_url || null;
  const timeRemaining = pact.timeRemaining || 'ending soon';

  const proofUrl = pact.proof_url || (Array.isArray(pact.proofClips) && pact.proofClips.length > 0 ? pact.proofClips[0]?.url : null);
  const proofType = pact.proof_type || (Array.isArray(pact.proofClips) && pact.proofClips.length > 0 ? pact.proofClips[0]?.type : 'photo');
  const hasProof = Boolean(proofUrl);

  const formatVoteCount = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return `${count}`;
  };

  // Double-tap support
  const handleMediaClick = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      handleVoteSupport();
    }
    lastTapRef.current = now;
  };

  const handleVoteSupport = async () => {
    setCurrentVote('support');
    try {
      await voteSupportMutation.mutateAsync(pact.id);
      toast.success('Support voted!');
      animateCardOut('right');
    } catch (error) {
      setCurrentVote(userVote as any);
      console.error('[v0] Vote support error:', error);
    }
  };

  const handleVoteSkip = async () => {
    setCurrentVote('skip');
    try {
      await voteSkipMutation.mutateAsync(pact.id);
      toast.success('Skipped!');
      animateCardOut('left');
    } catch (error) {
      setCurrentVote(userVote as any);
      console.error('[v0] Vote skip error:', error);
    }
  };

  const animateCardOut = (direction: 'left' | 'right') => {
    setIsCommitting(true);
    setTimeout(() => {
      if (direction === 'right') {
        onNavigateNext?.();
      } else {
        onNavigateNext?.();
      }
    }, 300);
  };

  // Swipe handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!hasProof || isCommitting) return;
    setDragStartX(e.clientX);
    setDragStartY(e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStartX === 0 || isCommitting) return;
    
    const currentX = e.clientX;
    const currentY = e.clientY;
    const moveX = currentX - dragStartX;
    const moveY = currentY - dragStartY;
    
    // Dominant axis check: if vertical distance > horizontal, it's vertical navigation
    if (Math.abs(moveY) > Math.abs(moveX) && Math.abs(moveY) > 20) {
      setDragStartX(0);
      if (moveY > 0 && onNavigatePrev) {
        onNavigatePrev();
      } else if (moveY < 0 && onNavigateNext) {
        onNavigateNext();
      }
      return;
    }

    // Horizontal swipe for voting
    if (Math.abs(moveX) > 10) {
      setDragX(moveX);
      
      // Show directional tag at ~40px
      if (Math.abs(moveX) > 40) {
        setShowDirectionalTag(moveX < 0 ? 'skip' : 'support');
      }

      // Commit vote at ~90px
      if (Math.abs(moveX) > 90) {
        setDragStartX(0);
        setDragX(0);
        setShowDirectionalTag(null);
        
        if (moveX < 0) {
          handleVoteSkip();
        } else {
          handleVoteSupport();
        }
      }
    }
  };

  const handleMouseUp = () => {
    setDragStartX(0);
    setDragX(0);
    setShowDirectionalTag(null);
  };

  // Avatar stack component
  const AvatarStack = ({ supporters }: { supporters: any[] }) => {
    if (supporters.length === 0) return null;
    
    const displayedSupporters = supporters.slice(0, 3);
    const remaining = supporters.length - 3;

    return (
      <div className="flex items-center gap-1">
        {displayedSupporters.map((supporter, idx) => (
          <div
            key={supporter.id || idx}
            className="w-6 h-6 rounded-full border-2 border-white overflow-hidden"
            style={{ marginLeft: idx > 0 ? '-8px' : '0' }}
          >
            {supporter.avatar ? (
              <Image
                src={supporter.avatar}
                alt={supporter.name}
                width={24}
                height={24}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                {supporter.name?.charAt(0) || '?'}
              </div>
            )}
          </div>
        ))}
        {remaining > 0 && (
          <div className="w-6 h-6 rounded-full bg-slate-700 border border-white flex items-center justify-center text-white text-xs font-bold">
            +{remaining}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div
        className="relative rounded-2xl overflow-hidden bg-black mb-4 mx-2 sm:mx-0 aspect-[9/16] max-w-sm mx-auto"
        style={{
          transform: isCommitting ? `translateX(${dragX > 0 ? '100%' : '-100%'})` : 'translateX(0)',
          transition: isCommitting ? 'transform 0.3s ease-out' : 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* MEDIA SECTION - Full bleed */}
        <div
          ref={mediaRef}
          className="relative w-full h-full bg-slate-900 cursor-grab active:cursor-grabbing"
          onClick={handleMediaClick}
        >
          {hasProof ? (
            proofType === 'video' ? (
              <video
                src={proofUrl}
                className="w-full h-full object-cover"
                autoPlay
                muted
              />
            ) : (
              <Image
                src={proofUrl}
                alt="Proof"
                fill
                className="w-full h-full object-cover"
                unoptimized
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center flex-col gap-4 bg-gradient-to-b from-slate-800 to-slate-900">
              {creatorAvatarUrl ? (
                <div className="relative w-20 h-20 rounded-full overflow-hidden border border-slate-600 opacity-50">
                  <Image
                    src={creatorAvatarUrl}
                    alt={creatorLabel}
                    fill
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-3xl font-bold opacity-50">
                  {pact.avatar || creatorLabel.charAt(0).toUpperCase()}
                </div>
              )}
              <p className="text-slate-400 text-sm font-medium text-center">
                no proof uploaded yet<br />
                be the first
              </p>
            </div>
          )}

          {/* DIRECTIONAL TAG - While dragging */}
          {showDirectionalTag && (
            <div
              className={`absolute top-4 font-bold text-sm px-3 py-1.5 rounded-full border-2 transition-opacity ${
                showDirectionalTag === 'skip'
                  ? 'left-4 border-red-500 text-red-500'
                  : 'right-4 border-emerald-500 text-emerald-500'
              }`}
            >
              {showDirectionalTag === 'skip' ? '← skip' : 'support →'}
            </div>
          )}

          {/* TOP OVERLAY - Avatar, Handle, Time Badge */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between z-10">
            <Link href={creatorProfileHref || '#'} className="flex items-center gap-2 group cursor-pointer">
              <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden flex-shrink-0 group-hover:border-emerald-400 transition">
                {creatorAvatarUrl ? (
                  <Image
                    src={creatorAvatarUrl}
                    alt={creatorLabel}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold">
                    {pact.avatar || creatorLabel.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="text-white font-bold text-sm">@{creatorLabel}</p>
                <p className="text-slate-300 text-xs">{pact.title || 'Pact'}</p>
              </div>
            </Link>

            <div className="px-3 py-1.5 rounded-full bg-slate-800/80 backdrop-blur border border-slate-600 text-white text-xs font-semibold">
              ENDS IN {timeRemaining}
            </div>
          </div>

          {/* RIGHT ACTION RAIL - Proofs, Comments, Share, Report */}
          <div className="absolute right-4 bottom-20 flex flex-col gap-4 z-10">
            {/* Proofs */}
            <button className="w-12 h-12 rounded-full bg-slate-800/80 backdrop-blur border border-slate-600 flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-500 transition group" title="Proofs">
              <div className="flex flex-col items-center gap-0.5">
                <Camera className="w-4 h-4" />
                <span className="text-xs font-semibold">0</span>
              </div>
            </button>

            {/* Comments */}
            <button className="w-12 h-12 rounded-full bg-slate-800/80 backdrop-blur border border-slate-600 flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-500 transition group" title="Comments">
              <div className="flex flex-col items-center gap-0.5">
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs font-semibold">0</span>
              </div>
            </button>

            {/* Share */}
            <button className="w-12 h-12 rounded-full bg-slate-800/80 backdrop-blur border border-slate-600 flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-500 transition" title="Share">
              <Share2 className="w-4 h-4" />
            </button>

            {/* Report - Red outline */}
            <button
              onClick={() => setReportModal(true)}
              className="w-12 h-12 rounded-full bg-slate-800/80 backdrop-blur border-2 border-red-500/60 flex items-center justify-center text-red-500 hover:border-red-500 hover:text-red-400 transition"
              title="Report"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>

          {/* BOTTOM OVERLAY - Support Count, Avatar Stack */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white text-2xl font-bold">{formatVoteCount(supportCount)}</p>
                <p className="text-slate-300 text-sm">supporting this pact</p>
              </div>
              <AvatarStack supporters={recentSupporters} />
            </div>
          </div>
        </div>

        {/* BOTTOM BUTTONS - Skip and Support Pills */}
        <div className="absolute bottom-4 left-4 right-4 flex gap-3 justify-center z-20 pointer-events-auto">
          <button
            onClick={handleVoteSkip}
            disabled={isCommitting}
            className="flex-1 px-4 py-2.5 rounded-full border-2 border-red-500 text-red-500 font-semibold hover:bg-red-500/10 transition disabled:opacity-50"
          >
            ← skip
          </button>
          <button
            onClick={handleVoteSupport}
            disabled={isCommitting}
            className="flex-1 px-4 py-2.5 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
          >
            support →
          </button>
        </div>
      </div>

      {/* Report Modal */}
      <ReportPactModal
        isOpen={reportModal}
        onClose={() => setReportModal(false)}
        pactId={pact.id}
        pactTitle={pact.title}
      />
    </>
  );
}
