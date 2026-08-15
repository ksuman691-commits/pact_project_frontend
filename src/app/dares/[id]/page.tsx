'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { ChevronLeft, Upload, Shield } from 'lucide-react';
import Link from 'next/link';
import { useDareDetail, useDareRecipients, useDareStats } from '@/hooks/useDareQueries';
import { useAcceptDare, useDeclineDare, useClaimDare } from '@/hooks/useDareMutations';
import DareRecipientsList from '@/components/DareRecipientsList';
import DareProofUploadModal from '@/components/DareProofUploadModal';
import DareVerificationModal from '@/components/DareVerificationModal';
import { useAuthStore } from '@/store/auth';

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
      <div className="pact-flow min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="pact-shimmer h-96 rounded-[28px]" />
        </div>
      </div>
    );
  }

  if (!dare) {
    return (
      <div className="pact-flow min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <p className="text-[var(--pact-text-dim)]">Dare not found</p>
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
    <div className="pact-flow pact-page-enter min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-[var(--pact-hairline)]" style={{ background: 'var(--pact-bg)' }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dares" className="p-2 rounded-[28px] transition hover:bg-[var(--pact-surface)]">
            <ChevronLeft className="w-5 h-5 text-[var(--pact-text)]" />
          </Link>
          <h1 className="text-lg font-bold text-[var(--pact-text)]">Dare Details</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Creator Info */}
        <div className="flex items-center gap-4">
          <div
            className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0"
            style={{ background: 'var(--pact-surface-2)' }}
          >
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
            <p className="font-semibold text-[var(--pact-text)]">{dare.creator_full_name || dare.creator_username}</p>
            <p className="text-sm text-[var(--pact-text-faint)]">@{dare.creator_username}</p>
          </div>
        </div>

        {/* Dare Title and Description */}
        <div>
          <h2 className="text-2xl font-bold text-[var(--pact-text)] mb-2">{dare.title}</h2>
          <p className="text-[var(--pact-text-dim)] leading-relaxed">{dare.description}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="pact-card rounded-[28px] p-4" style={{ background: 'var(--pact-surface)', border: '1px solid var(--pact-hairline)' }}>
            <p className="text-xs font-semibold text-[var(--pact-text-faint)] uppercase mb-1">Recipients</p>
            <p className="text-2xl font-bold text-[var(--pact-violet)]">{dare.recipientCount || 0}</p>
          </div>
          <div className="pact-card rounded-[28px] p-4" style={{ background: 'var(--pact-surface)', border: '1px solid var(--pact-hairline)' }}>
            <p className="text-xs font-semibold text-[var(--pact-text-faint)] uppercase mb-1">Accepted</p>
            <p className="text-2xl font-bold text-[var(--pact-violet)]">{dare.acceptedCount || 0}</p>
          </div>
          <div className="pact-card rounded-[28px] p-4" style={{ background: 'var(--pact-surface)', border: '1px solid var(--pact-hairline)' }}>
            <p className="text-xs font-semibold text-[var(--pact-text-faint)] uppercase mb-1">Completed</p>
            <p className="text-2xl font-bold text-[var(--pact-violet)]">{dare.completedCount || 0}</p>
          </div>
          <div className="pact-card rounded-[28px] p-4" style={{ background: 'var(--pact-surface)', border: '1px solid var(--pact-hairline)' }}>
            <p className="text-xs font-semibold text-[var(--pact-text-faint)] uppercase mb-1">Failed</p>
            <p className="text-2xl font-bold text-[var(--pact-pink)]">{dare.failedCount || 0}</p>
          </div>
        </div>

        {/* Timeline Info */}
        <div className="space-y-2 rounded-[28px] p-4" style={{ background: 'var(--pact-surface-2)' }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--pact-text-faint)]">Respond By:</span>
            <span className="text-sm text-[var(--pact-text)]">{new Date(dare.respond_by_date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--pact-text-faint)]">Complete By:</span>
            <span className="text-sm text-[var(--pact-text)]">{new Date(dare.complete_by_date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--pact-text-faint)]">Verification:</span>
            <span className="text-sm text-[var(--pact-text)] capitalize">{dare.verification_method || 'photo'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        {!isCreator && (
          <div className="grid grid-cols-2 gap-3">
            {dare.visibility === 'public' && !isAccepted ? (
              <button
                onClick={handleClaim}
                disabled={claimMutation.isPending}
                className="pact-btn-glow col-span-2 px-6 py-3 rounded-[28px] disabled:opacity-50 font-semibold"
                style={{ background: 'var(--pact-pink)', color: 'var(--pact-bg)' }}
              >
                {claimMutation.isPending ? 'Claiming...' : 'Claim Dare'}
              </button>
            ) : isAccepted ? (
              <>
                <button
                  onClick={() => setProofModalOpen(true)}
                  className="pact-btn-glow flex items-center justify-center gap-2 px-4 py-3 rounded-[28px] font-semibold"
                  style={{ background: 'var(--pact-pink)', color: 'var(--pact-bg)' }}
                >
                  <Upload className="w-4 h-4" />
                  Submit Proof
                </button>
                <button
                  onClick={() => setVerifyModalOpen(true)}
                  className="pact-btn-glow flex items-center justify-center gap-2 px-4 py-3 rounded-[28px] font-semibold border"
                  style={{ borderColor: 'var(--pact-violet)', background: 'var(--pact-surface-2)', color: 'var(--pact-violet)' }}
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
                  className="pact-btn-glow px-4 py-3 rounded-[28px] disabled:opacity-50 font-semibold"
                  style={{ background: 'var(--pact-pink)', color: 'var(--pact-bg)' }}
                >
                  {acceptMutation.isPending ? 'Accepting...' : 'Accept'}
                </button>
                <button
                  onClick={handleDecline}
                  disabled={declineMutation.isPending}
                  className="px-4 py-3 rounded-[28px] border disabled:opacity-50 font-semibold transition"
                  style={{ borderColor: 'var(--pact-pink)', color: 'var(--pact-pink)' }}
                >
                  {declineMutation.isPending ? 'Declining...' : 'Decline'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Recipients Section */}
        <div>
          <h3 className="text-lg font-bold text-[var(--pact-text)] mb-4">Recipients</h3>
          <DareRecipientsList
            recipients={recipientsQuery.data?.data || []}
            isLoading={recipientsQuery.isLoading}
          />
        </div>

        {/* Verification Stats */}
        {statsQuery.data && (
          <div className="rounded-[28px] p-4" style={{ background: 'var(--pact-surface-2)' }}>
            <h3 className="text-sm font-bold text-[var(--pact-text)] mb-3">Verification Stats</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-[var(--pact-text-faint)] mb-1">Yes</p>
                <p className="text-lg font-bold text-[var(--pact-violet)]">{statsQuery.data.data?.yes_count || 0}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--pact-text-faint)] mb-1">No</p>
                <p className="text-lg font-bold text-[var(--pact-pink)]">{statsQuery.data.data?.no_count || 0}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--pact-text-faint)] mb-1">Confidence</p>
                <p className="text-lg font-bold text-[var(--pact-gold)]">
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
