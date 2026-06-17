import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['socket.io'],

  turbopack: {},

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
    ];
  },
};

export default nextConfig;
