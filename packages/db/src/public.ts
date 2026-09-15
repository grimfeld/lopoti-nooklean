/**
 * `@lopoti-nooklean/db/schema` — the browser-safe half of this package.
 *
 * The public sites need the domain vocabulary (what a service looks like, which
 * animals exist, what a valid submission is) but must never pull in `pg` or a
 * connection pool — they hold no credentials and run partly in a browser.
 *
 * So this entry point re-exports types and validation only. The main entry
 * point (`@lopoti-nooklean/db`) adds the queries and the pool, and is imported
 * by the back office alone. A lint rule stops a public app importing it.
 */

export {
  DEFAULT_SERVICES_CONFIG,
  SERVICES_CONFIG_KEY,
  animalRefSchema,
  poteProfileSchema,
  resolveAnimals,
  sanitizeServicesConfig,
  serviceItemSchema,
  servicesConfigSchema,
  type AnimalRef,
  type PoteProfile,
  type ResolvedAnimal,
  type ServiceItem,
  type ServicesConfig,
} from './site-config';

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
