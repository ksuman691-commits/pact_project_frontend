'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

interface PremiumJoinButtonProps {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  loadingLabel?: string;
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
          style={{ background: 'radial-gradient(circle, rgba(255,79,135,0.55), rgba(139,107,255,0.45) 55%, transparent 75%)' }}
        />
      )}
      <motion.button
        type={type}
        onClick={onClick}
        disabled={isDisabled}
        whileTap={isDisabled ? undefined : { scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className={`relative z-10 inline-flex items-center justify-center rounded-full font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${fullWidth ? 'w-full' : ''}`}
        style={{
          padding: s.padding,
          gap: s.gap,
          fontSize: s.text,
          fontFamily: 'var(--font-pact-display), sans-serif',
          background: 'linear-gradient(135deg, var(--pact-pink), var(--pact-violet))',
          boxShadow: isDisabled ? 'none' : '0 8px 20px rgba(139,107,255,0.35)',
        }}
      >
        <span
          className="flex flex-shrink-0 items-center justify-center rounded-full bg-white/90"
          style={{ width: s.badge, height: s.badge }}
        >
          <Plus className="text-[var(--pact-violet)]" style={{ width: s.badge * 0.6, height: s.badge * 0.6 }} strokeWidth={3} />
        </span>
        {loading ? loadingLabel : label}
      </motion.button>
    </span>
  );
}
