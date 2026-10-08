'use client';

import React from 'react';

interface ChipProps {
  selected?: boolean;
  dashed?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

/** Text-only pill used for every choice in the create-pact screens. */
export default function Chip({ selected = false, dashed = false, onClick, children, className = '', ariaLabel }: ChipProps) {
  const look = selected
    ? 'bg-[var(--navy)] text-white'
    : dashed
      ? 'border-[1.5px] border-dashed border-[var(--hairline)] bg-transparent text-[var(--ink)]'
      : 'border border-[var(--hairline)] bg-[var(--card)] text-[var(--ink)]';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={ariaLabel}
      className={`flex min-h-10 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-bold transition-transform active:scale-[0.97] ${look} ${className}`}
    >
      {children}
    </button>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-2.5 text-[13px] font-bold text-[var(--muted)]">{children}</div>;
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[var(--navy)] text-base font-extrabold text-white disabled:opacity-40"
    >
      {children}
    </button>
  );
}
