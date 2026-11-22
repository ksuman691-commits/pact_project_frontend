// Security headers (security audit M2). The Content-Security-Policy starts in
// report-only mode: browsers log what it would block, nothing is blocked. Once the
// console stays quiet on a preview, rename the header to Content-Security-Policy.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pact-project-backend-v2.onrender.com';
const csp = [
  "default-src 'self'",
  // Next.js inline bootstraps; MediaPipe face effects need WebAssembly; Google sign-in.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://accounts.google.com/gsi/client",
  "style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${API_URL} https://*.amazonaws.com https://*.cloudfront.net https://accounts.google.com`,
  'frame-src https://accounts.google.com',
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy-Report-Only', value: csp },
  // Never let another site show CirclePact in a frame (clickjacking).
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Links to other sites don't carry our URLs (reset tokens, invite keys).
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Camera and microphone for moments; nothing else.
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(), payment=(), usb=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  reactStrictMode: true,
  // Baked into the app so an open copy can tell when a newer one is live (AppUpdater).
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA || 'dev',
  },
  // Local runs only: forward /api/* to a backend on this machine, as Vercel does in
  // production (vercel.json, which also adds the secret header). Never set on Vercel.
  async rewrites() {
    const target = process.env.LOCAL_API_PROXY_TARGET
    if (!target || process.env.VERCEL) return []
    return [{ source: '/api/:path((?!version$).*)', destination: `${target}/api/:path` }]
  },
  async redirects() {
    // People type these; the screens live under /auth.
    return [
      { source: '/login', destination: '/auth/login', permanent: false },
      { source: '/signin', destination: '/auth/login', permanent: false },
      { source: '/signup', destination: '/auth/register', permanent: false },
      { source: '/register', destination: '/auth/register', permanent: false },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.cloudfront.net' },
      // Profile pictures of people who sign in with Google.
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'pact-project-backend-v2.onrender.com' },
    ],
  },
}

module.exports = nextConfig
