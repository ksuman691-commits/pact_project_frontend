'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader, RotateCcw, X } from 'lucide-react';
import StoryCaptureSheet from '@/components/stories/StoryCaptureSheet';
import { useUploadDareProof } from '@/hooks/useDareMutations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  dareId: number;
  dareTitle?: string;
  /** Who the proof goes to: the person who sent the dare. */
  toName?: string;
  /** What the dare asks for. Anything else lets the doer pick photo or video. */
  method?: string | null;
}

type Clip = { blob: Blob; contentType: string; duration: number; url: string };

const EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

/**
 * Dare proof is shot live with the same camera as Moments (photo/video
 * switch, filters, no library), then reviewed with an optional caption and
 * sent straight to the person who dared. Nothing is posted until "Send".
 */
export default function DareProofUploadModal({ isOpen, onClose, dareId, dareTitle, toName, method }: Props) {
  const upload = useUploadDareProof(dareId);
  const [clip, setClip] = useState<Clip | null>(null);
  const [caption, setCaption] = useState('');
  const lockMode = method === 'photo' || method === 'video' ? method : undefined;
  const first = toName ? toName.split(' ')[0] : 'them';

  // Start from the camera each time the sheet opens.
  useEffect(() => {
    if (!isOpen) {
      setClip((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return null;
      });
      setCaption('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const retake = () => {
    if (clip) URL.revokeObjectURL(clip.url);
    setClip(null);
  };

  const send = () => {
    if (!clip) return;
    const isPhoto = clip.contentType.startsWith('image/');
    const base = clip.contentType.split(';')[0];
    const file = new File([clip.blob], `proof-${Date.now()}.${EXTENSION[base] ?? (isPhoto ? 'jpg' : 'mp4')}`, { type: base });
    upload.mutate(
      { proof_file: file, proof_type: isPhoto ? 'photo' : 'video', caption: caption.trim() || undefined },
      { onSuccess: onClose },
    );
  };

  if (!clip) {
    return createPortal(
      <StoryCaptureSheet
        isOpen
        autoStart
        liveOnly
        lockMode={lockMode}
        pactId={0}
        pactTitle={dareTitle || 'Dare proof'}
        introText={`Shoot your proof now. It goes straight to ${first}.`}
        onCaptured={(captured) => setClip({ ...captured, url: URL.createObjectURL(captured.blob) })}
        onClose={onClose}
      />,
      document.body,
    );
  }

  const isPhoto = clip.contentType.startsWith('image/');
  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--paper)] text-[var(--ink)]" role="dialog" aria-modal="true" aria-label="Send your proof">
      <header className="flex items-center justify-between px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <h2 className="text-[18px] font-extrabold tracking-[-0.02em]">Send your proof</h2>
        <button type="button" onClick={onClose} disabled={upload.isPending} aria-label="Close" className="flex size-11 items-center justify-center rounded-full disabled:opacity-50">
          <X className="size-5" aria-hidden="true" />
        </button>
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {dareTitle && <p className="truncate text-[14px] font-semibold text-[var(--muted)]">{dareTitle}</p>}
        <div className="flex justify-center">
          {isPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={clip.url} alt="Your proof" className="max-h-[52vh] w-full max-w-[300px] rounded-[18px] bg-[var(--ink)] object-contain" />
          ) : (
            <video src={clip.url} autoPlay loop muted playsInline controls className="aspect-[9/16] max-h-[52vh] w-full max-w-[300px] rounded-[18px] bg-[var(--ink)] object-cover" />
          )}
        </div>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          disabled={upload.isPending}
          maxLength={280}
          rows={2}
          placeholder={`Add a caption for ${first} (optional)`}
          aria-label="Caption"
          className="w-full resize-none rounded-[16px] border border-[var(--line)] bg-[var(--card)] px-4 py-3 text-[15px] outline-none focus:border-[var(--navy)] disabled:opacity-50"
        />
        <div className="mt-auto flex gap-3 pt-2">
          <button
            type="button"
            onClick={retake}
            disabled={upload.isPending}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border-[1.5px] border-[var(--line)] text-[15px] font-semibold disabled:opacity-50"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Retake
          </button>
          <button
            type="button"
            onClick={send}
            disabled={upload.isPending}
            className="flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-full bg-[var(--navy)] text-[15px] font-semibold text-white disabled:opacity-60"
          >
            {upload.isPending && <Loader className="size-4 animate-spin" aria-hidden="true" />}
            {upload.isPending ? 'Sending…' : `Send to ${first}`}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
