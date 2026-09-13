# Lopoti × Nooklean

Two small Paris businesses, run by one person, sharing one back office.

- **Lopoti** — pet sitting. Visits, walks and care for dogs, cats and small animals.
- **Nooklean** — cleaning the shared areas of apartment buildings.

Separate brands with separate customers, but **one person's time** — which is why
they share a calendar and an admin interface.

## Why this repository looks the way it does

The owner is not a developer. Changes are made by asking an AI, and reviewed by
looking at a preview website rather than by reading code.

Everything here follows from that. Mistakes are caught by machinery rather than by
expertise:

- **Typed end to end.** A mistake becomes a build failure, not a blank section on
  a live site.
- **Structural rules, not advice.** Lint forbids what must not happen — a public
  site importing the database, a secret read outside the back office, one app
  importing another — so the invariants cannot be broken by accident.
- **Forward-only migrations.** They apply automatically on deploy, and a guard
  rejects `DROP`, `TRUNCATE` and column type changes. An AI tidying a schema
  cannot delete real customer requests.
- **A merge gate.** Checks must pass before the merge button unlocks. The question
  becomes "does this website look right?", which the owner can answer, instead of
  "is this code correct?", which he cannot.
- **Recipes, not documentation.** [`docs/recipes/`](docs/recipes/) holds
  step-by-step instructions for the things he will actually ask for, written to be
  handed to an AI.

## Layout

```
apps/lopoti      Public site — pet sitting.      No secrets, no database.
apps/nooklean    Public site — cleaning.         No secrets, no database.
apps/admin       Back office. Owns the API, the database and every secret.
packages/db      The only database access point. Schema, queries, migrations.
packages/ui      Shared components and brand colour tokens.
```

Three Vercel projects build from this one repository, each pointed at its own app
directory.

## Running it locally

```bash
pnpm install
pnpm db:local:up     # Postgres in Docker
pnpm db:migrate      # apply the schema
pnpm dev             # lopoti :3001, nooklean :3002, admin :3003
```

The back office needs `apps/admin/.env.local` — copy `.env.example` and fill it
in. The public sites need no environment variables at all, which is the point.

```bash
pnpm verify          # typecheck + lint + unit tests — the merge gate
pnpm test:e2e        # the four smoke flows, in a real browser
```

## Reading further

| | |
| --- | --- |
| [`CLAUDE.md`](CLAUDE.md) | The invariants, and how each one is enforced |
| [`docs/decisions.md`](docs/decisions.md) | Every architectural decision and why |
| [`docs/recipes/`](docs/recipes/) | How to change prices, copy, photos, services |
| [`docs/setup-secrets.md`](docs/setup-secrets.md) | First-time Vercel and database setup |

## A note on the stack

Next.js, TypeScript, Postgres, plain SQL, CSS Modules. No ORM, no calendar
library, no component framework. Each of those was a considered choice rather than
an omission — the reasoning is in `docs/decisions.md`, including what was
deliberately left out and what would justify adding it later.
