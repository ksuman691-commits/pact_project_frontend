'use client';

import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import CommentSection from './CommentSection';

interface CommentsBottomSheetProps {
  pactId: number;
  commentCount: number;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Spring-up bottom sheet that presents the existing CommentSection inline
 * instead of navigating to the pact detail page's Comments tab. Reuses
 * CommentSection's real data/mutations as-is — this component only owns
 * the sheet chrome (backdrop, handle, header, close) around it.
 *
 * Portalled straight to document.body. Rendering this inline where the feed
 * card lives isn't enough to guarantee `fixed inset-0` covers the real
 * viewport: the `.pact-list-item` wrapper every list card sits in leaves a
 * non-"none" transform behind after its mount-in animation, which creates
 * its own containing block and silently traps this sheet inside the card
 * instead of the viewport (see DareProofUploadModal for the same fix).
 */
export default function CommentsBottomSheet({ pactId, commentCount, isOpen, onClose }: CommentsBottomSheetProps) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="close comments"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] cursor-default bg-black/60"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 z-[61] mx-auto flex h-[70vh] max-w-md flex-col overflow-hidden rounded-t-[24px] border border-b-0 border-[var(--pact-hairline)] bg-[var(--pact-surface-raised)]"
            role="dialog"
            aria-label={`Comments, ${commentCount}`}
          >
            <div className="mx-auto mt-2.5 h-1 w-9 flex-shrink-0 rounded-full bg-[var(--pact-hairline)]" />

            <div className="flex flex-shrink-0 items-center justify-between border-b border-[var(--pact-hairline)] px-4 py-3">
              <p
                className="text-[15px] font-black text-[var(--pact-text)]"
                style={{ fontFamily: 'var(--font-pact-display), sans-serif' }}
              >
                Comments &middot; {commentCount}
              </p>
              <button
                type="button"
                onClick={onClose}
                aria-label="close comments"
                className="text-[var(--pact-text-faint)] transition hover:text-[var(--pact-text)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <CommentSection pactId={pactId} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
