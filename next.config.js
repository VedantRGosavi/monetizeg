/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Configure webpack to handle Node.js built-ins
  webpack: (config, { isServer, webpack }) => {
    // Fixes npm packages that depend on Node.js built-ins
    if (!isServer) {
      // Simple approach to handle Natural.js webworker-threads warning
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // Core Node.js modules needed for the app
        fs: false,
        stream: require.resolve('stream-browserify'),
        zlib: require.resolve('browserify-zlib'),
        
        // Natural.js specific issue - mark as false to prevent warning
        'webworker-threads': false,
      };
      
      // Mark the specific problematic module as ignored
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^webworker-threads$/,
          contextRegExp: /natural/,
        })
      );
    }
    return config;
  },
  // Add comprehensive security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Basic security headers with improved values
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
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
            value: 'strict-origin-when-cross-origin',
          },
          // Modern security headers
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self';",
              // Scripts: Allow Clerk, Stripe, and inline scripts for Next.js
              "script-src 'self' https://*.clerk.accounts.dev https://cdn.jsdelivr.net https://*.stripe.com 'unsafe-inline' 'unsafe-eval';",
              // Styles: Allow Google Fonts and inline styles for Next.js components
              "style-src 'self' https://fonts.googleapis.com 'unsafe-inline';",
              // Fonts: Allow Google Fonts
              "font-src 'self' https://fonts.gstatic.com data:;",
              // Images: Allow Clerk, data URIs, and blobs for avatars
              "img-src 'self' https://*.clerk.accounts.dev https://img.clerk.com https://*.stripe.com data: blob:;",
              // Connect: Allow Clerk and Stripe APIs
              "connect-src 'self' https://*.clerk.accounts.dev https://api.stripe.com https://*.vercel.app;",
              // Frames: Allow Clerk and Stripe secure iframes
              "frame-src 'self' https://*.clerk.accounts.dev https://*.stripe.com;",
              // Media: Restrict
              "media-src 'self';",
              // Objects: Disallow
              "object-src 'none';",
              // Manifests: Allow self
              "manifest-src 'self';",
              // Base URI: Restrict to self
              "base-uri 'self';",
              // Form actions: Restrict to self
              "form-action 'self';",
              // Frame ancestors: Prevent embedding
              "frame-ancestors 'none';",
            ].join(' '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
