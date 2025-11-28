/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false, // Enable type checking in production
  },
  images: {
    unoptimized: false, // Enable image optimization in production
  },
  // Use standalone output for Railway deployment
  output: 'standalone',
  // Enable source maps in production for better debugging
  productionBrowserSourceMaps: false,
  // Enable eslint during build for production
  eslint: {
    ignoreDuringBuilds: false,
  },
  experimental: {
    // Enable memory optimizations but keep production features
    webpackMemoryOptimizations: true,
  },
  // Optimize webpack for production
  webpack: (config, { isServer, dev }) => {
    // Only apply memory constraints during development or if memory is limited
    if (dev || process.env.MEMORY_LIMIT === 'true') {
      config.optimization = {
        ...config.optimization,
        minimize: false,
        moduleIds: 'deterministic',
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
      config.parallelism = 1;
      config.cache = false;
    } else {
      // Production optimizations for better code splitting
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              maxSize: 244000, // 244KB chunks
            },
            charts: {
              test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
              name: 'charts',
              chunks: 'all',
              priority: 10,
            },
            common: {
              minChunks: 2,
              chunks: 'all',
              enforce: true,
              name: 'common',
            },
          },
        },
      };
    }
    
    return config;
  },
  allowedDevOrigins: [
    '*.pike.replit.dev',
    '*.replit.dev',
    'localhost',
    '127.0.0.1',
  ],
  async headers() {
    return [
      {
        source: '/:path*',
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
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;",
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
}

export default nextConfig
