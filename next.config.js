/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: '.',
  },
}

module.exports = nextConfig
