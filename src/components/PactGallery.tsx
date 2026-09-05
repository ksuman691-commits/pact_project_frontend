'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Play, PartyPopper } from 'lucide-react';
import ProofCarousel from './ProofCarousel';
import type { CheerItem } from './CheerGallery';

interface Proof {
  id: number;
  url: string;
  type: 'image' | 'video';
  description?: string;
  uploadedAt?: string;
  uploader?: string;
  day?: number;
}

export interface GalleryTile {
  id: number;
  url: string;
  type: 'image' | 'video';
  description?: string;
  uploadedAt?: string;
  uploader?: string;
  day?: number;
  kind: 'proof' | 'cheer';
}

/**
 * Merges proof submissions + active cheers into one deduped, most-recent-first
 * tile list. This is the single source of truth for "what photos does this
 * pact have" — both the feed card's hero slot and the detail-page carousel
 * call this same function so a pact never shows two different photo sets.
 * Proof tiles and cheer tiles are merged into this one list and rendered
 * through the exact same <Tile> markup below — there is no separate
 * render path per kind that could drift out of sync with the other.
 */
export function buildGalleryTiles(proofs: Proof[], cheers: CheerItem[]): GalleryTile[] {
  const activeCheers = cheers.filter(
    (cheer) => !cheer.expires_at || new Date(cheer.expires_at).getTime() > Date.now(),
  );

  const proofTiles: GalleryTile[] = proofs.map((proof) => ({
    id: proof.id,
    url: proof.url,
    type: proof.type,
    description: proof.description,
    uploadedAt: proof.uploadedAt,
    uploader: proof.uploader,
    day: proof.day,
    kind: 'proof',
  }));
  const cheerTiles: GalleryTile[] = activeCheers
    .filter((cheer) => cheer.photo_url)
    .map((cheer) => ({
      // Negate cheer ids so they can never collide with a proof id in the
      // merged list (both id spaces start at 1+ from independent tables).
      id: -cheer.id,
      url: cheer.photo_url as string,
      type: 'image',
      uploadedAt: cheer.created_at ?? undefined,
      uploader: cheer.sender_username ?? undefined,
      kind: 'cheer',
    }));

  return [...proofTiles, ...cheerTiles].sort((a, b) => {
    const aTime = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
    const bTime = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
    return bTime - aTime;
  });
}

interface PactGalleryProps {
  proofs: Proof[];
  cheers: CheerItem[];
  /** Aspect ratio of each slide — square for the detail-page strip, 4/5 for the feed hero. */
  aspectClassName?: string;
  /**
   * Fires with the index of whichever slide the browser currently considers
   * "in view" — derived from real scroll position via IntersectionObserver,
   * not from state this component has to keep synced with what's on screen.
   * The parent (e.g. the feed hero's story-dot row) is free to just display
   * whatever index this reports; it never has to command the scroll
   * position itself.
   */
  onActiveIndexChange?: (index: number) => void;
  /**
   * When false, tiles are non-interactive (no tap-to-open lightbox) — used
   * in the feed hero, where a tap on the photo should fall through to the
   * card's own tap-to-open-detail handler instead.
   */
  interactive?: boolean;
  /**
   * 'below' (default) lays the dot row out under the strip, adding its own
   * height — right for the detail-page strip. 'overlay' floats the dots
   * over the bottom of the image instead, for use inside a fixed-aspect
   * container like the feed hero, where extra layout height isn't available.
   * 'none' renders no dots at all — used by the feed hero, which draws its
   * own story-bar indicator fed by onActiveIndexChange instead.
   */
  dotsPosition?: 'below' | 'overlay' | 'none';
  /** Fills the parent's height instead of sizing itself via aspectClassName — used by the feed hero. */
  fillHeight?: boolean;
  /**
   * Extra non-tile slide appended after the real photos/cheers — used by
   * FeedPactCard's "+ Add today" CTA when there's already at least one
   * proof photo but today's hasn't been submitted yet. Counted as its own
   * slide in the dot row below so the dots always match what's actually
   * swipeable, even though it isn't a GalleryTile itself.
   */
  trailingSlot?: React.ReactNode;
}

