/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable server-side rendering for Convex API routes
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Configure webpack to handle Node.js built-ins
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on Node.js built-ins
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        stream: require.resolve('stream-browserify'),
        zlib: require.resolve('browserify-zlib'),
        net: false,
        tls: false,
        dns: false,
        child_process: false,
      };
    }
    return config;
  },
  // Add production domain configuration
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  // Redirect configuration for production domain
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/dashboard/repositories',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
