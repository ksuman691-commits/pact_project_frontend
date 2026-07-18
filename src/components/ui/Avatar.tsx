'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  initials?: string;
  label?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'user' | 'circle';
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-xl',
};

const gradients = [
  'from-emerald-400 to-emerald-600',
  'from-blue-400 to-blue-600',
  'from-purple-400 to-purple-600',
  'from-orange-400 to-orange-600',
  'from-pink-400 to-pink-600',
  'from-cyan-400 to-cyan-600',
];

function getGradient(str: string): string {
  if (!str) return gradients[0];
  const index = str.charCodeAt(0) % gradients.length;
  return gradients[index];
}

export default function Avatar({
  src,
  initials = '?',
  label = 'Avatar',
  size = 'md',
  variant = 'user',
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const sizeClass = sizeClasses[size];
  const shouldShowImage = src && !imageError;
  const gradient = getGradient(initials);

  // For circles, show emoji icon if no image
  if (variant === 'circle' && !shouldShowImage) {
    return (
      <div
        className={`${sizeClass} rounded-full flex items-center justify-center bg-slate-200 flex-shrink-0`}
        role="img"
        aria-label={label}
      >
        <span className="text-center">{initials}</span>
      </div>
    );
  }

  // For users, show initials on gradient background
  if (!shouldShowImage) {
    return (
      <div
        className={`${sizeClass} rounded-full flex items-center justify-center bg-gradient-to-br ${gradient} text-white font-bold flex-shrink-0`}
        role="img"
        aria-label={label}
      >
        {initials}
      </div>
    );
  }

  // Show actual image
  return (
    <div className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0 bg-slate-200`}>
      <Image
        src={src}
        alt={label}
        width={size === 'xs' ? 24 : size === 'sm' ? 32 : size === 'md' ? 48 : 64}
        height={size === 'xs' ? 24 : size === 'sm' ? 32 : size === 'md' ? 48 : 64}
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
      />
    </div>
  );
}
