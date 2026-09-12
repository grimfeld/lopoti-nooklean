import crypto from 'node:crypto';

import { config, isProduction } from './config';

/**
 * Back-office authentication: one shared password, one signed cookie.
 *
 * Ported from the original implementation, which was already careful — constant
 * time comparison, HttpOnly/Secure/SameSite cookie — with two changes:
 *
 *   * Login attempts are rate limited. A shared password with unlimited
 *     attempts is brute-forceable, and there is no second factor here.
 *   * Sessions last 30 days and slide forward on use, instead of 12 hours.
 *     Frequent re-entry pushes people toward weak, written-down passwords.
 *
 * The cookie is deliberately host-only (no `Domain` attribute), so it belongs to
 * the back office alone and a public site on a sibling subdomain can never read it.
 */

const COOKIE_NAME = 'bo_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
/** Re-issue the cookie when less than this remains, so active use extends it. */
const SLIDING_REFRESH_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

interface SessionPayload {
  readonly exp: number;
}

function sign(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', config.ADMIN_SECRET).update(data).digest('base64url');
  return `${data}.${mac}`;
}

function verify(token: string | undefined): SessionPayload | null {
  if (!token || !token.includes('.')) return null;

  const [data, mac] = token.split('.');
  if (!data || !mac) return null;

  const expected = crypto
    .createHmac('sha256', config.ADMIN_SECRET)
    .update(data)
    .digest('base64url');

  // Compare as fixed-length digests: timingSafeEqual throws on length mismatch,
  // which would itself leak information.
  const given = Buffer.from(mac);
  const want = Buffer.from(expected);
  if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) return null;

  try {
    const parsed: unknown = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('exp' in parsed) ||
      typeof parsed.exp !== 'number'
    ) {
      return null;
    }
    if (parsed.exp < Date.now()) return null;
    return { exp: parsed.exp };
  } catch {
    return null;
  }
}

/** Constant-time password check. Hashing first keeps lengths equal. */
export function checkPassword(candidate: unknown): boolean {
  const given = crypto
    .createHash('sha256')
    .update(typeof candidate === 'string' ? candidate : '')
    .digest();
  const want = crypto.createHash('sha256').update(config.ADMIN_PASSWORD).digest();
  return crypto.timingSafeEqual(given, want);
}

function cookie(value: string, maxAgeSeconds: number): string {
  const parts = [
    `${COOKIE_NAME}=${value}`,
    'HttpOnly',
    'SameSite=Strict',
    'Path=/',
    `Max-Age=${maxAgeSeconds}`,
  ];
  // `Secure` on http://localhost would stop the cookie being stored at all.
  if (isProduction) parts.push('Secure');
  return parts.join('; ');
}

export function sessionCookie(): string {
  return cookie(sign({ exp: Date.now() + SESSION_TTL_MS }), Math.floor(SESSION_TTL_MS / 1000));
}

export function clearedCookie(): string {
  return cookie('', 0);
}

function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return undefined;
}

export interface SessionState {
  readonly valid: boolean;
  /** Set when the session is valid but close to expiry and should be renewed. */
  readonly refreshCookie?: string;
}

export function readSession(request: Request): SessionState {
  const payload = verify(readCookie(request.headers.get('cookie'), COOKIE_NAME));
  if (!payload) return { valid: false };

  if (payload.exp - Date.now() < SLIDING_REFRESH_MS) {
    return { valid: true, refreshCookie: sessionCookie() };
  }
  return { valid: true };
}

// --- Login rate limiting ---------------------------------------------------

/**
 * In-memory attempt counter, keyed by client IP.
 *
 * Serverless instances do not share memory, so this is a speed bump rather than
 * a hard guarantee — but it turns an unlimited online brute force into a slow
 * one, which for a single strong passphrase is enough. A shared store (Vercel
 * KV) would make it exact; it is not worth the dependency at two users.
 */
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 1000 * 60 * 15;

interface AttemptRecord {
  count: number;
  firstAt: number;
}

const attempts = new Map<string, AttemptRecord>();

export function clientKey(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

export function isRateLimited(key: string): boolean {
  const record = attempts.get(key);
  if (!record) return false;

  if (Date.now() - record.firstAt > WINDOW_MS) {
    attempts.delete(key);
    return false;
  }
  return record.count >= MAX_ATTEMPTS;
}

export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now - record.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: now });
    return;
  }
  record.count += 1;
}

export function clearAttempts(key: string): void {
  attempts.delete(key);
}
