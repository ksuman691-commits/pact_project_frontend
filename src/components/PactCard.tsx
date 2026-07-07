'use client';

import React, { useState } from 'react';
import { MessageCircle, Share2, Camera, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ProofUploadModal from './ProofUploadModal';
import ShareModal from './ShareModal';

interface PactCardProps {
  pact: any;
  onVote?: (pactId: number, vote: string) => void;
  userVote?: string | null;
  onProofUpload?: (pactId: number) => void;
}

export default function PactCard({
  pact,
  onVote,
  userVote,
  onProofUpload,
}: PactCardProps) {
  const [proofModal, setProofModal] = useState(false);
  const [shareModal, setShareModal] = useState(false);
  const believePercent = Math.round((pact.believers / (pact.believers + pact.doubters)) * 100) || 50;
  const doubtPercent = 100 - believePercent;

  return (
    <>
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-shadow mb-5">
        
        {/* 1. HEADER ROW - Minimal metadata */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-xs">
              {pact.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-slate-900 truncate">@{pact.creator}</p>
              <p className="text-xs text-slate-500">Day {pact.daysCurrent}/{pact.daysTotal}</p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600 transition flex-shrink-0">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* 2. HERO SECTION - Large title */}
        <Link href={`/pact-details/${pact.id}`}>
          <div className="px-4 pt-5 pb-4 cursor-pointer hover:bg-slate-50 transition">
            <h2 className="text-2xl font-bold text-slate-900 leading-tight">
              {pact.title}
            </h2>
          </div>
        </Link>

        {/* 3. PROOF PREVIEW - Visual thumbnail */}
        <div className="px-4 pb-4">
          {pact.proofClips && pact.proofClips.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {pact.proofClips.slice(0, 3).map((clip: any, idx: number) => (
                <div
                  key={idx}
                  className="flex-shrink-0 w-20 h-20 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-2xl border border-slate-300"
                >
                  {clip.type === 'coding' ? '💻' : clip.type === 'checkpoint' ? '✅' : '📷'}
                </div>
              ))}
              {pact.proofClips.length > 3 && (
                <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 border border-slate-300">
                  +{pact.proofClips.length - 3}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center border border-slate-300">
              <div className="text-center">
                <p className="text-3xl mb-1">🎬</p>
                <p className="text-xs text-slate-500 font-medium">No proof yet</p>
              </div>
            </div>
          )}
        </div>

        {/* SENTIMENT BAR - Single unified visualization */}
        <div className="px-4 pb-4">
          <div className="flex items-end gap-3 mb-3">
            {/* Progress bar */}
            <div className="flex-1">
              <div className="h-8 bg-slate-100 rounded-full overflow-hidden flex">
                <div 
                  className="bg-emerald-500 flex items-center justify-center text-white text-xs font-bold"
                  style={{ width: `${believePercent}%` }}
                >
                  {believePercent > 25 && `${believePercent}%`}
                </div>
                <div 
                  className="bg-red-500 flex items-center justify-center text-white text-xs font-bold"
                  style={{ width: `${doubtPercent}%` }}
                >
                  {doubtPercent > 25 && `${doubtPercent}%`}
                </div>
              </div>
            </div>
            {/* Time remaining - small badge */}
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-slate-500 font-medium">Time left</p>
              <p className="font-bold text-sm text-orange-600">{pact.timeRemaining}</p>
            </div>
          </div>
          {/* Vote counts inline */}
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-lg">✓</span>
              <span className="font-semibold text-slate-900">{(pact.believers / 1000).toFixed(1)}k</span>
              <span className="text-slate-500">Believe</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg">✗</span>
              <span className="font-semibold text-slate-900">{(pact.doubters / 1000).toFixed(1)}k</span>
              <span className="text-slate-500">Doubt</span>
            </div>
          </div>
        </div>

        {/* 4. METADATA ROW - Members and info */}
        <div className="px-4 py-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-600 font-medium">
              {pact.proofClips?.length || 0} proofs
            </div>
            <div className="flex -space-x-2">
              {[
                { name: 'A', bg: 'from-emerald-400 to-emerald-600' },
                { name: 'P', bg: 'from-blue-400 to-blue-600' },
                { name: 'R', bg: 'from-purple-400 to-purple-600' },
                { name: 'S', bg: 'from-pink-400 to-pink-600' },
              ].map((member, idx) => (
                <div 
                  key={idx}
                  className={`w-6 h-6 rounded-full bg-gradient-to-br ${member.bg} flex items-center justify-center text-white text-xs font-bold border border-white hover:scale-110 transition-transform cursor-pointer`}
                  title={`Member ${member.name}`}
                >
                  {member.name}
                </div>
              ))}
              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold border border-white">
                +2
              </div>
            </div>
          </div>
        </div>

        {/* 5. ACTION ROW - Primary actions (Believe/Doubt large, secondary below) */}
        <div className="px-4 py-4 border-t border-slate-100 space-y-3">
          {/* Primary action buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => onVote?.(pact.id, 'believe')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-all transform text-base ${
                userVote === 'believe'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/40 scale-105'
                  : 'bg-emerald-50 text-emerald-700 border-2 border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              <span>✓</span>
              Believe
            </button>

            <button
              onClick={() => onVote?.(pact.id, 'doubt')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-all transform text-base ${
                userVote === 'doubt'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/40 scale-105'
                  : 'bg-red-50 text-red-700 border-2 border-red-300 hover:bg-red-100'
              }`}
            >
              <span>✗</span>
              Doubt
            </button>
          </div>

          {/* Secondary actions */}
          <div className="flex gap-2 justify-between">
            <button 
              onClick={() => setProofModal(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition font-semibold text-sm"
            >
              <Camera className="w-4 h-4" />
              Proof
            </button>

            <Link href={`/pact-details/${pact.id}`}>
              <button className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-blue-600 transition font-medium text-sm bg-slate-50 hover:bg-slate-100 rounded-lg">
                <MessageCircle className="w-4 h-4" />
                {pact.comments?.length || 0}
              </button>
            </Link>

            <button 
              onClick={() => setShareModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-emerald-600 transition font-medium text-sm bg-slate-50 hover:bg-slate-100 rounded-lg"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProofUploadModal
        isOpen={proofModal}
        onClose={() => setProofModal(false)}
        pactId={pact.id}
        onUpload={onProofUpload}
      />
      <ShareModal
        isOpen={shareModal}
        onClose={() => setShareModal(false)}
        pact={pact}
      />
    </>
  );
}
