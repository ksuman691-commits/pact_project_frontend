'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { ChevronLeft, Clock, Users, CheckCircle2, Upload, Shield } from 'lucide-react';
import Link from 'next/link';
import { useDareDetail, useDareRecipients, useDareStats } from '@/hooks/useDareQueries';
import { useAcceptDare, useDeclineDare, useClaimDare } from '@/hooks/useDareMutations';
import DareRecipientsList from '@/components/DareRecipientsList';
import DareProofUploadModal from '@/components/DareProofUploadModal';
import DareVerificationModal from '@/components/DareVerificationModal';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';

export default function DareDetailPage() {
  const params = useParams();
  const dareId = parseInt(params.id as string);
  const { user } = useAuthStore();

  const dareQuery = useDareDetail(dareId);
  const recipientsQuery = useDareRecipients(dareId);
  const statsQuery = useDareStats(dareId);

  const acceptMutation = useAcceptDare();
  const declineMutation = useDeclineDare();
  const claimMutation = useClaimDare();

  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);

  const dare = dareQuery.data?.data;

  const handleAccept = () => {
    acceptMutation.mutate(dareId, {
      onSuccess: () => {
        dareQuery.refetch();
      },
    });
  };

  const handleDecline = () => {
    declineMutation.mutate(dareId, {
      onSuccess: () => {
        dareQuery.refetch();
      },
    });
  };

  const handleClaim = () => {
    claimMutation.mutate(dareId, {
      onSuccess: () => {
        dareQuery.refetch();
      },
    });
  };

  if (dareQuery.isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="h-96 bg-slate-200 rounded-[28px] animate-pulse" />
        </div>
      </div>
    );
  }

  if (!dare) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <p className="text-[#6B7280]">Dare not found</p>
        </div>
      </div>
    );
  }

  const creatorAvatar = dare.creator_avatar_url?.trim()
    ? dare.creator_avatar_url
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${dare.creator_username}`;

  const isCreator = user?.id === dare.creator_id;
  const isAccepted = dare.isAcceptedByMe;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-[rgba(20,18,31,0.06)]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dares" className="p-2 hover:bg-[#FAF9FE] rounded-[28px]">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-[#14121F]">Dare Details</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Creator Info */}
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 rounded-full bg-slate-300 overflow-hidden flex-shrink-0">
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
          </div>
          <div>
            <p className="font-semibold text-[#14121F]">{dare.creator_full_name || dare.creator_username}</p>
            <p className="text-sm text-[#6B7280]">@{dare.creator_username}</p>
          </div>
        </div>

        {/* Dare Title and Description */}
        <div>
          <h2 className="text-2xl font-bold text-[#14121F] mb-2">{dare.title}</h2>
          <p className="text-slate-700 leading-relaxed">{dare.description}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#EDE9FE] rounded-[28px] p-4">
            <p className="text-xs font-semibold text-[#6B7280] uppercase mb-1">Recipients</p>
            <p className="text-2xl font-bold text-[#A78BFA]">{dare.recipientCount || 0}</p>
          </div>
          <div className="bg-[#EDE9FE] rounded-[28px] p-4">
            <p className="text-xs font-semibold text-[#6B7280] uppercase mb-1">Accepted</p>
            <p className="text-2xl font-bold text-[#A78BFA]">{dare.acceptedCount || 0}</p>
          </div>
          <div className="bg-[#EDE9FE] rounded-[28px] p-4">
            <p className="text-xs font-semibold text-[#6B7280] uppercase mb-1">Completed</p>
            <p className="text-2xl font-bold text-[#A78BFA]">{dare.completedCount || 0}</p>
          </div>
          <div className="bg-red-50 rounded-[28px] p-4">
            <p className="text-xs font-semibold text-[#6B7280] uppercase mb-1">Failed</p>
            <p className="text-2xl font-bold text-red-600">{dare.failedCount || 0}</p>
          </div>
        </div>

        {/* Timeline Info */}
        <div className="space-y-2 bg-[#F4F2FB] rounded-[28px] p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#6B7280]">Respond By:</span>
            <span className="text-sm text-[#14121F]">{new Date(dare.respond_by_date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#6B7280]">Complete By:</span>
            <span className="text-sm text-[#14121F]">{new Date(dare.complete_by_date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#6B7280]">Verification:</span>
            <span className="text-sm text-[#14121F] capitalize">{dare.verification_method || 'photo'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        {!isCreator && (
          <div className="grid grid-cols-2 gap-3">
            {dare.visibility === 'public' && !isAccepted ? (
              <button
                onClick={handleClaim}
                disabled={claimMutation.isPending}
                className="col-span-2 px-6 py-3 bg-[#A78BFA] text-white rounded-[28px] hover:bg-emerald-700 disabled:opacity-50 font-semibold"
              >
                {claimMutation.isPending ? 'Claiming...' : 'Claim Dare'}
              </button>
            ) : isAccepted ? (
              <>
                <button
                  onClick={() => setProofModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-[#A78BFA] text-white rounded-[28px] hover:bg-emerald-700 font-semibold"
                >
                  <Upload className="w-4 h-4" />
                  Submit Proof
                </button>
                <button
                  onClick={() => setVerifyModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-[28px] hover:bg-blue-700 font-semibold"
                >
                  <Shield className="w-4 h-4" />
                  Verify
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleAccept}
                  disabled={acceptMutation.isPending}
                  className="px-4 py-3 bg-[#A78BFA] text-white rounded-[28px] hover:bg-emerald-700 disabled:opacity-50 font-semibold"
                >
                  {acceptMutation.isPending ? 'Accepting...' : 'Accept'}
                </button>
                <button
                  onClick={handleDecline}
                  disabled={declineMutation.isPending}
                  className="px-4 py-3 border border-red-600 text-red-600 rounded-[28px] hover:bg-red-50 disabled:opacity-50 font-semibold"
                >
                  {declineMutation.isPending ? 'Declining...' : 'Decline'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Recipients Section */}
        <div>
          <h3 className="text-lg font-bold text-[#14121F] mb-4">Recipients</h3>
          <DareRecipientsList
            recipients={recipientsQuery.data?.data || []}
            isLoading={recipientsQuery.isLoading}
          />
        </div>

        {/* Verification Stats */}
        {statsQuery.data && (
          <div className="bg-blue-50 rounded-[28px] p-4">
            <h3 className="text-sm font-bold text-[#14121F] mb-3">Verification Stats</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-[#6B7280] mb-1">Yes</p>
                <p className="text-lg font-bold text-blue-600">{statsQuery.data.data?.yes_count || 0}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B7280] mb-1">No</p>
                <p className="text-lg font-bold text-red-600">{statsQuery.data.data?.no_count || 0}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B7280] mb-1">Confidence</p>
                <p className="text-lg font-bold text-[#A78BFA]">
                  {(statsQuery.data.data?.confidence_avg || 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <DareProofUploadModal isOpen={proofModalOpen} onClose={() => setProofModalOpen(false)} dareId={dareId} />
      <DareVerificationModal isOpen={verifyModalOpen} onClose={() => setVerifyModalOpen(false)} dareId={dareId} />
    </div>
  );
}
