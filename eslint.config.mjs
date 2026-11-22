import nextVitals from 'eslint-config-next/core-web-vitals'

// Same rules as the old .eslintrc.json ("next/core-web-vitals"), in ESLint's
// flat-config format. `next lint` was removed in Next 16; run `pnpm lint`.
const config = [
  ...nextVitals,
  {
    // New in eslint-config-next 16: React Compiler checks from
    // eslint-plugin-react-hooks 7. They flag render-performance patterns
    // (setState in effects, reading refs during render), not security issues,
    // and ~150 existing spots trip them. Warnings until they're cleaned up,
    // then switch back to errors.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/use-memo': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
  { ignores: ['.next/**', 'out/**', 'build/**', 'node_modules/**', 'public/**', 'next-env.d.ts'] },
]

export default config
