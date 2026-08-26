/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.cloudfront.net' },
      { protocol: 'https', hostname: 'pact-project-backend-v2.onrender.com' },
      { protocol: 'https', hostname: 'picsum.photos' }, // TEMP debug — remove after gallery investigation
    ],
  },
}

module.exports = nextConfig
