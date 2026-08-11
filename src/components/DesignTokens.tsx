/**
 * Soft Neumorphic Design System - Reusable Component Classes
 * Use these components to maintain design consistency across the app
 */

export const DesignTokens = {
  // Colors
  colors: {
    bgBase: 'bg-[#F4F2FB]',
    bgCard: 'bg-white',
    bgCardAlt: 'bg-[#FAF9FE]',
    accentPrimary: 'bg-[#A78BFA]',
    accentPrimaryHover: 'hover:bg-[#9270F5]',
    accentPrimarySoft: 'bg-[#EDE9FE]',
    textPrimary: 'text-[#14121F]',
    textSecondary: 'text-[#6B7280]',
    textTertiary: 'text-[#9CA3AF]',
  },

  // Card Styles
  cards: {
    default: 'bg-white rounded-[28px] shadow-[0_8px_24px_rgba(94,84,142,0.08),0_2px_6px_rgba(94,84,142,0.04)] p-6',
    sm: 'bg-white rounded-[24px] shadow-[0_4px_12px_rgba(94,84,142,0.06)] p-4',
  },

  // Buttons
  buttons: {
    primary: 'px-6 py-3 bg-[#A78BFA] text-white rounded-full font-semibold hover:bg-[#9270F5] shadow-[0_4px_12px_rgba(167,139,250,0.3)] hover:shadow-[0_6px_16px_rgba(167,139,250,0.4)] active:scale-[0.98] transition-all',
    secondary: 'px-6 py-3 bg-[#FAF9FE] text-[#14121F] rounded-full font-semibold hover:bg-[#EDE9FE] border border-[rgba(20,18,31,0.06)] transition-all',
    ghost: 'px-4 py-2 text-[#6B7280] hover:bg-[#F4F2FB] rounded-full font-medium transition-all',
  },

  // Icon Buttons
  iconButtons: {
    default: 'w-12 h-12 rounded-full bg-white shadow-[0_4px_12px_rgba(94,84,142,0.08)] flex items-center justify-center text-[#6B7280] hover:shadow-[0_6px_16px_rgba(94,84,142,0.12)] transition-all',
    active: 'w-12 h-12 rounded-full bg-[#14121F] text-white shadow-[0_4px_12px_rgba(20,18,31,0.15)] flex items-center justify-center transition-all',
  },

  // Badges/Pills
  badges: {
    warning: 'bg-[#FDECC8] text-[#92622A] px-4 py-2 rounded-full text-xs font-semibold',
    info: 'bg-[#DBEAFE] text-[#1E40AF] px-4 py-2 rounded-full text-xs font-semibold',
    pink: 'bg-[#FBD5E8] text-[#9D2B6B] px-4 py-2 rounded-full text-xs font-semibold',
    success: 'bg-[#D9F2E3] text-[#1B7A46] px-4 py-2 rounded-full text-xs font-semibold',
  },

  // Inputs
  inputs: {
    default: 'w-full px-5 py-3 bg-[#FAF9FE] text-[#14121F] rounded-full font-medium placeholder:text-[#9CA3AF] border border-[rgba(20,18,31,0.06)] focus:outline-none focus:ring-2 focus:ring-[#A78BFA] focus:bg-white transition-all',
  },

  // Avatars
  avatars: {
    default: 'w-10 h-10 rounded-full ring-2 ring-white shadow-[0_2px_8px_rgba(94,84,142,0.1)]',
    lg: 'w-16 h-16 rounded-full ring-2 ring-white shadow-[0_2px_8px_rgba(94,84,142,0.1)]',
  },

  // Typography
  typography: {
    statNumber: 'text-4xl font-bold text-[#14121F]',
    statLabel: 'text-sm font-medium text-[#6B7280]',
    heading: 'font-semibold text-[#14121F]',
  },

  // Progress
  progress: {
    track: 'h-1.5 bg-[#EDE9FE] rounded-full overflow-hidden',
    fill: 'h-full bg-[#A78BFA] rounded-full transition-all',
  },
};

// Utility function to combine classes
export function cn(...classes: (string | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
