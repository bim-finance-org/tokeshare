import type { NextConfig } from 'next';

// Non-breaking security headers. CSP is limited to `frame-ancestors` (anti-
// clickjacking) rather than a full resource policy, which would need careful
// allowlisting of the wallet/RPC endpoints before it could be enabled safely.
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
];

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
    qualities: [75, 90],
    formats: ['image/avif', 'image/webp'],
    // All image sources are static, immutable assets in /public — cache the
    // optimized variants aggressively so they aren't re-transcoded every 60s.
    minimumCacheTTL: 2592000, // 30 days
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
