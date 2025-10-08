/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 临时跳过构建时 ESLint，避免版本不兼容导致的 Invalid Options 报错
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

// Apply Sentry plugin (wrapper handles absence gracefully)
import { wrapWithSentry } from './sentry.next.config.js'
export default wrapWithSentry(nextConfig);
