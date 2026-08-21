'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus, Check, Loader, Users } from 'lucide-react';
import { useCircles } from '@/hooks/useCircles';
import { useInviteUserToCircle } from '@/hooks/useCircleMutations';

interface AddToCircleSheetProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: number;
  targetName: string;
}

/**
 * "Add to a Circle" chooser — replaces the old behavior of jumping
 * straight into the create-circle flow. Offers the viewer's existing
 * circles first (each with an inline "Add" action via
 * useInviteUserToCircle, same mutation InviteMembersModal already uses,
 * so it already downgrades gracefully if the invite endpoint isn't live
 * yet), with "Create a new circle" as a secondary path at the bottom that
 * falls through to the existing /circles/create?inviteUserId= flow.
 */
function CircleRow({ circle, targetUserId }: { circle: any; targetUserId: number }) {
  const invite = useInviteUserToCircle(circle.id);
  const [added, setAdded] = useState(false);

  const handleAdd = async () => {
    if (invite.isPending || added) return;
    try {
      await invite.mutateAsync({ userId: targetUserId });
      setAdded(true);
    } catch {
      // Error toast already handled inside useInviteUserToCircle.
    }
  };

  return (
    <div
      className="flex items-center gap-3 rounded-[24px] p-3"
      style={{ background: 'var(--pact-surface-2)' }}
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl"
        style={{ background: 'var(--pact-surface)' }}
      >
        {circle.icon_emoji || '◉'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--pact-text)]">{circle.name}</p>
        <p className="truncate text-xs text-[var(--pact-text-faint)]">{circle.member_count ?? 0} members</p>
      </div>
      <button
        type="button"
        onClick={handleAdd}
        disabled={invite.isPending || added}
        className="flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition disabled:opacity-70"
        style={
          added
            ? { background: 'transparent', border: '1px solid var(--pact-hairline)', color: 'var(--pact-text-muted)' }
            : { background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))', color: '#fff' }
        }
      >
        {invite.isPending ? (
          <Loader className="h-3.5 w-3.5 animate-spin" />
        ) : added ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Plus className="h-3.5 w-3.5" />
        )}
        {invite.isPending ? 'Adding' : added ? 'Added' : 'Add'}
      </button>
    </div>
  );
}

export default function AddToCircleSheet({ isOpen, onClose, targetUserId, targetName }: AddToCircleSheetProps) {
  const router = useRouter();
  const circlesQuery = useCircles();
  const myCircles: any[] = circlesQuery.data || [];

  if (!isOpen) return null;

  const handleCreateNew = () => {
    onClose();
    router.push(`/circles/create?inviteUserId=${targetUserId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 md:items-center md:p-4" onClick={onClose}>
      <div
        className="flex w-full max-w-md flex-col rounded-t-[28px] md:rounded-[28px] max-h-[80vh]"
        style={{ background: 'var(--pact-surface)', border: '1px solid var(--pact-hairline)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-[var(--pact-hairline)] flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[var(--pact-text)]">Add to a Circle</h2>
            <p className="mt-0.5 text-xs text-[var(--pact-text-faint)]">Choose a circle to add {targetName} to</p>
          </div>
          <button onClick={onClose} className="text-[var(--pact-text-faint)] hover:text-[var(--pact-text)] transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing circles */}
        <div className="overflow-y-auto p-4 flex-1">
          {circlesQuery.isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader className="h-5 w-5 animate-spin" style={{ color: 'var(--pact-violet)' }} />
            </div>
          ) : myCircles.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center" style={{ color: 'var(--pact-text-faint)' }}>
              <Users className="h-6 w-6" />
              <p className="text-sm">You&apos;re not in any circles yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {myCircles.map((circle: any) => (
                <CircleRow key={circle.id} circle={circle} targetUserId={targetUserId} />
              ))}
            </div>
          )}
        </div>

        {/* Secondary path: create a new circle */}
        <div className="p-4 pt-2 border-t border-[var(--pact-hairline)] flex-shrink-0">
          <button
            type="button"
            onClick={handleCreateNew}
            className="flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition"
            style={{ background: 'var(--pact-surface-2)', border: '1px dashed var(--pact-violet)', color: 'var(--pact-violet)' }}
          >
            <Plus className="h-4 w-4" />
            Create a new circle
          </button>
        </div>
      </div>
    </div>
  );
}
