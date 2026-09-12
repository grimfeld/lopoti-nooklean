/**
 * Back office — owns the API, the database connection and every secret.
 *
 * The two public sites call this app across origins, so it is also where CORS
 * is decided. See src/lib/cors.ts for the allowlist: preview deployments get
 * fresh URLs on every build, so they are matched by pattern rather than listed.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,

  // See the matching comment in apps/lopoti. This matters more here: the back
  // office's serverless functions need `pg` traced into the bundle, and a wrong
  // root can leave it out.
  outputFileTracingRoot: new URL('../..', import.meta.url).pathname,

  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },

  transpilePackages: ['@lopoti-nooklean/ui', '@lopoti-nooklean/db'],

  // `pg` is a native-ish server package; keep it out of any bundling attempt.
  serverExternalPackages: ['pg'],

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          // The back office must never be indexed.
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
};

export default nextConfig;
