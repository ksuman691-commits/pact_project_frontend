'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Volume2, VolumeX } from 'lucide-react';

interface ProofMedia {
  id: number | string;
  url: string;
  type: 'image' | 'video';
  description?: string;
  uploadedAt?: string;
  uploader?: string;
  day?: number;
}

interface ProofMediaCarouselProps {
  proofs: ProofMedia[];
  fallbackLabel?: string;
  fallbackAvatarUrl?: string | null;
  className?: string;
  showProgress?: boolean;
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
}

export default function ProofMediaCarousel({
  proofs,
  fallbackLabel = 'Proof',
  fallbackAvatarUrl = null,
  className = '',
  showProgress = true,
  initialIndex = 0,
  onIndexChange,
}: ProofMediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setImageLoaded(false);
    setIsMuted(true);
  }, [initialIndex, proofs]);

  useEffect(() => {
    onIndexChange?.(currentIndex);
  }, [currentIndex, onIndexChange]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsInView(Boolean(entry?.isIntersecting));
      },
      { threshold: 0.7 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isInView && proofs[currentIndex]?.type === 'video') {
      video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [isInView, currentIndex, proofs]);

  const currentProof = proofs[currentIndex];
  const canNavigate = proofs.length > 1;

  const goToPrevious = () => {
    if (!canNavigate) return;
    setCurrentIndex((prev) => (prev === 0 ? proofs.length - 1 : prev - 1));
  };

  const goToNext = () => {
    if (!canNavigate) return;
    setCurrentIndex((prev) => (prev === proofs.length - 1 ? 0 : prev + 1));
  };

  const renderMedia = () => {
    if (!currentProof) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.28),transparent_35%),linear-gradient(180deg,#0f172a_0%,#020617_100%)]">
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
            {fallbackAvatarUrl ? (
              <div className="absolute inset-0 scale-110 opacity-25 blur-[1px]">
                <Image src={fallbackAvatarUrl} alt={fallbackLabel} fill sizes="100vw" className="object-cover" />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[120px] font-black text-white/10">
                {fallbackLabel.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="relative z-10 flex flex-col items-center gap-4 px-8 text-center">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10 shadow-2xl shadow-black/20 backdrop-blur-sm">
                {fallbackAvatarUrl ? (
                  <Image src={fallbackAvatarUrl} alt={fallbackLabel} fill sizes="112px" className="object-cover opacity-90" />
                ) : (
                  <span className="text-5xl font-black text-white/80">{fallbackLabel.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <p className="max-w-[240px] text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
                no proof uploaded yet — be the first
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (currentProof.type === 'video') {
      return (
        <div className="relative h-full w-full bg-slate-950">
          <video
            ref={videoRef}
            src={currentProof.url}
            className="h-full w-full object-cover"
            muted={isMuted}
            loop
            playsInline
            preload="metadata"
          />
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsMuted((prev) => !prev);
            }}
            className="absolute bottom-4 right-4 z-10 rounded-full border border-white/20 bg-black/35 p-2.5 text-white shadow-lg backdrop-blur-sm"
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      );
    }

    return (
      <div className="relative h-full w-full bg-[#FAF9FE]">
        <Image
          src={currentProof.url}
          alt={currentProof.description || fallbackLabel}
          fill
          priority={false}
          sizes="(max-width: 768px) 100vw, 640px"
          className={`object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoadingComplete={() => setImageLoaded(true)}
        />
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`relative h-full w-full overflow-hidden ${className}`.trim()}>
      {renderMedia()}

      {canNavigate && showProgress && (
        <div className="absolute left-4 right-4 top-4 z-10 flex items-center gap-1">
          {proofs.map((proof, index) => (
            <div
              key={proof.id}
              className={`h-1 flex-1 rounded-full transition-all ${index <= currentIndex ? 'bg-white' : 'bg-white/25'}`}
            />
          ))}
        </div>
      )}

      {canNavigate && (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              goToPrevious();
            }}
            className="absolute left-0 top-0 z-10 h-full w-[30%]"
            aria-label="Previous proof"
          />
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              goToNext();
            }}
            className="absolute right-0 top-0 z-10 h-full w-[30%]"
            aria-label="Next proof"
          />
        </>
      )}
    </div>
  );
}
