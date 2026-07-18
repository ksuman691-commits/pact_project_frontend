'use client';

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface TopHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightContent?: React.ReactNode;
  backHref?: string;
}

export default function TopHeader({
  title,
  showBack = false,
  onBack,
  rightContent,
  backHref,
}: TopHeaderProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      // Navigation handled by Link component
    } else {
      window.history.back();
    }
  };

  const backButton = (
    <button
      onClick={handleBack}
      className="p-2 hover:bg-slate-100 rounded-lg transition-colors focus-ring"
      aria-label="Go back"
    >
      <ChevronLeft className="w-5 h-5 text-slate-600" />
    </button>
  );

  return (
    <header className="sticky top-0 z-fixed bg-white/80 backdrop-blur-sm border-b border-white/70 hidden md:block">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Left slot: back button or empty */}
        <div className="w-10">
          {showBack ? (
            backHref ? (
              <Link href={backHref} className="p-2 hover:bg-slate-100 rounded-lg transition-colors focus-ring inline-block">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </Link>
            ) : (
              backButton
            )
          ) : null}
        </div>

        {/* Center slot: title */}
        {title && (
          <h1 className="text-h2 font-bold text-slate-950 text-center flex-1">
            {title}
          </h1>
        )}

        {/* Right slot: notifications, avatar, etc */}
        <div className="w-10 flex items-center justify-end">
          {rightContent}
        </div>
      </div>
    </header>
  );
}
