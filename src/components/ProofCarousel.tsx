'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface Proof {
  id: number;
  url: string;
  type: 'image' | 'video';
  description?: string;
  uploadedAt?: string;
  uploader?: string;
  day?: number;
}

/**
 * The story viewer's own internal item shape. Every caller today only ever
 * passes photos/videos already tagged via `type`, so `media_type` is
 * derived from that at the boundary (see `toStoryItems` below) rather than
 * callers needing to change. Keeping it a distinct field — instead of this
 * component just branching on `type` directly everywhere — is what lets a
 * future proof kind slot in later (e.g. video proofs are planned, per
 * product) without every render branch in this file also having to learn
 * whatever string that new kind happens to arrive as on `type`.
 */
interface StoryItem extends Proof {
  media_type: 'image' | 'video';
}

function toStoryItems(proofs: Proof[]): StoryItem[] {
  return proofs.map((proof) => ({
    ...proof,
    media_type: proof.type === 'video' ? 'video' : 'image',
  }));
}

interface ProofCarouselProps {
  proofs: Proof[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

/**
 * Full-screen, Instagram/WhatsApp-style story viewer for a pact's proof
 * photos. Tap the left/right half of the screen — or swipe — to move
 * between all of a pact's proofs, with a segmented progress bar across the
 * top (one segment per proof) instead of a plain "N / total" counter.
 *
 * This is the single shared viewer opened from both real entry points in
 * the app: a tapped proof thumbnail on a feed card (via PactGallery, when
 * `interactive`) and the pact detail page's Proof Wall grid. There is
 * intentionally only one implementation — the pact detail page used to have
 * its own second, hand-rolled prev/next modal for the Proof Wall; that's now
 * this same component instead of a second viewer that could drift out of
 * sync with this one.
 *
 * Paging reuses the same native CSS scroll-snap technique PactGallery's
 * inline strip uses (see that file's own comment for the three real bugs a
 * hand-rolled drag/transform system caused there) rather than reimplementing
 * swipe detection here — the scroller handles real touch swipes on its own,
 * and the tap-left/tap-right zones are just a plain onClick on each slide
 * that reads which half of the slide was tapped, so a genuine drag/swipe
 * (which the browser does not fire `click` for) never also triggers a tap
 * navigation.
 *
 * There is no autoplay/timer — segments fill in as "viewed" (index <=
 * current) rather than draining on a clock, since nothing asked for a timed
 * advance and faking one would just be a decorative animation with no real
 * behavior behind it.
 */
export default function ProofCarousel({ proofs, isOpen, onClose, initialIndex = 0 }: ProofCarouselProps) {
  const items = useMemo(() => toStoryItems(proofs), [proofs]);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollToIndex = (index: number, behavior: ScrollBehavior = 'smooth') => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const clamped = Math.max(0, Math.min(items.length - 1, index));
    const target = scroller.children[clamped] as HTMLElement | undefined;
    target?.scrollIntoView({ behavior, inline: 'center', block: 'nearest' });
  };

  // Jump straight to the tapped thumbnail's slide the instant the viewer
  // opens, with no scroll animation — an animated scroll here would
  // visibly page through every slide in between on first open, which reads
  // as a bug rather than "starting" at the tapped photo.
  useEffect(() => {
    if (!isOpen) return;
    setActiveIndex(initialIndex);
    const frame = requestAnimationFrame(() => scrollToIndex(initialIndex, 'auto'));
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scrollToIndex reads the current scroller/items each call; only re-run on the inputs that actually change what should happen.
  }, [isOpen, initialIndex]);

  // Track which slide is actually in view via IntersectionObserver — the
  // same "ask the browser" pattern PactGallery already uses, rather than
  // deriving it from a hand-tracked drag position.
  useEffect(() => {
    if (!isOpen) return;
    const scroller = scrollerRef.current;
    if (!scroller || items.length === 0) return;

    const children = Array.from(scroller.children) as HTMLElement[];
    const ratios = new Map<HTMLElement, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => ratios.set(entry.target as HTMLElement, entry.intersectionRatio));
        let bestIndex = 0;
        let bestRatio = -1;
        children.forEach((child, index) => {
          const ratio = ratios.get(child) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestIndex = index;
          }
        });
        setActiveIndex(bestIndex);
      },
      { root: scroller, threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    children.forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [isOpen, items.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') scrollToIndex(activeIndex - 1);
      if (event.key === 'ArrowRight') scrollToIndex(activeIndex + 1);
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scrollToIndex is stable in behavior for a given activeIndex/items; re-binding on every render would just re-add the same listener.
  }, [isOpen, activeIndex, onClose]);

  if (!isOpen || items.length === 0) return null;

  const current = items[activeIndex] ?? items[0];

  // Tapping the left half of a slide steps back, the right half steps
  // forward — the standard story-viewer convention. This lives on each
  // slide itself (part of the scrollable content) rather than a separate
  // overlay layered on top of the scroller, so it never competes with the
  // scroller for touch/pointer events during a real swipe.
  const handleSlideTap = (index: number, event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const tappedRightHalf = event.clientX - rect.left > rect.width / 2;
    scrollToIndex(index + (tappedRightHalf ? 1 : -1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black" role="dialog" aria-modal="true" aria-label="Proof story viewer">
      {/* Segmented progress bar — one segment per proof, filled for the
          current slide and everything already passed through, matching the
          Instagram/WhatsApp story convention (no autoplay timer, see the
          component doc comment above). */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex gap-1 p-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        {items.map((item, index) => (
          <div key={item.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full bg-white" style={{ width: index <= activeIndex ? '100%' : '0%' }} />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close story viewer"
        className="absolute right-3 top-[calc(env(safe-area-inset-top)+1.5rem)] z-20 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition hover:bg-white/30"
      >
        <X className="h-5 w-5" />
      </button>

      <div
        ref={scrollerRef}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            onClick={(event) => handleSlideTap(index, event)}
            className="relative h-full w-full flex-shrink-0 snap-center cursor-pointer"
          >
            {item.media_type === 'image' ? (
              <Image src={item.url} alt={item.description || 'Proof'} fill className="object-contain" priority={index === initialIndex} />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-950" onClick={(event) => event.stopPropagation()}>
                <video src={item.url} controls autoPlay playsInline className="h-full w-full object-contain" />
              </div>
            )}
          </div>
        ))}
      </div>

      {(current.description || current.uploader || current.day) && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] text-white">
          {current.day ? <p className="mb-1 text-sm text-white/70">Day {current.day}</p> : null}
          {current.description && <p className="mb-1 text-base font-medium">{current.description}</p>}
          <div className="flex items-center gap-2 text-sm text-white/70">
            {current.uploader && <span>by {current.uploader}</span>}
            {current.uploadedAt && <span>{new Date(current.uploadedAt).toLocaleDateString()}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
