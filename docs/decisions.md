# Architecture decisions

Every choice below was made deliberately during a planning session. Each entry
records the decision and, more importantly, **why** — so that a future change
is an informed reversal rather than an accident.

If you are an AI working on this repository: treat these as constraints. When a
task seems to require breaking one, say so rather than quietly working around it.

## Context

Two small Paris businesses run by one person:

- **Lopoti** — pet sitting (dogs, cats, small animals).
- **Nooklean** — cleaning of shared areas in apartment buildings.

They are separate brands with separate customers, but **one person's time**.
The owner is not a developer and will make changes by asking an AI. That single
fact drives most of what follows: the system is designed so that mistakes are
caught by machinery rather than by expertise.

---

## Structure

### 1. Three apps, not two
`apps/lopoti`, `apps/nooklean` (public sites) and `apps/admin` (back office).

The back office is the only thing both brands share. Deploying it separately
means a change to a public site cannot break the back office, and back-office
code never ships inside a public bundle.

### 2. The admin app owns all API routes
Public sites are static and hold **no** environment variables and **no**
database credentials. They call the admin API across origins.

The alternative — an `api/` folder in each app — means three copies of the
database layer drifting apart. The original Lopoti codebase already showed this
failure in miniature: `api/_config-defaults.js` carried a comment asking a human
to keep it in sync with `src/services-data.ts` by hand.

Cost accepted: CORS configuration, and form submissions become `fetch` + JSON
rather than a native form POST with a redirect.

### 3. Monorepo with pnpm workspaces and Turborepo
One place for shared types, one CI pipeline, one set of instructions. Three
Vercel projects build from it, each pointed at its own root directory.

Risk accepted: a bad change in `packages/db` can break all three sites at once.
CI gates every deploy, which is what makes this acceptable.

### 4. Next.js App Router + TypeScript everywhere
The requirement "a non-developer changes this with an AI" is really a
requirement for **build-time verification**. Hand-written DOM code fails
silently in the browser; typed React components fail loudly in CI before
anything is deployed.

Cost accepted: the Nooklean prototype (static HTML + vanilla JS) is a rewrite,
not a port. Its CSS survives nearly verbatim; its JavaScript does not.

---

## Data

### 5. One `requests` table for both brands
A `brand` column separates them. Shared fields are real columns; brand-specific
fields live in `details` JSONB.

The back office shows one list with a brand switcher, so one table means one
query and one lifecycle. Volume is tiny, so the loss of SQL-queryable
brand-specific fields costs nothing. Promote a JSONB field to a column if it
ever needs filtering.

### 6. One shared calendar, and pending requests do not block slots
Both brands are the same person's time, so a confirmed job on either brand
blocks that slot on both sites.

But a *pending* request does not. Two visitors may both ask for 10:00 — the
owner decides who gets it. The opposite rule would let someone filling a form
at 2am lock out a paying customer, and that loss would be invisible.

Enforced by a partial unique index (`WHERE statut = 'confirme'`), so two
simultaneous confirmations cannot both succeed. See `packages/db/migrations/001_init.sql`.

### 7. Neon Postgres, `pg` with raw SQL, no ORM
Provisioned through the Vercel marketplace so environment variables are injected
automatically and nobody copies a connection string by hand. Raw SQL because it
was already working in the original codebase and adds no abstraction to learn.

Neon's database branching is what makes per-pull-request testing possible
(see 11).

### 8. Migrations apply automatically on deploy
A ledger table (`schema_migrations`) records every applied file with a checksum.
The runner is idempotent, transactional per file, and takes an advisory lock so
concurrent deploys cannot race.

Hand-run migration files were the previous approach and would rot immediately:
nobody would remember which had been applied, and code would expect a column
that did not exist.

**Forward-only.** A guard rejects `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`,
unqualified `DELETE`, and column type changes. An AI "tidying up" a schema must
not be able to delete real customer requests. The guard has a deliberate
opt-out marker that should be questioned every time it appears.

---

## Safety

### 9. Layered tests
Typecheck and lint first (seconds, catch most AI mistakes), then Vitest for
domain and database logic, then Playwright for four critical flows only:

1. Lopoti: choose animal → service → slot → submit → row reaches the database
2. Nooklean: choose service → address → slot → submit → row reaches the database
3. Admin: log in → see both brands → change a status → it persists
4. Admin: build a quote → the customer-facing page renders

**No visual regression testing.** The owner will constantly want to change how
things look; screenshot tests would fail on every intended change and train him
to ignore a red build.

### 10. Structural enforcement, not just documentation
Each invariant has a mechanical twin that fails the build:

