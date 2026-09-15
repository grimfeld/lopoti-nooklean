/**
 * Lopoti — public site.
 *
 * This app holds NO secrets and never talks to the database. It reads and writes
 * through the admin API, whose origin is the one piece of configuration it needs.
 * `NEXT_PUBLIC_API_ORIGIN` is a public value by design: it is a URL, not a
 * credential.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,

  // Pin the workspace root to this repository. Without it Next walks up the
  // directory tree, finds an unrelated lockfile on the machine above the repo,
  // and infers the wrong root — which produces incorrect build traces on Vercel.
  outputFileTracingRoot: new URL('../..', import.meta.url).pathname,

  // Fail the production build on a type or lint error rather than shipping it.
  // Next.js ignores lint errors during `next build` by default; for a site
  // maintained with AI assistance, a silent pass defeats the whole point.
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },

  // Transpile workspace packages, which ship TypeScript source rather than a build.
  //
  // `@lopoti-nooklean/db` is listed for its `/schema` subpath only — the
  // browser-safe half, holding types and validation with no `pg` import. A lint
  // rule bans the package's main entry point here.
  transpilePackages: ['@lopoti-nooklean/ui', '@lopoti-nooklean/db'],

  images: {
    // Photographs are served from this app's own /public, optimised by Next.
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
        // Quote pages are private to the customer holding the link.
        source: '/devis/:token',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

export default nextConfig;
