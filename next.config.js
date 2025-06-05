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
};

module.exports = nextConfig;
