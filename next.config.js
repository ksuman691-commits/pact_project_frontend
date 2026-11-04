/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
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