| Invariant | Mechanism |
| --- | --- |
| No secrets in public apps | ESLint bans `process.env` outside `apps/admin` and `packages/db` |
| One database entry point | ESLint bans importing `pg` outside `packages/db` |
| Apps stay independent | ESLint bans `apps/*` importing from another `apps/*` |
| API input is validated | Zod schema per route; unvalidated input is a type error |
| No destructive migrations | Guard script scans every `.sql` in CI |

Deliberately **not** adopted: `CODEOWNERS` requiring review on sensitive paths.
The goal is for the owner to ship independently; a human gate on exactly the
changes he would most need help with would make him wait days.

### 11. One Neon branch per pull request
CI tests and the Vercel preview deployment share a real, isolated database with
the true schema, created and destroyed automatically. Migrations are therefore
exercised on every pull request.

A local Docker Postgres (`docker-compose.yml`) covers offline development
without consuming Neon branch quota.

### 12. Pull request → CI gate → preview → merge
Branch protection blocks merging while checks are red; nobody pushes to `main`
directly. A bot comments the three preview URLs and a plain-French pass/fail
summary, so the question becomes "does this website look right?" — which the
owner can answer — instead of "is this code correct?", which he cannot.

Rollback is a documented one-click Vercel promotion of the previous deployment,
because reverting a commit is beyond him.

---

## Product

### 13. Structured data in the back office; words and design in code
Services, prices, zones, team bios and contact details are editable in the back
office: they change often, they are structured, and they can be validated.

All copy and layout stays in code, changed via AI and a pull request. Content in
a database bypasses the entire safety mechanism — a mistyped price would be live
instantly with no preview, no tests and no rollback.

### 14. Quotes get a hosted page; delivery stays manual for now
Each quote has an unguessable token and a branded page at `/devis/[token]`,
marked `noindex`. The owner sends the link with `mailto:`, which opens his own
mail client — nothing is sent automatically.

Automatic sending is the one place where a software mistake reaches a customer
irreversibly, so it stays behind a human click. Delivery is isolated in a single
`deliverQuote()` function, so switching to server-sent email later is a one-file
change.

### 15. Shared password authentication for the back office
Two people use it, one of whom built it. Per-user identity buys nothing and adds
a way to get locked out. The existing signed-cookie implementation was sound and
was ported, with two additions: rate-limited login attempts, and a 30-day
sliding session instead of 12 hours (short sessions push people toward weak,
written-down passwords).

API routes are **locked by default**; public access is explicit per route. An AI
adding a route gets authentication by accident rather than omitting it by
accident.

### 16. Hand-built calendar, no calendar library
The calendar renders requests as events and reschedules by clicking — about 5%
of what FullCalendar offers, for 200kb and an API surface to misuse. Roughly 250
lines of typed component is less code than the integration glue, and an AI can
read all of it when asked to change how a day looks.

No drag-and-drop; rescheduling uses a date field. If drag is ever wanted, that
is when a library earns its weight.

### 17. Native emoji, no picker
The operating system already has an emoji picker. Shipping a second one cost a
megabyte of Unicode data and the most intricate code in the back office, to
duplicate a platform feature. Replaced by a plain input with around forty
curated suggestions.

### 18. CSS Modules with the original CSS preserved
Both sites have genuinely good bespoke design. A rewrite in a utility framework
would be reimplementation, and the subtle parts — the arch-shaped hero, the
star-cleaning easter egg, the brand palettes — are exactly what reimplementation
loses. CSS Modules add scoping so an AI editing one brand cannot restyle the
other.

Brand palettes are CSS custom properties, giving colour changes a small, obvious
surface.

### 19. Self-hosted fonts via `next/font`
Google Fonts are fetched at build time and served from the app, so there is no
third-party request at runtime. Besides removing a dependency and layout shift,
this avoids the GDPR exposure that the Google Fonts CDN carries for a French
business.

---

## Deliberately deferred

These are known gaps, not oversights. Each is isolated so it can be added
without restructuring anything.

| Deferred | Why it is safe to wait | What it will take |
| --- | --- | --- |
| Real domain names | None are registered yet; Vercel's default URLs work | One config constant, plus DNS |
| Server-sent email (Resend) | `mailto:` keeps the owner in control and costs nothing | One function: `deliverQuote()` |
| Photo uploads from the back office | Photos change rarely; a pull request handles it | Vercel Blob and an upload form |
| Drag-and-drop rescheduling | A date field does the same job | A calendar library, if ever justified |
| The "Picnic" display font | The file is not available yet | Drop it in and add one `next/font/local` call |
