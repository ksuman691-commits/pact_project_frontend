'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Play, Image as ImageIcon } from 'lucide-react';
import ProofCarousel from './ProofCarousel';

interface Proof {
  id: number;
  url: string;
  type: 'image' | 'video';
  description?: string;
  uploadedAt?: string;
  uploader?: string;
  day?: number;
}

interface ProofsSectionProps {
  proofs: Proof[];
  title?: string;
  variant?: 'grid' | 'immersive';
}

export default function ProofsSection({
  proofs,
  title = 'Daily Progress',
  variant = 'grid',
}: ProofsSectionProps) {
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (proofs.length === 0) return null;

  const handleProofClick = (index: number) => {
    setSelectedIndex(index);
    setCarouselOpen(true);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-slate-700" />
          <h2 className="font-bold text-slate-900">
            {title} ({proofs.length})
          </h2>
        </div>

        {variant === 'immersive' ? (
          <div className="space-y-5">
            {proofs.map((proof, index) => (
              <button
                key={proof.id}
                onClick={() => handleProofClick(index)}
                className="group w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white text-left shadow-sm transition hover:shadow-md"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-100">
                  {proof.type === 'image' ? (
                    <Image
                      src={proof.url}
                      alt={proof.description || 'Proof'}
                      fill
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      sizes="100vw"
                    />
                  ) : (
                    <div className="relative h-full w-full bg-slate-950">
                      <video src={proof.url} className="h-full w-full object-cover" muted playsInline />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                        <Play className="h-10 w-10 fill-white text-white" />
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-12 text-white">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                          {proof.day ? `Day ${proof.day}` : 'Proof update'}
                        </p>
                        {proof.description && (
                          <p className="mt-1 text-sm font-medium text-white">{proof.description}</p>
                        )}
                      </div>
                      <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
                        {proof.type === 'video' ? 'video' : 'photo'}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {proofs.map((proof, index) => (
              <button
                key={proof.id}
                onClick={() => handleProofClick(index)}
                className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer bg-slate-100"
              >
                {/* Media Display */}
                {proof.type === 'image' ? (
                  <Image
                    src={proof.url}
                    alt={proof.description || 'Proof'}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-900 flex items-center justify-center relative">
                    <video
                      src={proof.url}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition">
                      <Play className="w-8 h-8 text-white fill-white" />
                    </div>
                  </div>
                )}

                {/* Overlay Info */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 text-white text-xs">
                  {proof.day && (
                    <p className="font-medium">Day {proof.day}</p>
                  )}
                  {proof.description && (
                    <p className="text-gray-200 line-clamp-2">{proof.description}</p>
                  )}
                </div>

                {/* Day Badge */}
                {proof.day && (
                  <div className="absolute top-2 left-2 bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Day {proof.day}
                  </div>
                )}

                {/* Type Badge */}
                <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                  {proof.type === 'video' ? '🎥 Video' : '📷 Photo'}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Timeline View (Alternative) */}
        {variant !== 'immersive' && proofs.length > 6 && (
          <div className="mt-6">
            <p className="text-sm font-medium text-slate-700 mb-3">Timeline</p>
            <div className="space-y-2">
              {proofs.map((proof, index) => (
                <button
                  key={proof.id}
                  onClick={() => handleProofClick(index)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition group"
                >
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                    {proof.type === 'image' ? (
                      <Image
                        src={proof.url}
                        alt={proof.description || 'Proof'}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white fill-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-slate-900">
                      {proof.day ? `Day ${proof.day}` : 'Update'}
                    </p>
                    {proof.description && (
                      <p className="text-xs text-slate-600 line-clamp-1">
                        {proof.description}
                      </p>
                    )}
                    {proof.uploadedAt && (
                      <p className="text-xs text-slate-500">
                        {new Date(proof.uploadedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 flex-shrink-0">
                    {proof.type === 'video' ? '🎥' : '📷'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Carousel Modal */}
      <ProofCarousel
        proofs={proofs}
        isOpen={carouselOpen}
        onClose={() => setCarouselOpen(false)}
        initialIndex={selectedIndex}
      />
    </>
  );
}