/**
 * Unified Instagram-style photo strip combining proof submissions and cheers
 * into one horizontally swipeable carousel, sorted most-recent-first. Lives
 * directly in the pact card body — no header/label, no grid framing — so it
 * reads as part of the post rather than a separate "Gallery" section. Reused
 * as-is for both the feed card's hero slot and the pact detail page, so
 * there is exactly one photo display per pact, not two.
 *
 * Paging is handled entirely by native CSS scroll-snap (`overflow-x-auto` +
 * `snap-x snap-mandatory` on the row, `snap-center` on each tile) instead of
 * a hand-built pointer-drag + CSS-transform system. The previous custom
 * implementation caused three separate rounds of real bugs, all stemming
 * from the same root cause — reimplementing what the browser already does
 * natively and correctly:
 *   1. A swipe-vs-tap-to-navigate "ghost click" conflict, needing a manual
 *      didDragRef flag to suppress the browser's own synthesized click after
 *      a drag.
 *   2. A swipe-vs-native-scroll race on real touch devices, where a fast
 *      flick could kick off native momentum scrolling on the "controlled"
 *      strip even though it was meant to be driven only by JS, landing on a
 *      different slide than the JS-tracked index and desyncing the dots.
 *   3. A blank slide 2/3 on Android TWA/WebView Chromium builds, because a
 *      manually-positioned `transform: translateX(...)` strip has no
 *      inherent reason to be composited/painted the way a real native
 *      scroll position does, and needed a `will-change: transform` hint as
 *      a workaround.
 * Native scroll-snap has none of these failure modes by construction: the
 * browser already distinguishes a scroll gesture from a tap before firing
 * (or suppressing) `click`, there's only one scrolling system (not two
 * racing each other), and a real scroll position is exactly what the
 * browser's own compositor is built to paint correctly.
 */
