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
        // "Classic" redesign tokens — see src/styles/globals.css :root for the
        // exact hex values. Referenced via CSS vars so the whole app can use
        // Tailwind utilities (bg-paper, text-ink, border-hairline, etc.)
        // instead of stray hex literals.
        paper: 'var(--paper)',
        card: 'var(--card)',
        'card-muted': 'var(--card-muted)',
        ink: 'var(--ink)',
        'ink-soft': 'var(--ink-soft)',
        muted: 'var(--muted)',
        navy: 'var(--navy)',
        'navy-hover': 'var(--navy-hover)',
        hairline: 'var(--hairline)',
        'hairline-soft': 'var(--hairline-soft)',
        'seat-border': 'var(--seat-border)',
        dash: 'var(--dash)',
        'witness-empty': 'var(--witness-empty)',
        tan: 'var(--tan)',
        'warn-bg': 'var(--warn-bg)',
        'warn-text': 'var(--warn-text)',
        'missed-border': 'var(--missed-border)',
        'missed-stripe': 'var(--missed-stripe)',
      },
      fontFamily: {
        sans: ['var(--font-pact-display)', "'Helvetica Neue'", 'sans-serif'],
        serif: ['var(--font-pact-display)', 'Arial', 'sans-serif'],
        mono: ['var(--font-pact-display)', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        card: '6px',
        thumb: '3px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
export default config
