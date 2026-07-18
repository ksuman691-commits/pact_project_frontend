import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Brand Color (Emerald)
        emerald: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a', // Primary action color
          700: '#15803d',
          800: '#166534',
          900: '#145231',
        },
        // Semantic Colors
        red: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626', // Doubt/Warning
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Neutral Scale
        slate: {
          50: '#f8fafc', // Page background
          100: '#f1f5f9',
          200: '#e2e8f0', // Borders
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b', // Text tertiary
          600: '#475569', // Text secondary
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617', // Text primary
        },
      },
      fontSize: {
        // Display
        'display': ['2.25rem', { lineHeight: '1.1', fontWeight: '900', letterSpacing: '-0.02em' }], // 36px
        // Headlines
        'h1': ['1.875rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.01em' }], // 30px
        'h2': ['1.5rem', { lineHeight: '1.3', fontWeight: '700', letterSpacing: '-0.01em' }], // 24px
        'h3': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }], // 18px
        // Body
        'body-lg': ['1rem', { lineHeight: '1.5', fontWeight: '400' }], // 16px
        'body-md': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }], // 14px
        'body-sm': ['0.8125rem', { lineHeight: '1.4', fontWeight: '400' }], // 13px
        'body-xs': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }], // 12px
        // Caption & Overline
        'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }], // 12px
        'overline': ['0.625rem', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '0.12em' }], // 10px
      },
      borderRadius: {
        'sm': '0.5rem', // 8px - form inputs, secondary elements
        'md': '1rem', // 16px - cards, modals (PRIMARY)
        'lg': '1.5rem', // 24px - large hero elements, pill buttons
      },
      boxShadow: {
        // Elevation system
        'elevation-sm': '0 1px 2px rgba(15, 23, 42, 0.05)',
        'elevation-md': '0 4px 12px rgba(15, 23, 42, 0.08)',
        'elevation-lg': '0 12px 24px rgba(15, 23, 42, 0.12)',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '250ms',
        'slow': '350ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-in',
        'slide-up': 'slideUp 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        'pulse-subtle': 'pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        slideUp: {
          'from': { opacity: '0', transform: 'translateY(8px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
export default config
