'use client';

import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Camera, ChevronDown } from 'lucide-react';
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
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(Math.floor(pact.believers * 0.8));

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };

  return (
    <>
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        {/* Card Header */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-300 to-blue-400 flex items-center justify-center text-white font-bold text-sm">
              {pact.avatar}
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900">@{pact.creator}</p>
              <p className="text-xs text-gray-500">Day {pact.daysCurrent}/{pact.daysTotal}</p>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600 transition">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Pact Title */}
        <div className="px-4 py-2">
          <Link href={`/pact-details/${pact.id}`}>
            <h2 className="text-lg font-bold text-gray-900 leading-tight hover:text-blue-600 transition cursor-pointer">
              {pact.title}
            </h2>
          </Link>
        </div>

        {/* Image Area */}
        <div className="mx-4 my-3 aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center text-center shadow-sm">
          <div className="text-center">
            <p className="text-6xl mb-3">{pact.avatar}</p>
            <p className="text-xs text-gray-600 font-medium">{pact.proofClips?.length || 0} proof clips</p>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 py-2 flex gap-3 justify-between text-xs">
          <div className="text-center">
            <p className="text-gray-500 font-medium mb-0.5">Confidence</p>
            <p className="font-bold text-emerald-600 text-sm">{pact.confidence}%</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 font-medium mb-0.5">Believe</p>
            <p className="font-bold text-blue-600 text-sm">{(pact.believers / 1000).toFixed(0)}k</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 font-medium mb-0.5">Doubt</p>
            <p className="font-bold text-red-600 text-sm">{(pact.doubters / 1000).toFixed(0)}k</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 font-medium mb-0.5">Time Left</p>
            <p className="font-bold text-orange-600 text-sm">{pact.timeRemaining}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-4 py-2">
          <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full"
              style={{ width: `${pact.progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Action Buttons - Believe (left), Proof (center), Doubt (right) */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100">
          {/* Believe Button - Left */}
          <button
            onClick={() => onVote?.(pact.id, 'believe')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              userVote === 'believe'
                ? 'bg-emerald-100 text-emerald-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            ✓ Believe
          </button>

          {/* Proof Button - Center */}
          <button 
            onClick={() => setProofModal(true)}
            className="text-gray-500 hover:text-emerald-600 transition text-xs font-medium flex items-center gap-1 px-3 py-1.5"
          >
            <Camera className="w-3 h-3" />
            Proof
          </button>

          {/* Doubt Button - Right */}
          <button
            onClick={() => onVote?.(pact.id, 'doubt')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              userVote === 'doubt'
                ? 'bg-red-100 text-red-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            ✗ Doubt
          </button>
        </div>

        {/* Members */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-500 font-medium">Members:</p>
            <div className="flex -space-x-2">
              {[
                { name: 'A', bg: 'from-emerald-400 to-emerald-600' },
                { name: 'P', bg: 'from-blue-400 to-blue-600' },
                { name: 'R', bg: 'from-purple-400 to-purple-600' },
                { name: 'S', bg: 'from-pink-400 to-pink-600' },
              ].map((member, idx) => (
                <div 
                  key={idx}
                  className={`w-7 h-7 rounded-full bg-gradient-to-br ${member.bg} flex items-center justify-center text-white text-xs font-bold border-2 border-white hover:scale-110 transition-transform cursor-pointer`}
                  title={`Member ${member.name}`}
                >
                  {member.name}
                </div>
              ))}
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold border-2 border-white text-center">
                +2
              </div>
            </div>
          </div>
        </div>

        {/* Engagement Footer */}
        <div className="px-4 py-3 bg-white border-t border-gray-100 flex items-center justify-between text-xs">
          <button 
            onClick={handleLike}
            className="flex items-center gap-1 text-gray-600 hover:text-red-500 transition font-medium"
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current text-red-500' : ''}`} />
            {likeCount}
          </button>
          <Link href={`/pact-details/${pact.id}`}>
            <button className="flex items-center gap-1 text-gray-600 hover:text-blue-500 transition font-medium">
              <MessageCircle className="w-3.5 h-3.5" />
              {pact.comments?.length || 0}
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <button 
                className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 hover:shadow-md transition-all flex items-center justify-center text-white text-xs font-bold hover:scale-110"
                title="Share on Instagram"
                onClick={() => setShareModal(true)}
              >
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
                </svg>
              </button>
              <button 
                className="w-5 h-5 rounded-full bg-blue-600 hover:bg-blue-700 hover:shadow-md transition-all flex items-center justify-center text-white text-xs font-bold hover:scale-110"
                title="Share on LinkedIn"
                onClick={() => setShareModal(true)}
              >
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </button>
              <button 
                className="w-5 h-5 rounded-full bg-black hover:bg-gray-900 hover:shadow-md transition-all flex items-center justify-center text-white text-xs font-bold hover:scale-110"
                title="Share on X"
                onClick={() => setShareModal(true)}
              >
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.223-6.831-5.974 6.831H2.882l7.732-8.835L1.227 2.25h6.802l4.721 6.247 5.462-6.247zM17.002 18.807h1.844L6.603 3.552H4.674l12.328 15.255z"/>
                </svg>
              </button>
            </div>
            <div className="w-px h-4 bg-gray-200" />
            <button 
              onClick={() => setShareModal(true)}
              className="flex items-center gap-1 text-gray-600 hover:text-emerald-600 transition font-medium"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
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
