import { query, transaction } from './pool';
import {
  type Brand,
  type ConfigBrand,
  type Quote,
  type Request,
  type RequestStatus,
  type Submission,
} from './schema';

/**
 * Every database query in the system lives here.
 *
 * Callers pass already-validated data (validated against `./schema.ts` at the
 * API boundary) and receive typed rows. No SQL string is ever built by
 * concatenating a caller's value — all values travel as parameters.
 */

/**
 * A row as Postgres returns it, before shaping.
 *
 * `id` is typed as `string` on purpose: `pg` returns BIGINT as a string, because
 * a 64-bit integer does not fit in a JavaScript number without losing precision.
 * `toRequest` converts it — these tables will never approach 2^53 rows, so the
 * conversion is safe, but the driver's actual type has to be acknowledged or the
 * domain model silently lies about what it holds.
 */
interface RequestRow {
  id: string;
  brand: Brand;
  statut: RequestStatus;
  service: string;
  starts_at: Date | null;
  nom_client: string;
  email: string;
  telephone: string;
  secteur: string | null;
  details: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

function toRequest(row: RequestRow): Request {
  return {
    id: Number(row.id),
    brand: row.brand,
    statut: row.statut,
    service: row.service,
    starts_at: row.starts_at,
    nom_client: row.nom_client,
    email: row.email,
    telephone: row.telephone,
    // `secteur` is optional in the domain model but nullable in SQL.
    ...(row.secteur === null ? {} : { secteur: row.secteur }),
    details: row.details,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const REQUEST_COLUMNS = `
  id, brand, statut, service, starts_at,
  nom_client, email, telephone, secteur,
  details, created_at, updated_at
`;

// --- Writing a new request -------------------------------------------------

/**
 * Derives the shared-calendar moment from a submission.
 *
 * Returns null when the request has no single moment yet — a Nooklean
 * recurring contract, or a Lopoti request giving only a day and a vague
 * "morning". Those are scheduled by hand in the back office, which is where
 * `starts_at` gets filled in.
 */
function resolveStartsAt(submission: Submission): Date | null {
  if (submission.brand === 'nooklean') {
    if (submission.billing === 'monthly') return null;
    if (!submission.date_souhaitee || !submission.slot) return null;
    const parsed = new Date(`${submission.date_souhaitee}T${submission.slot}:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (!submission.date_souhaitee) return null;
  // Lopoti collects a day plus a moment ("matin"/"après-midi"), not a time.
  // Storing midday keeps the date on the calendar without inventing a slot.
  const parsed = new Date(`${submission.date_souhaitee}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function insertRequest(submission: Submission): Promise<Request> {
  const startsAt = resolveStartsAt(submission);

  // The whole payload is kept, so nothing the visitor typed is ever lost even
  // if a field has no column today.
  const details: Record<string, unknown> = { ...submission.details, ...submission };

  const rows = await query<RequestRow>(
    `INSERT INTO requests
       (brand, service, starts_at, nom_client, email, telephone, secteur, details)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
     RETURNING ${REQUEST_COLUMNS}`,
    [
      submission.brand,
      submission.service,
      startsAt,
      submission.nom_client,
      submission.email,
      submission.telephone,
      submission.secteur ?? null,
      JSON.stringify(details),
    ],
  );

  const row = rows[0];
  if (!row) throw new Error('Insert returned no row');
  return toRequest(row);
}

// --- Reading requests ------------------------------------------------------

export interface ListRequestsFilter {
  readonly brand?: Brand;
  readonly statut?: RequestStatus;
  readonly limit?: number;
}

export async function listRequests(filter: ListRequestsFilter = {}): Promise<Request[]> {
  const rows = await query<RequestRow>(
    `SELECT ${REQUEST_COLUMNS}
       FROM requests
      WHERE ($1::text IS NULL OR brand = $1)
        AND ($2::text IS NULL OR statut = $2)
      ORDER BY created_at DESC
      LIMIT $3`,
    [filter.brand ?? null, filter.statut ?? null, filter.limit ?? 500],
  );
  return rows.map(toRequest);
}

export async function getRequest(id: number): Promise<Request | null> {
  const rows = await query<RequestRow>(
    `SELECT ${REQUEST_COLUMNS} FROM requests WHERE id = $1`,
    [id],
  );
  const row = rows[0];
  return row ? toRequest(row) : null;
}

/**
 * Confirmed jobs across BOTH brands, for the shared calendar and for the
 * availability endpoint the public sites call. One person's time is one
 * calendar, so this deliberately does not filter by brand.
 */
export async function listConfirmedSlots(from: Date, to: Date): Promise<Date[]> {
  const rows = await query<{ starts_at: Date }>(
    `SELECT starts_at
       FROM requests
      WHERE statut = 'confirme'
        AND starts_at IS NOT NULL
        AND starts_at >= $1
        AND starts_at < $2
      ORDER BY starts_at`,
    [from, to],
  );
  return rows.map((row) => row.starts_at);
}

// --- Updating a request ----------------------------------------------------

/** Raised when confirming a request would double-book an already-taken slot. */
export class SlotConflictError extends Error {
  constructor(readonly startsAt: Date) {
    super('Ce créneau est déjà confirmé pour une autre demande.');
    this.name = 'SlotConflictError';
  }
}

const UNIQUE_VIOLATION = '23505';

/**
 * Fields a back-office edit may change.
 *
 * Each property explicitly admits `undefined` rather than only being optional:
 * the values come from a Zod-parsed request body, where an absent field arrives
 * as the property present and set to `undefined`. Under
 * `exactOptionalPropertyTypes` those are different types, and the caller's shape
 * is the honest one.
 */
export interface RequestPatch {
  readonly statut?: RequestStatus | undefined;
  readonly starts_at?: Date | null | undefined;
}

export async function updateRequest(id: number, patch: RequestPatch): Promise<Request | null> {
  const sets: string[] = [];
  const values: (string | Date | null)[] = [];

  if (patch.statut !== undefined) {
    sets.push(`statut = $${sets.length + 1}`);
    values.push(patch.statut);
  }
  if (patch.starts_at !== undefined) {
    sets.push(`starts_at = $${sets.length + 1}`);
    values.push(patch.starts_at);
  }
  if (sets.length === 0) return getRequest(id);

  values.push(String(id));

  try {
    const rows = await query<RequestRow>(
      `UPDATE requests SET ${sets.join(', ')}
        WHERE id = $${values.length}
        RETURNING ${REQUEST_COLUMNS}`,
      values,
    );
    const row = rows[0];
    return row ? toRequest(row) : null;
  } catch (error) {
    // The partial unique index in 001_init.sql is what actually prevents a
    // double booking. Translate its violation into a domain error so the back
    // office can say something useful instead of showing a Postgres message.
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === UNIQUE_VIOLATION
    ) {
      const existing = await getRequest(id);
      throw new SlotConflictError(patch.starts_at ?? existing?.starts_at ?? new Date());
    }
    throw error;
  }
}

// --- Site configuration ----------------------------------------------------

/**
 * Settings the owner edits from the back office: service catalogues, price
 * ranges per postal code, team bios, contact details.
 *
 * Returns `fallback` when nothing has been saved yet, so a fresh database
 * serves a working site rather than an empty one.
 */
export async function getConfig<T>(brand: ConfigBrand, cle: string, fallback: T): Promise<T> {
  const rows = await query<{ valeur: T }>(
    'SELECT valeur FROM site_config WHERE brand = $1 AND cle = $2',
    [brand, cle],
  );
  return rows[0]?.valeur ?? fallback;
}

export async function setConfig(brand: ConfigBrand, cle: string, valeur: unknown): Promise<void> {
  await query(
    `INSERT INTO site_config (brand, cle, valeur, updated_at)
       VALUES ($1, $2, $3::jsonb, now())
     ON CONFLICT (brand, cle)
       DO UPDATE SET valeur = EXCLUDED.valeur, updated_at = now()`,
    [brand, cle, JSON.stringify(valeur)],
  );
}

// --- Quotes ----------------------------------------------------------------

/** As with RequestRow, the BIGINT columns arrive as strings from `pg`. */
interface QuoteRow extends Omit<Quote, 'id' | 'request_id'> {
  id: string;
  request_id: string;
}

function toQuote(row: QuoteRow): Quote {
  return { ...row, id: Number(row.id), request_id: Number(row.request_id) };
}

const QUOTE_COLUMNS = `
  id, request_id, token, statut, reference, montant,
  valable_jusqu_au, modalites_paiement, delai_demarrage,
  prestations, conditions, message_client,
  sent_at, viewed_at, created_at, updated_at
`;

export async function getQuoteByToken(token: string): Promise<Quote | null> {
  const rows = await query<QuoteRow>(`SELECT ${QUOTE_COLUMNS} FROM quotes WHERE token = $1`, [
    token,
  ]);
  const row = rows[0];
  return row ? toQuote(row) : null;
}

export async function getQuoteForRequest(requestId: number): Promise<Quote | null> {
  const rows = await query<QuoteRow>(`SELECT ${QUOTE_COLUMNS} FROM quotes WHERE request_id = $1`, [
    requestId,
  ]);
  const row = rows[0];
  return row ? toQuote(row) : null;
}

/** Records that the customer opened the quote page, the first time only. */
export async function markQuoteViewed(token: string): Promise<void> {
  await query('UPDATE quotes SET viewed_at = now() WHERE token = $1 AND viewed_at IS NULL', [
    token,
  ]);
}

// --- Health ----------------------------------------------------------------

export interface DbHealth {
  readonly reachable: boolean;
  readonly migrationsApplied: number;
  readonly lastRequestAt: Date | null;
  readonly requestCount: number;
}

/**
 * Backs the back office health page, which answers "is everything working?"
 * in plain French for someone who will never read a log.
 */
export async function checkHealth(): Promise<DbHealth> {
  return transaction(async (client) => {
    const migrations = await client.query<{ count: string }>(
      'SELECT count(*)::text AS count FROM schema_migrations',
    );
    const requests = await client.query<{ count: string; last: Date | null }>(
      'SELECT count(*)::text AS count, max(created_at) AS last FROM requests',
    );

    return {
      reachable: true,
      migrationsApplied: Number(migrations.rows[0]?.count ?? 0),
      requestCount: Number(requests.rows[0]?.count ?? 0),
      lastRequestAt: requests.rows[0]?.last ?? null,
    };
  });
}
