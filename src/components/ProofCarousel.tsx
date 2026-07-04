'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, Play } from 'lucide-react';

interface Proof {
  id: number;
  url: string;
  type: 'image' | 'video';
  description?: string;
  uploadedAt?: string;
  uploader?: string;
  day?: number;
}

interface ProofCarouselProps {
  proofs: Proof[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

export default function ProofCarousel({
  proofs,
  isOpen,
  onClose,
  initialIndex = 0,
}: ProofCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!isOpen || proofs.length === 0) return null;

  const currentProof = proofs[currentIndex];
  const totalProofs = proofs.length;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalProofs - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === totalProofs - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Main Content */}
      <div
        className="relative w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image/Video Display */}
        <div className="w-full h-full max-w-4xl max-h-full flex items-center justify-center bg-black relative">
          {currentProof.type === 'image' ? (
            <div className="relative w-full h-full">
              <Image
                src={currentProof.url}
                alt={currentProof.description || 'Proof'}
                fill
                className="object-contain"
                priority
              />
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                src={currentProof.url}
                controls
                className="w-full h-full object-contain"
                autoPlay
              />
            </div>
          )}

          {/* Play Icon for Video Preview */}
          {currentProof.type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white/10 backdrop-blur-sm rounded-full p-4">
                <Play className="w-8 h-8 text-white fill-white" />
              </div>
            </div>
          )}
        </div>

        {/* Left Arrow */}
        {totalProofs > 1 && (
          <button
            onClick={goToPrevious}
            className="absolute left-4 z-10 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition backdrop-blur-sm"
            aria-label="Previous proof"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Right Arrow */}
        {totalProofs > 1 && (
          <button
            onClick={goToNext}
            className="absolute right-4 z-10 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition backdrop-blur-sm"
            aria-label="Next proof"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition backdrop-blur-sm"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Info Section */}
        {(currentProof.description || currentProof.uploader) && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6 text-white z-10">
            {currentProof.day && (
              <p className="text-sm text-gray-300 mb-2">Day {currentProof.day}</p>
            )}
            {currentProof.description && (
              <p className="text-base font-medium mb-2">{currentProof.description}</p>
            )}
            {currentProof.uploader && (
              <p className="text-sm text-gray-300">by {currentProof.uploader}</p>
            )}
            {currentProof.uploadedAt && (
              <p className="text-xs text-gray-400 mt-1">
                {new Date(currentProof.uploadedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Counter */}
        {totalProofs > 1 && (
          <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
            {currentIndex + 1} / {totalProofs}
          </div>
        )}

        {/* Thumbnail Strip */}
        {totalProofs > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10 bg-black/50 backdrop-blur-sm p-2 rounded-lg">
            {proofs.map((proof, index) => (
              <button
                key={proof.id}
                onClick={() => setCurrentIndex(index)}
                className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition ${
                  index === currentIndex
                    ? 'border-white'
                    : 'border-transparent hover:border-gray-500'
                }`}
              >
                {proof.type === 'image' ? (
                  <Image
                    src={proof.url}
                    alt={`Proof ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <Play className="w-4 h-4 text-white fill-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
