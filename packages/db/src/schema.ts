import { z } from 'zod';

/**
 * The shared vocabulary of the system, as runtime-checked schemas.
 *
 * Every API boundary validates against these, so malformed input is rejected
 * at the edge with a clear message rather than reaching a SQL query or a React
 * component. The TypeScript types are inferred from the schemas, which means
 * the compile-time and runtime views of the data cannot drift apart.
 */

// --- Brands ----------------------------------------------------------------

export const BRANDS = ['lopoti', 'nooklean'] as const;
export const brandSchema = z.enum(BRANDS);
export type Brand = z.infer<typeof brandSchema>;

export const configBrandSchema = z.enum([...BRANDS, 'shared']);
export type ConfigBrand = z.infer<typeof configBrandSchema>;

// --- Request lifecycle -----------------------------------------------------

export const REQUEST_STATUSES = ['nouveau', 'confirme', 'termine', 'annule'] as const;
export const requestStatusSchema = z.enum(REQUEST_STATUSES);
export type RequestStatus = z.infer<typeof requestStatusSchema>;

/** French labels for the back office. The owner never sees the raw values. */
export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  nouveau: 'Nouvelle',
  confirme: 'Confirmée',
  termine: 'Terminée',
  annule: 'Annulée',
};

// --- Shared field rules ----------------------------------------------------

const trimmed = (max: number) => z.string().trim().min(1).max(max);

/**
 * Phone numbers are kept as the visitor typed them. Normalising risks mangling
 * a valid number, and the owner phones these people himself.
 */
const telephoneSchema = z
  .string()
  .trim()
  .min(6, 'Numéro de téléphone trop court')
  .max(40)
  .regex(/^[0-9+()./\s-]+$/, 'Numéro de téléphone invalide');

export const contactSchema = z.object({
  nom_client: trimmed(160),
  email: z.string().trim().email('Adresse e-mail invalide').max(200),
  telephone: telephoneSchema,
  secteur: z.string().trim().max(160).optional(),
});

// --- Requests --------------------------------------------------------------

/**
 * A request as stored. `details` stays unknown-shaped on purpose: it holds the
 * full original form payload so no submitted information is ever lost, and its
 * brand-specific contents are validated by the per-brand schemas below.
 */
export const requestSchema = contactSchema.extend({
  id: z.number().int().positive(),
  brand: brandSchema,
  statut: requestStatusSchema,
  service: trimmed(200),
  starts_at: z.date().nullable(),
  details: z.record(z.unknown()),
  created_at: z.date(),
  updated_at: z.date(),
});
export type Request = z.infer<typeof requestSchema>;

/** Fields the back office may change on an existing request. */
export const requestUpdateSchema = z
  .object({
    id: z.number().int().positive(),
    statut: requestStatusSchema.optional(),
    starts_at: z.coerce.date().nullable().optional(),
  })
  .refine(
    (value) => value.statut !== undefined || value.starts_at !== undefined,
    'Aucun champ à mettre à jour',
  );
export type RequestUpdate = z.infer<typeof requestUpdateSchema>;

// --- Public submissions ----------------------------------------------------

/**
 * Honeypot field. Bots fill every input they find; a real visitor never sees
 * this one. A filled honeypot is accepted and silently discarded, so the bot
 * gets no signal that it was detected.
 */
export const HONEYPOT_FIELD = 'bot-field';

const submissionBase = contactSchema.extend({
  service: trimmed(200),
  [HONEYPOT_FIELD]: z.string().max(0).optional().or(z.string().optional()),
});

/** Lopoti: pet-sitting. The animal is the organising fact. */
export const lopotiSubmissionSchema = submissionBase.extend({
  brand: z.literal('lopoti'),
  type_animal: trimmed(80),
  nom_animal: z.string().trim().max(120).optional(),
  espece: z.string().trim().max(120).optional(),
  date_souhaitee: z.string().trim().max(40).optional(),
  moment_souhaite: z.string().trim().max(80).optional(),
  frequence: z.string().trim().max(80).optional(),
  adresse: trimmed(300),
  contact_urgence: trimmed(200),
  details: z.record(z.unknown()).default({}),
});

/** Nooklean: building cleaning. Addresses and mailbox counts drive pricing. */
export const nookleanAddressSchema = z.object({
  street: trimmed(300),
  postal: z
    .string()
    .trim()
    .regex(/^\d{5}$/, 'Code postal invalide'),
  floors: z.coerce.number().int().min(1).max(50),
  mailboxes: z.coerce.number().int().min(1).max(1000),
});
export type NookleanAddress = z.infer<typeof nookleanAddressSchema>;

export const nookleanSubmissionSchema = submissionBase.extend({
  brand: z.literal('nooklean'),
  addresses: z.array(nookleanAddressSchema).min(1, 'Au moins une adresse est requise').max(20),
  // One-off jobs carry a date and slot; recurring contracts carry weekdays and
  // a start date. The API validates that the right combination is present.
  date_souhaitee: z.string().trim().max(40).optional(),
  slot: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  weekdays: z.array(z.string().trim().max(20)).max(7).default([]),
  billing: z.enum(['one_off', 'monthly']).default('one_off'),
  free_visit_requested: z.coerce.boolean().default(false),
  details: z.record(z.unknown()).default({}),
});

export const submissionSchema = z.discriminatedUnion('brand', [
  lopotiSubmissionSchema,
  nookleanSubmissionSchema,
]);
export type Submission = z.infer<typeof submissionSchema>;

// --- Quotes ----------------------------------------------------------------

export const QUOTE_STATUSES = ['brouillon', 'pret', 'envoye', 'accepte', 'refuse'] as const;
export const quoteStatusSchema = z.enum(QUOTE_STATUSES);
export type QuoteStatus = z.infer<typeof quoteStatusSchema>;

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  brouillon: 'Brouillon',
  pret: 'Prêt à envoyer',
  envoye: 'Envoyé',
  accepte: 'Accepté',
  refuse: 'Refusé',
};

export const quoteSchema = z.object({
  id: z.number().int().positive(),
  request_id: z.number().int().positive(),
  token: z.string().min(20),
  statut: quoteStatusSchema,
  reference: trimmed(60),
  // Free text, not a number: real quotes read "480 € HT / mois".
  montant: z.string().trim().max(120).nullable(),
  valable_jusqu_au: z.date().nullable(),
  modalites_paiement: z.string().trim().max(200).nullable(),
  delai_demarrage: z.string().trim().max(200).nullable(),
  prestations: z.string().trim().max(4000).nullable(),
  conditions: z.string().trim().max(4000).nullable(),
  message_client: z.string().trim().max(4000).nullable(),
  sent_at: z.date().nullable(),
  viewed_at: z.date().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
});
export type Quote = z.infer<typeof quoteSchema>;
