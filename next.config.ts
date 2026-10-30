import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { validateEnvironment } from './src/config/env-schema';

validateEnvironment(process.env);

const nextConfig: NextConfig = {
  distDir: process.env.PLAYWRIGHT_DEV === '1' ? '.next-e2e-dev' : '.next',
  poweredByHeader: false,
  reactStrictMode: true,
  devIndicators: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default createNextIntlPlugin('./src/i18n/request.ts')(nextConfig);
