'use client';

import React, { useState } from 'react';
import NextImage from 'next/image';
import { AlertCircle } from 'lucide-react';

interface ImageProps {
  src: string;
  alt: string;
  onError?: () => void;
  showSkeleton?: boolean;
  className?: string;
  width?: number;
  height?: number;
}

export default function Image({
  src,
  alt,
  onError,
  showSkeleton = true,
  className = '',
  width = 400,
  height = 300,
}: ImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    if (onError) {
      onError();
    }
  };

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  if (hasError) {
    return (
      <div className={`bg-slate-100 flex items-center justify-center rounded-md ${className}`} style={{ aspectRatio: `${width}/${height}` }}>
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <AlertCircle className="w-8 h-8" />
          <span className="text-xs font-medium">Image unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ aspectRatio: `${width}/${height}` }}>
      {isLoading && showSkeleton && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse rounded-md" />
      )}
      
      <NextImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`w-full h-full object-cover rounded-md transition-opacity ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onError={handleError}
        onLoadingComplete={handleLoadingComplete}
      />
    </div>
  );
}
