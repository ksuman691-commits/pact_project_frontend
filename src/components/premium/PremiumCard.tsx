import React from 'react';

interface PremiumCardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

export default function PremiumCard({
  children,
  className = '',
  glass = false,
  clickable = false,
  onClick,
}: PremiumCardProps) {
  const baseClasses = 'rounded-2xl p-4 transition-all';
  const glassClasses = glass
    ? 'bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg hover:shadow-xl'
    : 'bg-white border border-slate-100 shadow-sm hover:shadow-md';
  const interactiveClasses = clickable ? 'cursor-pointer hover:scale-105' : '';

  return (
    <div
      className={`${baseClasses} ${glassClasses} ${interactiveClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
