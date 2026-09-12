import { z } from 'zod';

/**
 * The ONE module that reads `process.env` in the back office.
 *
 * Unlike the two public sites (which are banned from the environment entirely),
 * this app legitimately holds secrets — so the rule here is convention rather
 * than lint: everything else imports the validated `config` object below. A
 * missing or malformed variable then fails here, loudly, at startup, instead of
 * surfacing as a confusing error on a live site.
 */

const schema = z.object({
  /**
   * Shared back-office password. There are two users, one of whom built the
   * system, so per-user identity buys nothing. A long passphrase is the whole
   * defence, hence the minimum length.
   */
  ADMIN_PASSWORD: z.string().min(12, 'ADMIN_PASSWORD must be at least 12 characters'),

  /**
   * Signing key for the session cookie. Generate with:
   *   openssl rand -hex 32
   */
  ADMIN_SECRET: z.string().min(32, 'ADMIN_SECRET must be at least 32 characters'),

  /**
   * Origins allowed to call this API. The two public sites, comma-separated.
   * Preview deployments are matched by pattern instead (see cors.ts), because
   * their URLs change on every build.
   */
  PUBLIC_ORIGIN_LOPOTI: z.string().url().optional(),
  PUBLIC_ORIGIN_NOOKLEAN: z.string().url().optional(),

  /** Vercel sets this automatically: 'production' | 'preview' | 'development'. */
  VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),

  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

function load(): z.infer<typeof schema> {
  const parsed = schema.safeParse(process.env);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Invalid environment configuration:\n${details}\n\n` +
        'Copy apps/admin/.env.example to apps/admin/.env.local and fill it in.\n' +
        'On Vercel, set these under Project Settings > Environment Variables.',
    );
  }

  return parsed.data;
}

export const config = load();

export const isProduction = config.VERCEL_ENV === 'production';
