'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Upload, Users, CheckCircle2, XCircle, Clock, CalendarClock, ShieldCheck, Zap } from 'lucide-react';
import DetailPageHeader from '@/components/DetailPageHeader';
import { useDareDetail, useDareRecipients, useDareStats } from '@/hooks/useDareQueries';
import { useAcceptDare, useDeclineDare, useClaimDare } from '@/hooks/useDareMutations';
import DareRecipientsModal from '@/components/DareRecipientsModal';
import DareProofUploadModal from '@/components/DareProofUploadModal';
import DareVerificationModal from '@/components/DareVerificationModal';
import UserAvatarLink from '@/components/UserAvatarLink';
import Avatar from '@/components/Avatar';
import { formatCountdown, formatRelativeTime, urgencyColor } from '@/lib/dareCountdown';
import { useAuthStore } from '@/store/auth';

const STATUS_PILL: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'var(--pact-gold)' },
  accepted: { label: 'Accepted', color: 'var(--pact-violet)' },
  declined: { label: 'Declined', color: 'var(--pact-text-faint)' },
  completed: { label: 'Completed', color: 'var(--pact-mint)' },
  failed: { label: 'Failed', color: 'var(--pact-pink)' },
};

function StatGroup({ icon: Icon, value, label, color }: { icon: any; value: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-4 w-4" style={{ color }} />
      <span className="font-bold text-[var(--pact-text)]">{value}</span>
      <span className="text-xs font-medium text-[var(--pact-text-faint)]">{label}</span>
    </div>
  );
}

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
  const [recipientsModalOpen, setRecipientsModalOpen] = useState(false);

  const dare = dareQuery.data?.data;

  const handleAccept = () => acceptMutation.mutate(dareId, { onSuccess: () => dareQuery.refetch() });
  const handleDecline = () => declineMutation.mutate(dareId, { onSuccess: () => dareQuery.refetch() });
  const handleClaim = () => claimMutation.mutate(dareId, { onSuccess: () => dareQuery.refetch() });

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

  const isCreator = user?.id === dare.creator_id;
  const isPending = dare.my_recipient_status === 'pending';
  const isAccepted = dare.my_recipient_status === 'accepted';
  const isPublicUnclaimed = dare.audience === 'public' && !isCreator && !dare.my_recipient_status;

  const countdown = isPending
    ? formatCountdown(dare.respond_by, 'Respond')
    : formatCountdown(dare.complete_by, 'Complete');

  const statusPill = dare.my_recipient_status ? STATUS_PILL[dare.my_recipient_status] : null;
  const stats = statsQuery.data?.data;

  // DareResponse only carries `recipient_count`, not per-status breakdowns
  // (confirmed against the live API schema) — the old acceptedCount /
  // completedCount / failedCount fields the page previously read never
  // existed on the backend and always rendered as 0. Deriving these from
  // the actual recipients list is the only way to show real numbers.
  const recipients = recipientsQuery.data?.data || [];
  const acceptedCount = recipients.filter((r: any) => r.status === 'accepted').length;
  const completedCount = recipients.filter((r: any) => r.status === 'completed').length;
  const failedCount = recipients.filter((r: any) => r.status === 'declined' || r.status === 'failed').length;

  return (
    <div className="pact-flow pact-page-enter min-h-screen">
      <DetailPageHeader title="Dare Details" backHref="/dares" />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Creator + status + countdown */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatarLink
              name={dare.creator_full_name || dare.creator_username}
              avatarUrl={dare.creator_avatar_url}
              username={dare.creator_username}
              size={48}
            />
            <div className="min-w-0">
              <p className="font-semibold text-[var(--pact-text)] truncate">
                {isCreator ? 'You' : dare.creator_full_name || dare.creator_username}
              </p>
              <p className="text-sm text-[var(--pact-text-faint)] truncate">@{dare.creator_username}</p>
            </div>
          </div>
          <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
            {statusPill && (
              <span
                className="rounded-full px-2.5 py-1 text-xs font-bold"
                style={{ background: 'var(--pact-surface-2)', color: statusPill.color }}
              >
                {statusPill.label}
              </span>
            )}
            <span
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
              style={{ background: 'var(--pact-surface-2)', color: urgencyColor(countdown.urgency) }}
            >
              <Clock className="h-3 w-3" />
              {countdown.label}
            </span>
          </div>
        </div>

        {/* Title + description */}
        <div>
          <h2
            className="mb-2 text-3xl font-black leading-tight text-[var(--pact-text)] text-pretty"
            style={{ fontFamily: 'var(--font-pact-display), sans-serif' }}
          >
            {dare.title}
          </h2>
          <p className="text-[var(--pact-text-dim)] leading-relaxed">{dare.description}</p>
        </div>

        {/* Single recipient: show them directly, no tap required — with
            only one person dared, hiding their identity behind an
            interaction is unnecessary friction for information that
            should just be visible on the page. */}
        {recipients.length === 1 && (
          <div className="flex items-center gap-3 rounded-2xl px-5 py-3" style={{ background: 'var(--pact-surface-2)' }}>
            <Avatar
              name={recipients[0].full_name || recipients[0].username}
              avatarUrl={recipients[0].avatar_url}
              size={36}
            />
            <div className="min-w-0">
              <p className="text-xs font-medium text-[var(--pact-text-faint)]">Dared</p>
              <p className="truncate text-sm font-semibold text-[var(--pact-text)]">
                {recipients[0].full_name || recipients[0].username || 'Unknown user'}
              </p>
            </div>
          </div>
        )}

        {/* Compact icon-led stat row — one merged panel instead of 4 boxes.
            Recipients is tappable whenever there's more than one, opening
            a modal with the full who-was-dared list (DareRecipientsList,
            re-themed) instead of building a separate component. */}
        <div className="pact-card flex flex-wrap items-center gap-5 rounded-2xl px-5 py-4">
          {recipients.length > 1 ? (
            <button
              onClick={() => setRecipientsModalOpen(true)}
              className="flex items-center gap-1.5 rounded-full transition hover:opacity-75"
              aria-label="View who was dared"
            >
              <Users className="h-4 w-4" style={{ color: 'var(--pact-violet)' }} />
              <span className="font-bold text-[var(--pact-text)]">{dare.recipientCount || 0}</span>
              <span className="text-xs font-medium underline decoration-dotted text-[var(--pact-text-faint)]">recipients</span>
            </button>
          ) : (
            <StatGroup icon={Users} value={dare.recipientCount || 0} label="recipients" color="var(--pact-violet)" />
          )}
          <StatGroup icon={CheckCircle2} value={acceptedCount} label="accepted" color="var(--pact-violet)" />
          <StatGroup icon={ShieldCheck} value={completedCount} label="completed" color="var(--pact-mint)" />
          <StatGroup icon={XCircle} value={failedCount} label="failed" color="var(--pact-pink)" />
        </div>

        {/* Timeline — relative labels ("in 5h" / "2h ago") instead of raw
            absolute datetimes, which are harder to parse at a glance for a
            time-boxed feature. Exact datetime is still available via the
            title attribute on hover/tap. */}
        <div className="space-y-2 rounded-2xl px-5 py-3" style={{ background: 'var(--pact-surface-2)' }}>
          <div className="flex items-center gap-2 text-sm">
            <CalendarClock className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--pact-text-faint)' }} />
            <span className="text-[var(--pact-text-faint)]">Respond by</span>
            <span
              className="ml-auto font-medium text-[var(--pact-text-dim)]"
              title={dare.respond_by ? new Date(dare.respond_by).toLocaleString() : undefined}
            >
              {formatRelativeTime(dare.respond_by)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CalendarClock className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--pact-text-faint)' }} />
            <span className="text-[var(--pact-text-faint)]">Complete by</span>
            <span
              className="ml-auto font-medium text-[var(--pact-text-dim)]"
              title={dare.complete_by ? new Date(dare.complete_by).toLocaleString() : undefined}
            >
              {formatRelativeTime(dare.complete_by)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--pact-text-faint)' }} />
            <span className="text-[var(--pact-text-faint)]">Verification</span>
            <span className="ml-auto font-medium capitalize text-[var(--pact-text-dim)]">{dare.verification_method || 'photo'}</span>
          </div>
        </div>

        {/* Primary actions */}
        {!isCreator && (isPending || isAccepted || isPublicUnclaimed) && (
          <div className="grid grid-cols-2 gap-3">
            {isPublicUnclaimed ? (
              <button
                onClick={handleClaim}
                disabled={claimMutation.isPending}
                className="pact-btn-glow col-span-2 flex items-center justify-center gap-2 rounded-full py-3 font-semibold disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))', color: 'var(--pact-bg)' }}
              >
                <Zap className="h-4 w-4" />
                {claimMutation.isPending ? 'Claiming...' : 'Claim Dare'}
              </button>
            ) : isAccepted ? (
              <>
                <button
                  onClick={() => setProofModalOpen(true)}
                  className="pact-btn-glow flex items-center justify-center gap-2 rounded-full py-3 font-semibold"
                  style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))', color: 'var(--pact-bg)' }}
                >
                  <Upload className="h-4 w-4" />
                  Upload Proof
                </button>
                <button
                  onClick={() => setVerifyModalOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-full border py-3 font-semibold transition"
                  style={{ borderColor: 'var(--pact-violet)', color: 'var(--pact-violet)' }}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Verify
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleAccept}
                  disabled={acceptMutation.isPending}
                  className="pact-btn-glow flex items-center justify-center gap-2 rounded-full py-3 font-semibold disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))', color: 'var(--pact-bg)' }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {acceptMutation.isPending ? 'Accepting...' : 'Accept'}
                </button>
                <button
                  onClick={handleDecline}
                  disabled={declineMutation.isPending}
                  className="flex items-center justify-center gap-2 rounded-full border py-3 font-semibold transition disabled:opacity-50"
                  style={{ borderColor: 'var(--pact-hairline)', color: 'var(--pact-text-dim)' }}
                >
                  <XCircle className="h-4 w-4" />
                  {declineMutation.isPending ? 'Declining...' : 'Decline'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Verification stats */}
        {stats && (stats.yes_count || stats.no_count) ? (
          <div className="rounded-2xl px-5 py-4" style={{ background: 'var(--pact-surface-2)' }}>
            <h3 className="mb-3 text-sm font-bold text-[var(--pact-text)]">Verification Stats</h3>
            <div className="flex flex-wrap gap-5">
              <StatGroup icon={CheckCircle2} value={stats.yes_count || 0} label="yes" color="var(--pact-mint)" />
              <StatGroup icon={XCircle} value={stats.no_count || 0} label="no" color="var(--pact-pink)" />
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" style={{ color: 'var(--pact-gold)' }} />
                <span className="font-bold text-[var(--pact-text)]">{(stats.confidence_avg || 0).toFixed(0)}%</span>
                <span className="text-xs font-medium text-[var(--pact-text-faint)]">confidence</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <DareProofUploadModal isOpen={proofModalOpen} onClose={() => setProofModalOpen(false)} dareId={dareId} />
      <DareVerificationModal isOpen={verifyModalOpen} onClose={() => setVerifyModalOpen(false)} dareId={dareId} />
      <DareRecipientsModal
        isOpen={recipientsModalOpen}
        onClose={() => setRecipientsModalOpen(false)}
        recipients={recipients}
        isLoading={recipientsQuery.isLoading}
      />
    </div>
  );
}
