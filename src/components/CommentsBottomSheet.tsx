'use client';

import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import CommentSection from './CommentSection';
import { cleanTitle } from '@/lib/titleCase';
import { useBackToClose } from '@/hooks/useBackToClose';

interface CommentsBottomSheetProps {
  pactId: number;
  pactTitle?: string;
  commentCount: number;
  isOpen: boolean;
  onClose: () => void;
  /** Reports the new total as people add or delete comments and replies. */
  onCountChange?: (count: number) => void;
  aboveViewer?: boolean;
  /** A comment or reply to scroll to and highlight (from a notification). */
  focusCommentId?: number | null;
}

/**
 * Comments for a pact, in a sheet. The sheet is portalled to document.body:
 * the `.pact-list-item` wrapper every list card sits in leaves a transform
 * behind that would trap a `fixed inset-0` overlay inside the card.
 */
export default function CommentsBottomSheet({
  pactId,
  pactTitle,
  commentCount,
  isOpen,
  onClose,
  onCountChange,
  aboveViewer = false,
  focusCommentId = null,
}: CommentsBottomSheetProps) {
  useBackToClose(isOpen, onClose);
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Close comments"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`fixed inset-0 ${aboveViewer ? 'z-[110]' : 'z-[60]'} cursor-default bg-black/60`}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed inset-x-0 bottom-0 ${aboveViewer ? 'z-[111]' : 'z-[61]'} mx-auto flex h-[88dvh] max-w-md flex-col overflow-hidden rounded-t-[24px]`}
            style={{ background: '#F4EFE4', color: '#17181D' }}
            role="dialog"
            aria-label="Comments"
          >
            <div className="mx-auto mt-2.5 h-[5px] w-10 shrink-0 rounded-full" style={{ background: '#D9D2C2' }} />
            <div className="flex shrink-0 items-center gap-2 pl-5 pr-2 pt-1.5">
              <div className="min-w-0 flex-1">
                <div className="text-[18px] font-extrabold tracking-[-0.02em]">Comments</div>
                {pactTitle && <div className="truncate text-[13px]" style={{ color: '#5A5C63' }}>{cleanTitle(pactTitle)}</div>}
              </div>
              <button type="button" onClick={onClose} aria-label="Close comments" className="flex size-11 items-center justify-center">
                <X className="size-[22px]" strokeWidth={2.2} />
              </button>
            </div>
            <CommentSection pactId={pactId} initialCount={commentCount} onCountChange={onCountChange} focusCommentId={focusCommentId} />
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
