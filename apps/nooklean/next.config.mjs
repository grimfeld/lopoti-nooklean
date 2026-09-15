/**
 * Nooklean — public site.
 *
 * Like the Lopoti app: no secrets, no database access, everything through the
 * admin API.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,

  // See the matching comment in apps/lopoti: pins the workspace root so build
  // traces are correct rather than inferred from an unrelated lockfile.
  outputFileTracingRoot: new URL('../..', import.meta.url).pathname,

  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },

  // See apps/lopoti: `@lopoti-nooklean/db` is transpiled for its `/schema`
  // subpath only, which carries no database access.
  transpilePackages: ['@lopoti-nooklean/ui', '@lopoti-nooklean/db'],

  images: {
    formats: ['image/avif', 'image/webp'],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
      {
        source: '/devis/:token',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

export default nextConfig;