export default function PactGallery({
  proofs,
  cheers,
  aspectClassName = 'aspect-square',
  onActiveIndexChange,
  interactive = true,
  dotsPosition = 'below',
  fillHeight = false,
  trailingSlot,
}: PactGalleryProps) {
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);
  // A genuine image load failure (expired signed URL, network drop) used to
  // fail completely silently — the <img> just never painted, leaving a bare
  // slide with no error icon and no indication anything went wrong, which
  // is indistinguishable from a paint/compositing glitch by looking at the
  // screen alone. Tracking failures here surfaces a visible, tappable retry
  // state instead, so a real failure is diagnosable rather than a silent
  // blank tile.
  const [failedTileKeys, setFailedTileKeys] = useState<Set<string>>(() => new Set());
  const scrollerRef = useRef<HTMLDivElement>(null);
  // Ref-mirrors the latest callback so the IntersectionObserver effect below
  // can depend only on `tiles.length` (recreate the observer when the slide
  // count actually changes) without also tearing it down and rebuilding it
  // on every render just because the parent passed a fresh closure.
  const onActiveIndexChangeRef = useRef(onActiveIndexChange);
  useEffect(() => {
    onActiveIndexChangeRef.current = onActiveIndexChange;
  }, [onActiveIndexChange]);

  const tiles: GalleryTile[] = useMemo(() => buildGalleryTiles(proofs, cheers), [proofs, cheers]);
  // Total swipeable slide count — real tiles plus the optional trailing
  // "+ Add today" slot, which isn't a GalleryTile but still occupies a real
  // scroll-snap child and therefore needs its own dot.
  const slideCount = tiles.length + (trailingSlot ? 1 : 0);
  const firstTileId = tiles[0]?.id;
  const lastTileId = tiles[tiles.length - 1]?.id;

  // The single source of truth for "which slide is active" is the browser's
  // own scroll position, read via IntersectionObserver rather than tracked
  // in JS state that has to be kept perfectly in sync with a hand-rolled
  // drag gesture. Whichever tile has the greatest intersection ratio with
  // the scroller this observation cycle is the active one; a fast scroll
  // can cross multiple thresholds in the same frame, so picking the single
  // most-visible tile (rather than reacting to each entry independently)
  // avoids the dot flickering between two indices mid-scroll.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    if (slideCount <= 1) {
      setActiveSlide(0);
      onActiveIndexChangeRef.current?.(0);
      return;
    }

    const items = Array.from(scroller.children) as HTMLElement[];
    const ratios = new Map<HTMLElement, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratios.set(entry.target as HTMLElement, entry.intersectionRatio);
        });
        let bestIndex = 0;
        let bestRatio = -1;
        items.forEach((item, index) => {
          const ratio = ratios.get(item) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestIndex = index;
          }
        });
        setActiveSlide(bestIndex);
        onActiveIndexChangeRef.current?.(bestIndex);
      },
      { root: scroller, threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
    // Deliberately keyed on tile identity (via length + first/last id) plus
    // slideCount (covers the trailing "+ Add today" slot appearing or
    // disappearing) so a pact swap that still happens to have the same
    // slide count (rare, but possible) still tears down and rebuilds the
    // observer against the new DOM nodes rather than silently observing
    // stale ones.
  }, [slideCount, firstTileId, lastTileId]);

  if (tiles.length === 0 && !trailingSlot) return null;

  const handleTileClick = (index: number) => {
    if (!interactive) return;
    setSelectedIndex(index);
    setCarouselOpen(true);
  };

  const scrollToIndex = (index: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const target = scroller.children[index] as HTMLElement | undefined;
    target?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  const Tile = interactive ? 'button' : 'div';

  return (
    <>
      <div className={`relative ${fillHeight ? 'h-full' : ''}`}>
        <div
          ref={scrollerRef}
          className={`flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            fillHeight ? 'h-full' : ''
          }`}
        >
          {tiles.map((tile, index) => (
            <Tile
              key={`${tile.kind}-${tile.id}`}
              type={interactive ? 'button' : undefined}
              onClick={interactive ? () => handleTileClick(index) : undefined}
              aria-label={
                interactive
                  ? `${tile.kind === 'cheer' ? 'Cheer' : tile.type === 'video' ? 'Video proof' : 'Photo proof'}${tile.day ? `, day ${tile.day}` : ''}`
                  : undefined
              }
              className={`group relative ${fillHeight ? 'h-full' : aspectClassName} w-full flex-shrink-0 snap-center overflow-hidden bg-white/5 text-left focus:outline-none ${
                interactive ? 'rounded-2xl' : ''
              }`}
            >
              {tile.type === 'image' ? (
                failedTileKeys.has(`${tile.kind}-${tile.id}`) ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setFailedTileKeys((prev) => {
                        const next = new Set(prev);
                        next.delete(`${tile.kind}-${tile.id}`);
                        return next;
                      });
                    }}
                    className="flex h-full w-full flex-col items-center justify-center gap-1 bg-white/5 text-xs font-medium text-white/60"
                  >
                    <span>Photo failed to load</span>
                    <span className="text-white/40">Tap to retry</span>
                  </button>
                ) : (
                  <Image
                    src={tile.url}
                    alt={tile.description || (tile.kind === 'cheer' ? `Cheer from ${tile.uploader || 'a member'}` : 'Proof')}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 480px"
                    // The tile count here is small and capped, so loading all
                    // of them eagerly means slide 2/3 are already decoded and
                    // ready the moment the user scrolls to them, rather than
                    // waiting on a lazy-load fetch mid-swipe.
                    loading="eager"
                    priority={index === 0}
                    onError={() =>
                      setFailedTileKeys((prev) => new Set(prev).add(`${tile.kind}-${tile.id}`))
                    }
                  />
                )
              ) : (
                <div className="relative h-full w-full bg-slate-900">
                  <video src={tile.url} className="h-full w-full object-cover" muted playsInline />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <Play className="h-10 w-10 fill-white text-white" />
                  </div>
                </div>
              )}

              <span
                className={`absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white ${
                  tile.kind === 'cheer' ? '' : 'bg-[var(--pact-violet)]'
                }`}
                style={tile.kind === 'cheer' ? { background: 'var(--pact-gold)' } : undefined}
              >
                {tile.kind === 'cheer' && <PartyPopper className="h-2.5 w-2.5" />}
                {tile.kind === 'cheer' ? 'Cheer' : tile.day ? `Day ${tile.day}` : 'Proof'}
              </span>

              {/* Only cheer tiles need their own uploader credit here — proof
                  tiles already show the same person in FeedPactCard's own
                  top header row (creatorLabel), so repeating it was
                  redundant. This is anchored to the top, under the kind
                  badge, rather than the bottom — the bottom edge is already
                  owned by FeedPactCard's own title/circle-name overlay, and
                  two independently-sized absolute blocks anchored to the
                  same edge collide by construction regardless of either
                  one's text length. */}
              {tile.kind === 'cheer' && tile.uploader && (
                <div className="absolute left-2.5 top-10 max-w-[calc(100%-1.25rem)] truncate rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                  from @{tile.uploader}
                </div>
              )}
            </Tile>
          ))}
          {trailingSlot && (
            <div className={`flex-shrink-0 snap-center ${fillHeight ? 'h-full' : aspectClassName} w-full`}>
              {trailingSlot}
            </div>
          )}
        </div>

        {slideCount > 1 && dotsPosition !== 'none' && (
          <div
            className={
              dotsPosition === 'overlay'
                ? 'pointer-events-none absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-1.5'
                : 'mt-2 flex items-center justify-center gap-1.5'
            }
          >
            {Array.from({ length: slideCount }).map((_, index) => (
              <button
                key={`dot-${index}`}
                type="button"
                aria-label={`Go to photo ${index + 1}`}
                onClick={() => scrollToIndex(index)}
                className={`pointer-events-auto h-1.5 rounded-full transition-all ${
                  index === activeSlide
                    ? `w-4 ${dotsPosition === 'overlay' ? 'bg-white' : 'bg-[var(--pact-violet)]'}`
                    : `w-1.5 ${dotsPosition === 'overlay' ? 'bg-white/40' : 'bg-white/25'}`
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {interactive && (
        <ProofCarousel proofs={tiles} isOpen={carouselOpen} onClose={() => setCarouselOpen(false)} initialIndex={selectedIndex} />
      )}
    </>
  );
}
