// Security headers (security audit M2). The Content-Security-Policy is enforced: a
// script, connection or frame from anywhere not listed is blocked. Browsers report
// what they block to the API (/api/csp-report), which logs one line per report.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pact-project-backend-v2.onrender.com';
const csp = [
  "default-src 'self'",
  // Next.js inline bootstraps; MediaPipe face effects run WebAssembly ('wasm-unsafe-eval'
  // allows compiling it, not JavaScript eval); Google sign-in.
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://accounts.google.com/gsi/client",
  "style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${API_URL} https://*.amazonaws.com https://*.cloudfront.net https://accounts.google.com`,
  'frame-src https://accounts.google.com',
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  `report-uri ${API_URL}/api/csp-report`,
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
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
