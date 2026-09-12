/**
 * `@lopoti-nooklean/db` — the only way into the database.
 *
 * ESLint forbids importing `pg` anywhere else in the repository, so every
 * query, every schema rule, and the connection pool itself live behind this
 * one entry point. That is what keeps three apps from drifting apart, and what
 * keeps database credentials out of the two public sites entirely.
 */

export { pool, query, transaction, type QueryParam } from './pool';

export {
  checkHealth,
  getConfig,
  getQuoteByToken,
  getQuoteForRequest,
  getRequest,
  insertRequest,
  listConfirmedSlots,
  listRequests,
  markQuoteViewed,
  setConfig,
  updateRequest,
  SlotConflictError,
  type DbHealth,
  type ListRequestsFilter,
  type RequestPatch,
} from './queries';

export {
  BRANDS,
  HONEYPOT_FIELD,
  QUOTE_STATUSES,
  QUOTE_STATUS_LABELS,
  REQUEST_STATUSES,
  REQUEST_STATUS_LABELS,
  brandSchema,
  configBrandSchema,
  contactSchema,
  lopotiSubmissionSchema,
  nookleanAddressSchema,
  nookleanSubmissionSchema,
  quoteSchema,
  quoteStatusSchema,
  requestSchema,
  requestStatusSchema,
  requestUpdateSchema,
  submissionSchema,
  type Brand,
  type ConfigBrand,
  type NookleanAddress,
  type Quote,
  type QuoteStatus,
  type Request,
  type RequestStatus,
  type RequestUpdate,
  type Submission,
} from './schema';

/**
 * `migrate` is deliberately NOT exported here.
 *
 * The migration runner reads .sql files from disk at run time, which makes it a
 * build-time tool rather than application code. Re-exporting it from this barrel
 * pulled it into the back office's bundle, where a bundler cannot resolve the
 * migrations directory and has no reason to try.
 *
 * The CLI (`src/cli/migrate.ts`) and the tests import `./migrate` directly.
 */
