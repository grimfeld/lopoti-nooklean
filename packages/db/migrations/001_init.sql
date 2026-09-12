-- Initial schema: requests and quotes for both brands.
--
-- Design notes (decided during planning, see docs/decisions.md):
--   * ONE `requests` table for both brands, separated by the `brand` column.
--     Fields shared by both brands are real columns; brand-specific fields
--     (animal details for Lopoti, building/mailbox details for Nooklean) live
--     in `details` JSONB. Promote a JSONB field to a real column if it ever
--     needs indexing or filtering.
--   * ONE shared calendar. Both brands are the same person's time, so a
--     confirmed job on either brand must block that slot on both sites.
--     A pending request does NOT block — see the partial unique index below.

CREATE TABLE IF NOT EXISTS requests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Which public site the request came from.
  brand TEXT NOT NULL CHECK (brand IN ('lopoti', 'nooklean')),

  -- Lifecycle. 'nouveau' -> 'confirme' -> 'termine', or 'annule' at any point.
  statut TEXT NOT NULL DEFAULT 'nouveau'
    CHECK (statut IN ('nouveau', 'confirme', 'termine', 'annule')),

  -- What was asked for. Free text: the service catalogue is editable from the
  -- back office, so a foreign key would break whenever a service is renamed.
  service TEXT NOT NULL,

  -- The requested moment on the shared calendar. NULL for requests with no
  -- specific slot yet (for example Nooklean's recurring contracts, which carry
  -- a start date and weekdays in `details` instead).
  starts_at TIMESTAMPTZ,

  -- Client contact details.
  nom_client TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT NOT NULL,

  -- Coarse location, used for routing and pricing. Arrondissement or city.
  secteur TEXT,

  -- Everything brand-specific, plus the full original form payload so that no
  -- submitted information is ever lost even if a column is added later.
  details JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The back office lists newest-first, filters by brand, and filters by status.
CREATE INDEX IF NOT EXISTS requests_created_at_idx ON requests (created_at DESC);
CREATE INDEX IF NOT EXISTS requests_brand_statut_idx ON requests (brand, statut);
CREATE INDEX IF NOT EXISTS requests_starts_at_idx ON requests (starts_at)
  WHERE starts_at IS NOT NULL;

-- THE DOUBLE-BOOKING GUARD.
--
-- Two people may both *request* 10:00 — whoever fills the form first does not
-- get to lock out a paying customer, and the back office shows the conflict so
-- a human decides. But only ONE job can be *confirmed* at a given moment,
-- across both brands, because it is one person's time.
--
-- Enforcing this as a partial unique index (rather than in application code)
-- makes it atomic: two simultaneous confirmations cannot both succeed, and the
-- loser gets a constraint violation the API turns into a clear error.
CREATE UNIQUE INDEX IF NOT EXISTS requests_confirmed_slot_unique
  ON requests (starts_at)
  WHERE statut = 'confirme' AND starts_at IS NOT NULL;

-- Quotes (devis). A request may have at most one quote.
CREATE TABLE IF NOT EXISTS quotes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  request_id BIGINT NOT NULL UNIQUE REFERENCES requests (id) ON DELETE CASCADE,

  -- Public, unguessable token for the customer-facing quote page at
  -- /devis/[token]. Never expose the row id in a URL: it would let anyone
  -- enumerate other customers' quotes.
  token TEXT NOT NULL UNIQUE,

  statut TEXT NOT NULL DEFAULT 'brouillon'
    CHECK (statut IN ('brouillon', 'pret', 'envoye', 'accepte', 'refuse')),

  -- Human-facing reference, e.g. NOOK-2026-001.
  reference TEXT NOT NULL,

  -- Free text, not a number: real quotes read "480 € HT / mois" or
  -- "à partir de 1 200 €". Forcing a numeric type here would lose that.
  montant TEXT,

  valable_jusqu_au DATE,
  modalites_paiement TEXT,
  delai_demarrage TEXT,
  prestations TEXT,
  conditions TEXT,
  message_client TEXT,

  -- Set when the owner actually sends the quote, so there is a record of what
  -- was sent and when.
  sent_at TIMESTAMPTZ,
  -- Set the first time the customer opens the quote page.
  viewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quotes_request_id_idx ON quotes (request_id);

-- Key/value store for settings the owner edits from the back office:
-- service catalogues, price ranges per postal code, team bios, contact details.
--
-- Scoped by brand so each site has its own configuration, with 'shared' for
-- settings that apply to both.
CREATE TABLE IF NOT EXISTS site_config (
  brand TEXT NOT NULL CHECK (brand IN ('lopoti', 'nooklean', 'shared')),
  cle TEXT NOT NULL,
  valeur JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (brand, cle)
);

-- Keeps `updated_at` honest without every query having to remember it.
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER requests_touch_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE OR REPLACE TRIGGER quotes_touch_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
