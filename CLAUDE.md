# Working on this repository

Two small Paris businesses run by one person: **Lopoti** (pet sitting) and
**Nooklean** (cleaning shared areas of apartment buildings). Separate brands,
separate customers, but **one person's time** — which is why they share a
calendar and a back office.

**The owner is not a developer.** Changes will usually be made by asking an AI,
reviewed by looking at a preview website rather than by reading code. Everything
here is shaped by that: mistakes should be caught by machinery, and the machinery
should explain itself in plain language.

Full reasoning for every decision: [`docs/decisions.md`](docs/decisions.md).
Step-by-step instructions for common tasks: [`docs/recipes/`](docs/recipes/).

## Layout

```
apps/lopoti      Public site — pet sitting.      No secrets, no database.
apps/nooklean    Public site — cleaning.         No secrets, no database.
apps/admin       Back office. Owns the API, the database and every secret.
packages/db      The ONLY database access point. Schema, queries, migrations.
packages/ui      Shared components and brand colour tokens. Kept small.
packages/tsconfig, packages/eslint-config    Shared configuration.
```

Three Vercel projects build from this one repository, each pointed at its own
app directory.

## Invariants

These are not style preferences. Each one has a mechanical guard that fails the
build, listed in the right-hand column. If a task seems to require breaking one,
**say so rather than working around it**.

| Rule | Why | Enforced by |
| --- | --- | --- |
| Public sites never import `@lopoti-nooklean/db` or `pg` | They are deployed with no credentials; a database import would need some | ESLint `no-restricted-imports` |
| Public sites never read `process.env` | A secret read in a public app can end up in a browser bundle | ESLint `no-restricted-properties` |
| All database access goes through `packages/db` | One place defines every query, so three apps cannot drift apart | ESLint ban on importing `pg` |
| An app never imports from another app | Apps must stay independently deployable | ESLint pattern ban on `**/apps/**` |
| Every API route validates input with Zod | Malformed input must never reach SQL | `protectedRoute` / `publicRoute` require a schema |
| New API routes are authenticated by default | Copying a route should inherit protection, not lose it | `protectedRoute` is the default helper |
| Migrations are forward-only | They run unattended on deploy; a `DROP` would destroy real customer data | `pnpm db:migrate:check` in CI |
| Never edit an already-applied migration | The database and the file would silently disagree forever | Checksum in `schema_migrations` |
| Prices and service lists are NOT hardcoded | The owner edits them in the back office, with no deploy | Code review; see decision 13 |
| French copy stays French | It is a French business with French customers | Please just don't |

## Before you finish

```
pnpm verify      # typecheck + lint + unit tests, across everything
```

A pull request cannot be merged while this is failing, so running it first saves
a round trip. For database work also run `pnpm db:migrate:check`.

## Local development

```
pnpm install
pnpm db:local:up          # Postgres in Docker
pnpm db:migrate           # apply the schema
pnpm dev                  # lopoti :3001, nooklean :3002, admin :3003
```

The admin app needs `apps/admin/.env.local` — copy `.env.example` and fill it in.
The public sites need no environment variables at all, which is the point.

## Things that are deliberately missing

Do not "fix" these without being asked; each was a considered decision
(see `docs/decisions.md`, *Deliberately deferred*).

- **No real domain names.** Vercel's default URLs, until one is bought.
- **No automatic email.** Quotes are sent by the owner with `mailto:`, on purpose —
  automatic sending is the one mistake that reaches a customer irreversibly.
  Delivery is isolated in `deliverQuote()` for when that changes.
- **No calendar library.** The calendar is about 250 lines of our own code, so it
  can be read and changed. No drag-and-drop.
- **No emoji picker.** The operating system already has one.
- **No visual regression tests.** The owner changes how things look constantly;
  screenshot tests would fail on every intended change.

## Tone of user-facing text

Both brands speak plainly and avoid overpromising. Two specifics that matter:

- A calendar slot is a **request**, never a confirmed booking, until the owner
  confirms it. Never write copy implying an instant reservation.
- Nooklean price estimates are **indicative**, confirmed after a visit. Never
  present an estimate as a firm quote.
