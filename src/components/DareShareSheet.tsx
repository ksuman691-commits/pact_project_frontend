'use client';

import { useRouter } from 'next/navigation';
import { Share2, Link2, UserCircle2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { dareShareUrl } from '@/services/darePublicShareService';

interface DareShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  dareId: number;
  dareTitle: string;
}

/**
 * Bottom sheet for sharing a completed dare's proof photo — same modal
 * shell convention as DareRecipientsModal/DareVerificationModal (backdrop +
 * rounded-top card, X to close). Two actions:
 *   - Share / copy link: web share sheet where supported, clipboard
 *     fallback otherwise — same pattern CircleShareCard already uses for
 *     the Circle Wall link.
 *   - View on your profile: routes to the Dares tab on the user's own
 *     profile, where this same completed dare now surfaces (see
 *     ProfileTabs' DaresTab).
 */
export default function DareShareSheet({ isOpen, onClose, dareId, dareTitle }: DareShareSheetProps) {
  const router = useRouter();
  if (!isOpen) return null;

  const url = dareShareUrl(dareId);

  const handleShare = async () => {
    const shareData = {
      title: `${dareTitle} — CirclePact`,
      text: `Check out this completed dare: ${dareTitle}`,
      url,
    };
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled the native share sheet — fall through to clipboard
        // so the action still does something useful instead of silently
        // failing.
      }
    }
    await handleCopyLink();
  };

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  const handleViewOnProfile = () => {
    onClose();
    router.push('/profile?tab=dares');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 md:items-center md:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl pb-[env(safe-area-inset-bottom)] md:rounded-3xl"
        style={{ background: 'var(--pact-surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between border-b px-6 py-4"
          style={{ borderColor: 'var(--pact-hairline)' }}
        >
          <h2 className="text-lg font-bold text-[var(--pact-text)]">Share this dare</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-[var(--pact-text-faint)] transition hover:bg-[var(--pact-surface-2)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2 p-4">
          <button
            onClick={handleShare}
            className="pact-btn-glow flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-semibold text-white transition"
            style={{ background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))' }}
          >
            <Share2 className="h-5 w-5" />
            Share
          </button>

          <button
            onClick={handleCopyLink}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-semibold text-[var(--pact-text)] transition hover:bg-[var(--pact-surface-2)]"
          >
            <Link2 className="h-5 w-5 text-[var(--pact-text-dim)]" />
            Copy link
          </button>

          <button
            onClick={handleViewOnProfile}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-semibold text-[var(--pact-text)] transition hover:bg-[var(--pact-surface-2)]"
          >
            <UserCircle2 className="h-5 w-5 text-[var(--pact-text-dim)]" />
            View on your profile
          </button>
        </div>
      </div>
    </div>
  );
}
