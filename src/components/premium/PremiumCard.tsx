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
  const baseClasses = 'rounded-[24px] p-4 transition-all';
  const glassClasses = glass
    ? 'bg-[var(--card)] backdrop-blur-xl border border-[var(--hairline)] shadow-lg hover:shadow-xl'
    : 'bg-[var(--card)] border border-[var(--hairline)] shadow-[0_4px_12px_rgba(94,84,142,0.08)] hover:shadow-md';
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
