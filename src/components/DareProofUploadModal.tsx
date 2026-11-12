'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ImagePlus, Loader, RotateCcw, X, Zap } from 'lucide-react';
import LogoMark from '@/components/LogoMark';
import StoryCaptureSheet from '@/components/stories/StoryCaptureSheet';
import toast from 'react-hot-toast';
import ProofEditor from '@/components/dares/ProofEditor';
import { useUploadDareProof } from '@/hooks/useDareMutations';
import { canEditVideo, hasEdits, NO_EDITS, renderPhoto, renderVideo, type ProofEdits } from '@/lib/proofEdit';

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

/** One-tap answers to "How did it go?". Tapping one fills the box; typing replaces it. */
const QUICK_REPLIES = ['Easier than I thought', 'Brutal, but done', 'Again!'];

type Clip = { blob: Blob; contentType: string; duration: number; url: string };

const EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

const MAX_PHOTOS = 4;

/**
 * Dare proof uses the same camera as Moments (photo/video switch, filters), or
 * a photo or video from the phone's gallery. Photo proof can be up to 4 photos
 * sent together. It's reviewed with an optional line on how it went and sent
 * straight to the person who dared. Nothing is posted until "Send".
 */
export default function DareProofUploadModal({ isOpen, onClose, dareId, dareTitle, toName, method }: Props) {
  const upload = useUploadDareProof(dareId);
  const [clip, setClip] = useState<Clip | null>(null);
  // More photos from the gallery, after the first (up to 4 in all).
  const [extra, setExtra] = useState<Clip[]>([]);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState('');
  const [edits, setEdits] = useState<ProofEdits>(NO_EDITS);
  const [rendering, setRendering] = useState<number | null>(null);
  const lockMode = method === 'photo' || method === 'video' ? method : undefined;
  const first = toName ? toName.split(' ')[0] : 'them';

  // Start from the camera each time the sheet opens.
  useEffect(() => {
    if (!isOpen) {
      setClip((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return null;
      });
      setExtra((prev) => {
        prev.forEach((c) => URL.revokeObjectURL(c.url));
        return [];
      });
      setCaption('');
      setEdits(NO_EDITS);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const retake = () => {
    if (clip) URL.revokeObjectURL(clip.url);
    extra.forEach((c) => URL.revokeObjectURL(c.url));
    setClip(null);
    setExtra([]);
    setEdits(NO_EDITS);
  };

  const addFromGallery = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []).filter((f) => f.type.startsWith('image/'));
    event.target.value = '';
    const room = MAX_PHOTOS - 1 - extra.length;
    if (picked.length > room) toast(`Up to ${MAX_PHOTOS} photos. We kept the first ${Math.max(room, 0)}.`);
    const added = picked.slice(0, Math.max(room, 0)).map((f) => ({ blob: f, contentType: f.type, duration: 0, url: URL.createObjectURL(f) }));
    if (added.length) {
      setExtra((prev) => [...prev, ...added]);
      setEdits(NO_EDITS); // edits are for a single photo
    }
  };

  const removeExtra = (i: number) => {
    setExtra((prev) => {
      URL.revokeObjectURL(prev[i].url);
      return prev.filter((_, n) => n !== i);
    });
  };

  const send = async () => {
    if (!clip) return;
    const sourceIsPhoto = clip.contentType.startsWith('image/');
    let blob = clip.blob;
    let type = clip.contentType;
    const editable = sourceIsPhoto || canEditVideo();
    if (editable && hasEdits(edits)) {
      try {
        setRendering(0);
        const out = sourceIsPhoto ? await renderPhoto(clip.url, edits) : await renderVideo(clip.url, edits, setRendering);
        blob = out.blob;
        type = out.contentType;
      } catch {
        toast.error("Couldn't add your edits. Tap Reset to send it as shot.");
        setRendering(null);
        return;
      }
      setRendering(null);
    }
    const isPhoto = type.startsWith('image/');
    const toFile = (b: Blob, t: string, i: number) => {
      const base = t.split(';')[0];
      return new File([b], `proof-${Date.now()}-${i}.${EXTENSION[base] ?? (base.startsWith('image/') ? 'jpg' : 'mp4')}`, { type: base });
    };
    const files = [toFile(blob, type, 0), ...(isPhoto ? extra.map((c, i) => toFile(c.blob, c.contentType, i + 1)) : [])];
    upload.mutate(
      { proof_file: files, proof_type: isPhoto ? 'photo' : 'video', caption: caption.trim() || undefined },
      { onSuccess: onClose },
    );
  };

  if (!clip) {
    return createPortal(
      <StoryCaptureSheet
        isOpen
        autoStart
        lockMode={lockMode}
        pactId={0}
        pactTitle={dareTitle || 'Dare proof'}
        introText={`Shoot your proof or pick it from your gallery. It goes straight to ${first}.`}
        onCaptured={(captured) => setClip({ ...captured, url: URL.createObjectURL(captured.blob) })}
        onClose={onClose}
      />,
      document.body,
    );
  }

  const isPhoto = clip.contentType.startsWith('image/');
  const busy = upload.isPending || rendering !== null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--paper)] text-[var(--ink)]" role="dialog" aria-modal="true" aria-label="Send your proof">
      <header className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="flex size-11 items-center justify-center rounded-full disabled:opacity-50">
          <X className="size-5" aria-hidden="true" />
        </button>
        <h2 className="text-center text-[17px] font-bold tracking-[-0.01em]">Post proof</h2>
        <span />
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-3 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {/* The dare frames the proof, the way it will look to the person who sent it. */}
        <div className="rounded-[24px] bg-[var(--dare)] p-2.5">
          <ProofEditor url={clip.url} isPhoto={isPhoto} edits={edits} onChange={setEdits} disabled={busy} canEdit={extra.length === 0 && (isPhoto || canEditVideo())} />
          {isPhoto && (
            <div className="scrollbar-hide mt-2 flex gap-2 overflow-x-auto px-0.5">
              {extra.map((c, i) => (
                <span key={c.url} className="relative size-[64px] shrink-0 overflow-hidden rounded-[12px] bg-[var(--ink)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.url} alt={`Photo ${i + 2}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => removeExtra(i)}
                    aria-label={`Remove photo ${i + 2}`}
                    className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </span>
              ))}
              {extra.length < MAX_PHOTOS - 1 && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => galleryRef.current?.click()}
                  className="flex size-[64px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-[12px] border-[1.5px] border-dashed border-[var(--ink)] text-[11px] font-bold disabled:opacity-50"
                >
                  <ImagePlus className="size-5" aria-hidden="true" />
                  {extra.length + 1}/{MAX_PHOTOS}
                </button>
              )}
              <input ref={galleryRef} type="file" accept="image/*" multiple className="sr-only" onChange={addFromGallery} tabIndex={-1} aria-hidden="true" />
            </div>
          )}
          <div className="px-1.5 pb-1 pt-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[13px] font-bold">
                <Zap className="size-3.5" fill="currentColor" strokeWidth={0} aria-hidden="true" />I took the dare
              </span>
              <LogoMark size={14} />
            </div>
            {dareTitle && <p className="mt-1 line-clamp-2 text-[19px] font-bold leading-[1.15] tracking-[-0.02em]">{dareTitle}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="dare-proof-note" className="mb-1.5 block text-[15px] font-bold">
            How did it go?
          </label>
          <textarea
            id="dare-proof-note"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            disabled={busy}
            maxLength={280}
            rows={1}
            placeholder={`Tell ${first}`}
            className="w-full resize-none rounded-[14px] border border-[var(--line)] bg-[var(--card)] px-4 py-3 text-[16px] outline-none focus:border-[var(--ink)] disabled:opacity-50"
          />
          <div className="scrollbar-hide -mx-4 mt-2 flex gap-1.5 overflow-x-auto px-4">
            {QUICK_REPLIES.map((reply) => {
              const picked = caption === reply;
              return (
                <button
                  key={reply}
                  type="button"
                  disabled={busy}
                  aria-pressed={picked}
                  onClick={() => setCaption(picked ? '' : reply)}
                  className={`cp-hit relative h-9 shrink-0 rounded-full px-3 text-[13px] font-semibold disabled:opacity-50 ${picked ? 'bg-[var(--ink)] text-[var(--dare)]' : 'border border-[var(--line)] bg-[var(--card)] text-[var(--ink)]'}`}
                >
                  {reply}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-auto flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={retake}
            disabled={busy}
            className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-full border-[1.5px] border-[var(--ink)] text-[15px] font-bold disabled:opacity-50"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Retake
          </button>
          <button
            type="button"
            onClick={() => void send()}
            disabled={busy}
            className="flex h-[52px] flex-[1.6] items-center justify-center gap-2 rounded-full bg-[var(--ink)] text-[16px] font-bold text-[var(--dare)] disabled:opacity-60"
          >
            {busy ? <Loader className="size-4 animate-spin" aria-hidden="true" /> : <Zap className="size-4" fill="currentColor" strokeWidth={0} aria-hidden="true" />}
            {rendering !== null ? (rendering > 0 ? `Adding edits ${Math.round(rendering * 100)}%` : 'Adding edits…') : upload.isPending ? 'Sending…' : `Send to ${first}`}
          </button>
        </div>
        <p className="text-center text-[12.5px] text-[var(--muted)]">{isPhoto ? `Up to ${MAX_PHOTOS} photos. ` : ''}You can delete your proof anytime.</p>
      </div>
    </div>,
    document.body,
  );
}
