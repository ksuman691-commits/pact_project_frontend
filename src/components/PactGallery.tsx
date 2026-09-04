'use client';

import React, { useMemo, useRef, useState } from 'react';
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
   * Externally-controlled active slide (e.g. driven by the feed card's own
   * swipe gesture). When provided, the carousel scrolls to this index
   * instead of tracking its own.
   */
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  /**
   * When false, tiles are non-interactive (no tap-to-open lightbox) — used
   * in the feed hero, where a tap on the photo should fall through to the
   * card's own tap-to-open-detail / double-tap-to-cheer handlers instead.
   */
  interactive?: boolean;
  /**
   * 'below' (default) lays the dot row out under the strip, adding its own
   * height — right for the detail-page strip. 'overlay' floats the dots
   * over the bottom of the image instead, for use inside a fixed-aspect
   * container like the feed hero, where extra layout height isn't available.
   */
  dotsPosition?: 'below' | 'overlay' | 'none';
  /** Fills the parent's height instead of sizing itself via aspectClassName — used by the feed hero. */
  fillHeight?: boolean;
  /**
   * Live per-pixel horizontal offset from an in-progress controlling drag
   * (e.g. the feed hero's own pointer gesture). Lets the strip track the
   * finger 1:1 in real time, Instagram-style, instead of only updating once
   * the gesture commits on release. Ignored unless `activeIndex` is also
   * controlled.
   */
  dragOffsetPx?: number;
  /**
   * True while the controlling drag above is in progress. Suppresses the
   * settle transition so the strip doesn't fight the live `dragOffsetPx`
   * updates — the transition re-enables the instant the drag ends, which is
   * what animates the smooth settle into the next/previous slide.
   */
  isDragging?: boolean;
}

/**
 * Unified Instagram-style photo strip combining proof submissions and cheers
 * into one horizontally swipeable carousel, sorted most-recent-first. Lives
 * directly in the pact card body — no header/label, no grid framing — so it
 * reads as part of the post rather than a separate "Gallery" section. Reused
 * as-is for both the feed card's hero slot and the pact detail page, so
 * there is exactly one photo display per pact, not two.
 */
