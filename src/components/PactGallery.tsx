'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { Play, Image as ImageIcon, PartyPopper } from 'lucide-react';
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
  title?: string;
}

/**
 * Unified Instagram-style photo grid combining proof submissions and cheers
 * into one feed, sorted most-recent-first. Replaces the previous split
 * "Proofs" + "Cheers" blocks — a viewer shouldn't have to hunt through two
 * separate sections to see everything posted about a pact.
 */
export default function PactGallery({ proofs, cheers, title = 'Gallery' }: PactGalleryProps) {
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

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

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-white/60" />
          <h2 className="text-sm font-bold text-white">
            {title} ({tiles.length})
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {tiles.map((tile, index) => (
            <button
              key={`${tile.kind}-${tile.id}`}
              type="button"
              onClick={() => handleTileClick(index)}
              aria-label={`${tile.kind === 'cheer' ? 'Cheer' : tile.type === 'video' ? 'Video proof' : 'Photo proof'}${tile.day ? `, day ${tile.day}` : ''}`}
              className="group relative aspect-square overflow-hidden rounded-xl bg-white/5 text-left ring-1 ring-white/10 transition hover:ring-[var(--pact-violet)]/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pact-violet)]"
            >
              {tile.type === 'image' ? (
                <Image
                  src={tile.url}
                  alt={tile.description || (tile.kind === 'cheer' ? `Cheer from ${tile.uploader || 'a member'}` : 'Proof')}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 33vw, 160px"
                />
              ) : (
                <div className="relative h-full w-full bg-slate-900">
                  <video src={tile.url} className="h-full w-full object-cover" muted playsInline />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <Play className="h-8 w-8 fill-white text-white" />
                  </div>
                </div>
              )}

              <span
                className={`absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ${
                  tile.kind === 'cheer' ? '' : 'bg-[var(--pact-violet)]'
                }`}
                style={tile.kind === 'cheer' ? { background: 'var(--pact-gold)' } : undefined}
              >
                {tile.kind === 'cheer' && <PartyPopper className="h-2.5 w-2.5" />}
                {tile.kind === 'cheer' ? 'Cheer' : tile.day ? `Day ${tile.day}` : 'Proof'}
              </span>

              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/75 to-transparent px-2 pb-2 pt-6 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                <span className="truncate">{tile.uploader ? `@${tile.uploader}` : ''}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <ProofCarousel proofs={tiles} isOpen={carouselOpen} onClose={() => setCarouselOpen(false)} initialIndex={selectedIndex} />
    </>
  );
}
