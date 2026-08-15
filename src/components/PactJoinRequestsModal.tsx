'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle2, XCircle, Clock3, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';
import { joinRequestService } from '@/services/api';
import { PactJoinRequest } from '@/types';
import UserAvatarLink from '@/components/UserAvatarLink';

interface PactJoinRequestsModalProps {
  pactId: number;
  isOpen: boolean;
  onClose: () => void;
  /** Notifies the parent so it can refresh participant counts/lists after a request is handled. */
  onRequestHandled?: () => void;
}

/**
 * The "window" a pact creator lands in to accept/reject pending join
 * requests — previously built (as PactJoinRequestsManager) but never
 * rendered anywhere, so a creator clicking a "so-and-so wants to join"
 * notification had nowhere to actually act on it. Rendered from the pact
 * detail page (see src/app/pacts/[id]/page.tsx), and auto-opened when that
 * page is reached via a join-request notification.
 */
export default function PactJoinRequestsModal({ pactId, isOpen, onClose, onRequestHandled }: PactJoinRequestsModalProps) {
  const [requests, setRequests] = useState<PactJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [handlingRequestId, setHandlingRequestId] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setLoading(true);

    joinRequestService
      .listPending(pactId)
      .then((response) => {
        if (cancelled) return;
        setRequests(response.data.filter((r: PactJoinRequest) => r.status === 'pending'));
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load join requests');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, pactId]);

  const handleApprove = async (requestId: number) => {
    setHandlingRequestId(requestId);
    try {
      await joinRequestService.approve(pactId, requestId);
      toast.success('Join request approved');
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      onRequestHandled?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to approve request');
    } finally {
      setHandlingRequestId(null);
    }
  };

  const handleReject = async (requestId: number) => {
    setHandlingRequestId(requestId);
    try {
      await joinRequestService.reject(pactId, requestId);
      toast.success('Join request rejected');
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      onRequestHandled?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to reject request');
    } finally {
      setHandlingRequestId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-[24px] shadow-xl"
        style={{ background: 'var(--pact-surface)', border: '1px solid var(--pact-hairline)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-6" style={{ borderColor: 'var(--pact-hairline)' }}>
          <div className="flex items-center gap-2">
            <Clock3 className="h-5 w-5" style={{ color: 'var(--pact-text-faint)' }} />
            <h2 className="text-xl font-bold" style={{ color: 'var(--pact-text)' }}>
              Join requests {requests.length > 0 ? `(${requests.length})` : ''}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="transition"
            style={{ color: 'var(--pact-text-faint)' }}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] space-y-3 overflow-y-auto p-6">
          {loading ? (
            <p className="py-8 text-center text-sm" style={{ color: 'var(--pact-text-faint)' }}>
              Loading requests...
            </p>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Inbox className="h-8 w-8" style={{ color: 'var(--pact-text-faint)' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--pact-text)' }}>
                No pending join requests
              </p>
              <p className="text-xs" style={{ color: 'var(--pact-text-faint)' }}>
                You&apos;ll see requests here as people ask to join this pact.
              </p>
            </div>
          ) : (
            requests.map((request) => (
              <div
                key={request.id}
                className="space-y-3 rounded-[24px] p-4"
                style={{ background: 'var(--pact-surface-2)', border: '1px solid var(--pact-hairline)' }}
              >
                <div className="flex items-center gap-3">
                  <UserAvatarLink
                    name={request.user?.full_name || request.user?.username}
                    avatarUrl={request.user?.avatar_url}
                    username={request.user?.username}
                    size={40}
                    stopPropagation
                  />
                  <div className="min-w-0">
                    <p className="truncate font-semibold" style={{ color: 'var(--pact-text)' }}>
                      {request.user?.full_name}
                    </p>
                    <p className="truncate text-xs" style={{ color: 'var(--pact-text-faint)' }}>
                      @{request.user?.username}
                    </p>
                  </div>
                </div>

                {request.request_message && (
                  <p className="text-sm italic" style={{ color: 'var(--pact-text-dim)' }}>
                    &quot;{request.request_message}&quot;
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(request.id)}
                    disabled={handlingRequestId === request.id}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, var(--pact-mint), var(--pact-violet))' }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(request.id)}
                    disabled={handlingRequestId === request.id}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ background: 'var(--pact-surface-3)', color: 'var(--pact-text-dim)', border: '1px solid var(--pact-hairline)' }}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