export default function PactGallery({
  proofs,
  cheers,
  aspectClassName = 'aspect-square',
  activeIndex,
  onActiveIndexChange,
  interactive = true,
  dotsPosition = 'below',
  fillHeight = false,
  dragOffsetPx = 0,
  isDragging = false,
}: PactGalleryProps) {
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [internalActiveSlide, setInternalActiveSlide] = useState(0);
  // A genuine image load failure (expired signed URL, network drop) used to
  // fail completely silently — the <img> just never painted, leaving a bare
  // slide with no error icon and no indication anything went wrong, which
  // is indistinguishable from a paint/compositing glitch by looking at the
  // screen alone. Tracking failures here surfaces a visible, tappable retry
  // state instead, so a real failure is diagnosable rather than a silent
  // blank tile.
  const [failedTileKeys, setFailedTileKeys] = useState<Set<string>>(() => new Set());
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeSlide = activeIndex ?? internalActiveSlide;
  // Externally-controlled mode (the feed hero, driven by the card's own
  // pointer gesture) must NOT also let the browser natively touch-scroll
  // this strip. On real touch devices the two systems raced: a real
  // touchmove can start native momentum scrolling on this overflow-x-auto
  // container even though the ancestor sets touch-action: pan-y, and a fast
  // flick + scroll-snap can travel several slides before settling — the
  // card's own JS only ever advances one slide per gesture, but the native
  // scroll it was racing against could land anywhere, including the last
  // slide, and left the dot indicator (driven only by the controlled
  // activeIndex prop) never matching what was on screen. Making the strip
  // itself non-scrollable and non-hit-testable when controlled means the
  // ancestor's pointer handlers are the only thing that can ever move it —
  // deterministic one-slide-per-swipe paging, and dots that always agree
  // with what's showing. (The feed hero and the pact detail page both
  // render this component through the same FeedPactCard, which always
  // passes activeIndex — so in practice both are controlled; a true
  // native-scroll usage is only a fallback for a future caller that omits
  // activeIndex entirely.)
  const controlled = activeIndex !== undefined;

  const tiles: GalleryTile[] = useMemo(() => buildGalleryTiles(proofs, cheers), [proofs, cheers]);

  // Controlled mode (the feed hero / detail page, driven by the card's own
  // pointer gesture) positions the strip with the CSS `transform` rendered
  // below instead of `scrollTo`. `scrollTo({ behavior: 'smooth' })` only
  // ever started once the drag *committed* to a new index on release, with
  // no way to track the finger while the drag was still in progress — so the
  // strip sat frozen through the whole gesture and then played a separate,
  // slightly-delayed catch-up animation afterwards: a visible stutter
  // instead of one continuous Instagram-style motion. This effect is now
  // only relevant to a true native-scroll (uncontrolled) usage.
  React.useEffect(() => {
    if (controlled) return;
    if (activeIndex === undefined) return;
    const el = scrollerRef.current;
    if (!el) return;
    const slideWidth = el.clientWidth;
    if (slideWidth === 0) return;
    el.scrollTo({ left: activeIndex * slideWidth, behavior: 'smooth' });
  }, [activeIndex, controlled]);

  if (tiles.length === 0) return null;

  const handleTileClick = (index: number) => {
    if (!interactive) return;
    setSelectedIndex(index);
    setCarouselOpen(true);
  };

  const handleScroll = () => {
    if (activeIndex !== undefined) return;
    const el = scrollerRef.current;
    if (!el) return;
    const slideWidth = el.clientWidth;
    if (slideWidth === 0) return;
    const next = Math.round(el.scrollLeft / slideWidth);
    setInternalActiveSlide(next);
    onActiveIndexChange?.(next);
  };

  // Instagram-style positioning for controlled mode: a plain CSS transform
  // that includes the live drag offset, so the strip visually tracks the
  // finger 1:1 on every pointermove instead of only jumping once the drag
  // commits. `transition: none` while dragging keeps that tracking instant;
  // it switches back to an eased transition the moment the drag ends,
  // which is what animates the smooth settle into the next/previous slide.
  const controlledTransform = controlled
    ? {
        transform: `translateX(calc(${-activeSlide * 100}% + ${dragOffsetPx}px))`,
        transition: isDragging ? 'none' : 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)',
        // Without this hint the browser has no reason to promote this row to
        // its own compositor layer up front — it only does so reactively,
        // the first time something (scroll, resize, another paint) forces a
        // fresh composite. Confirmed-loadable images can still end up as a
        // visually blank slide 2/3 until that trigger fires, which matches
        // exactly what was reported on an Android TWA (no broken-image icon,
        // no network error — a paint that never happened), and is a known
        // rougher edge on embedded WebView/TWA Chromium builds than on
        // desktop Chrome. will-change forces the layer to exist from the
        // first render instead of waiting for a reactive trigger that may
        // not come until the user does something else.
        willChange: 'transform',
      }
    : undefined;

  const Tile = interactive ? 'button' : 'div';

  return (
    <>
      <div className={`relative ${fillHeight ? 'h-full' : ''}`}>
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className={`flex scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            controlled ? 'touch-none overflow-hidden pointer-events-none' : 'snap-x snap-mandatory overflow-x-auto'
          } ${fillHeight ? 'h-full' : ''}`}
          style={controlledTransform}
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
                    // In controlled mode the strip is positioned via a CSS
                    // transform, not scrolling, so off-screen slides never get
                    // a scroll/intersection signal to trigger native lazy
                    // loading. Load eagerly (the tile count is capped) so
                    // slides 2/3 actually fetch instead of staying blank.
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
                  redundant. More importantly, this used to be pinned to
                  `bottom-0` of the tile, directly underneath FeedPactCard's
                  own title/circle-name overlay (also `absolute ...
                  bottom-0`, in the same hero stacking context) — two
                  independently-sized absolute blocks anchored to the same
                  edge collide by construction regardless of either one's
                  text length. Anchoring this to the top instead, under the
                  kind badge, removes the shared edge entirely rather than
                  trying to reserve enough space for two variable-height
                  blocks at the same spot. */}
              {tile.kind === 'cheer' && tile.uploader && (
                <div className="absolute left-2.5 top-10 max-w-[calc(100%-1.25rem)] truncate rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                  from @{tile.uploader}
                </div>
              )}
            </Tile>
          ))}
        </div>

        {tiles.length > 1 && dotsPosition !== 'none' && (
          <div
            className={
              dotsPosition === 'overlay'
                ? 'pointer-events-none absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-1.5'
                : 'mt-2 flex items-center justify-center gap-1.5'
            }
          >
            {tiles.map((tile, index) => (
              <span
                key={`dot-${tile.kind}-${tile.id}`}
                className={`h-1.5 rounded-full transition-all ${
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
