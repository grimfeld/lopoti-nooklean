/**
 * Destructive-SQL guard.
 *
 * Migrations run automatically on every deploy, unattended. That is only safe
 * if a migration cannot destroy data. This guard refuses any migration file
 * containing a destructive statement, and it runs both in CI (as its own check)
 * and again inside the migration runner itself — so there is no way to apply a
 * destructive migration by skipping a step.
 *
 * The site owner is not a developer and changes will often be authored by an
 * AI. An AI "tidying up" a schema must not be able to drop a table of real
 * customer requests.
 *
 * Escape hatch: a file may opt out with a line containing
 *   -- migration-guard: allow-destructive
 * That marker is a deliberate, reviewable act. It should appear in a pull
 * request diff and be questioned every single time.
 */

export const ALLOW_MARKER = 'migration-guard: allow-destructive';

interface ForbiddenPattern {
  readonly label: string;
  readonly pattern: RegExp;
}

const FORBIDDEN: readonly ForbiddenPattern[] = [
  { label: 'DROP TABLE', pattern: /\bDROP\s+TABLE\b/i },
  { label: 'DROP DATABASE', pattern: /\bDROP\s+DATABASE\b/i },
  { label: 'DROP SCHEMA', pattern: /\bDROP\s+SCHEMA\b/i },
  { label: 'DROP COLUMN', pattern: /\bDROP\s+COLUMN\b/i },
  { label: 'TRUNCATE', pattern: /\bTRUNCATE\b/i },
  // An unqualified DELETE or UPDATE (no WHERE) rewrites every row.
  { label: 'DELETE without WHERE', pattern: /\bDELETE\s+FROM\s+[^;]*?;/i },
  { label: 'ALTER COLUMN ... TYPE', pattern: /\bALTER\s+COLUMN\b[^;]*\bTYPE\b/i },
];

/** Strips comments and string literals so keywords inside them do not match. */
function stripNoise(sql: string): string {
  return sql
    .replace(/--[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/'(?:[^']|'')*'/g, "''")
    .replace(/\$\$[\s\S]*?\$\$/g, ' ');
}

export interface GuardViolation {
  readonly file: string;
  readonly statement: string;
}

export function inspectSql(file: string, sql: string): GuardViolation[] {
  if (sql.includes(ALLOW_MARKER)) return [];

  const cleaned = stripNoise(sql);
  const violations: GuardViolation[] = [];

  for (const { label, pattern } of FORBIDDEN) {
    const match = pattern.exec(cleaned);
    if (!match) continue;

    // A DELETE carrying a WHERE clause is scoped, so it is allowed.
    if (label === 'DELETE without WHERE' && /\bWHERE\b/i.test(match[0])) continue;

    violations.push({ file, statement: label });
  }

  return violations;
}

export function formatViolations(violations: readonly GuardViolation[]): string {
  const lines = violations.map((v) => `  ${v.file}: ${v.statement}`);
  return [
    'Destructive SQL found in migration files:',
    ...lines,
    '',
    'Migrations run automatically on deploy and must be forward-only.',
    'To change a column type, add a new column and backfill it instead.',
    'To remove a column, stop reading it in code and leave it in the database.',
    '',
    `If this is genuinely intended, add a line containing "${ALLOW_MARKER}"`,
    'to the migration file — and expect it to be questioned in review.',
  ].join('\n');
}
