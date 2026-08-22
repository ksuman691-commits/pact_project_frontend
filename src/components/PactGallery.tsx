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

interface GalleryTile {
  id: number;
  url: string;
  type: 'image' | 'video';
  description?: string;
  uploadedAt?: string;
  uploader?: string;
  day?: number;
  kind: 'proof' | 'cheer';
}

interface PactGalleryProps {
  proofs: Proof[];
  cheers: CheerItem[];
}

/**
 * Unified Instagram-style photo strip combining proof submissions and cheers
 * into one horizontally swipeable carousel, sorted most-recent-first. Lives
 * directly in the pact card body — no header/label, no grid framing — so it
 * reads as part of the post rather than a separate "Gallery" section.
 */
export default function PactGallery({ proofs, cheers }: PactGalleryProps) {
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const activeCheers = useMemo(
    () => cheers.filter((cheer) => !cheer.expires_at || new Date(cheer.expires_at).getTime() > Date.now()),
    [cheers],
  );

  const tiles: GalleryTile[] = useMemo(() => {
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
  }, [proofs, activeCheers]);

  if (tiles.length === 0) return null;

  const handleTileClick = (index: number) => {
    setSelectedIndex(index);
    setCarouselOpen(true);
  };

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const slideWidth = el.clientWidth;
    if (slideWidth === 0) return;
    setActiveSlide(Math.round(el.scrollLeft / slideWidth));
  };

  return (
    <>
      <div className="relative">
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {tiles.map((tile, index) => (
            <button
              key={`${tile.kind}-${tile.id}`}
              type="button"
              onClick={() => handleTileClick(index)}
              aria-label={`${tile.kind === 'cheer' ? 'Cheer' : tile.type === 'video' ? 'Video proof' : 'Photo proof'}${tile.day ? `, day ${tile.day}` : ''}`}
              className="group relative aspect-square w-full flex-shrink-0 snap-center overflow-hidden rounded-2xl bg-white/5 text-left focus:outline-none"
            >
              {tile.type === 'image' ? (
                <Image
                  src={tile.url}
                  alt={tile.description || (tile.kind === 'cheer' ? `Cheer from ${tile.uploader || 'a member'}` : 'Proof')}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 480px"
                />
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

              {tile.uploader && (
                <div className="absolute inset-x-0 bottom-0 flex items-end bg-gradient-to-t from-black/70 to-transparent px-2.5 pb-2 pt-8 text-xs font-semibold text-white">
                  <span className="truncate">@{tile.uploader}</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {tiles.length > 1 && (
          <div className="mt-2 flex items-center justify-center gap-1.5">
            {tiles.map((tile, index) => (
              <span
                key={`dot-${tile.kind}-${tile.id}`}
                className={`h-1.5 rounded-full transition-all ${
                  index === activeSlide ? 'w-4 bg-[var(--pact-violet)]' : 'w-1.5 bg-white/25'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <ProofCarousel proofs={tiles} isOpen={carouselOpen} onClose={() => setCarouselOpen(false)} initialIndex={selectedIndex} />
    </>
  );
}
