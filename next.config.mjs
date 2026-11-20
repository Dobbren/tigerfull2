/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ['image/webp'],
    qualities: [75, 80],
    minimumCacheTTL: 31536000,
  },
}

export default nextConfig
