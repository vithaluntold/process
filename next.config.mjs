/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Use standalone output for smaller deployments
  output: 'standalone',
  // Disable source maps in production to save memory
  productionBrowserSourceMaps: false,
  experimental: {
    // Optimize memory usage during build
    webpackMemoryOptimizations: true,
  },
  // Reduce bundle size
  compiler: {
    removeConsole: {
      exclude: ['error', 'warn'],
    },
  },
  // Reduce memory usage by limiting concurrent builds
  webpack: (config, { isServer }) => {
    // Disable source maps to reduce memory
    config.devtool = false;
    
    // Temporarily disable minification to reduce memory usage
    config.optimization = {
      ...config.optimization,
      minimize: false, // Disabled to save memory during build
      moduleIds: 'deterministic',
    };
    
    // Reduce memory usage - sequential processing
    config.parallelism = 1;
    
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
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
}

export default nextConfig
