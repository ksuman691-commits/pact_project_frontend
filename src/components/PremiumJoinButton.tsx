'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Check } from 'lucide-react';

interface PremiumJoinButtonProps {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  loadingLabel?: string;
  /**
   * Swaps the inset "+" badge for a checkmark — used for the disabled
   * "Joined" resting state so it reads as a confirmed status pill rather
   * than a still-clickable "add" action, without needing a whole separate
   * component just for that state.
   */
  joined?: boolean;
  /** Compact size for inline use on cards; 'md' for standalone CTAs (panels, empty states). */
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}

const SIZE_STYLES = {
  sm: { padding: '0.5rem 1.1rem 0.5rem 0.4rem', badge: 22, gap: '0.5rem', text: '0.875rem' },
  md: { padding: '0.75rem 1.5rem 0.75rem 0.5rem', badge: 28, gap: '0.65rem', text: '1rem' },
};

/**
 * The app's single premium "Join" CTA — a gradient pill with an inset "+"
 * badge and a soft breathing aura behind it, used everywhere a user can
 * join a pact or circle (feed cards, the swipe-right nudge, circle/pact
 * previews). Keep this as the one Join button in the app rather than
 * one-off styled buttons per screen.
 */
export default function PremiumJoinButton({
  onClick,
  disabled = false,
  loading = false,
  label = 'Join',
  loadingLabel = 'Joining...',
  size = 'sm',
  fullWidth = false,
  className = '',
  type = 'button',
  joined = false,
}: PremiumJoinButtonProps) {
  const s = SIZE_STYLES[size];
  const isDisabled = disabled || loading;

  return (
    <span className={`relative inline-flex ${fullWidth ? 'w-full' : ''} ${className}`}>
      {/* Soft pulsing aura glow behind the button — same breathing technique as
          the Avatar ring glow (avatar-ring-breathe), but on its own ~2.2s cycle
          so this button reads as its own signature motif rather than a copy. */}
      {!isDisabled && (
        <span
          aria-hidden="true"
          className="join-btn-breathe pointer-events-none absolute inset-0 rounded-full blur-lg"
          style={{ background: 'radial-gradient(circle, rgba(24,119,242,0.55), rgba(24,119,242,0.45) 55%, transparent 75%)' }}
        />
      )}
      <motion.button
        type={type}
        onClick={onClick}
        disabled={isDisabled}
        whileTap={isDisabled ? undefined : { scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className={`relative z-10 inline-flex items-center justify-center overflow-hidden rounded-full font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${fullWidth ? 'w-full' : ''}`}
        style={{
          padding: s.padding,
          gap: s.gap,
          fontSize: s.text,
          fontFamily: 'var(--font-pact-display), sans-serif',
          background: joined ? 'var(--pact-surface-3)' : 'var(--pact-pink)',
          boxShadow: isDisabled ? 'none' : '0 8px 20px rgba(24,119,242,0.35)',
        }}
      >
        {/* Diagonal light sweep looping across the pill — the "bling" motif
            layered on top of the breathing aura outside this button. */}
        {!isDisabled && (
          <span
            aria-hidden="true"
            className="join-btn-shine pointer-events-none absolute inset-y-0 left-0 w-1/3"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)' }}
          />
        )}
        <span
          className="relative flex flex-shrink-0 items-center justify-center rounded-full bg-white/90"
          style={{ width: s.badge, height: s.badge }}
        >
          {joined ? (
            <Check className="text-[var(--pact-surface-3)]" style={{ width: s.badge * 0.6, height: s.badge * 0.6 }} strokeWidth={3} />
          ) : (
            <Plus className="text-[var(--pact-violet)]" style={{ width: s.badge * 0.6, height: s.badge * 0.6 }} strokeWidth={3} />
          )}
        </span>
        <span className="relative">{loading ? loadingLabel : label}</span>
      </motion.button>
    </span>
  );
}
