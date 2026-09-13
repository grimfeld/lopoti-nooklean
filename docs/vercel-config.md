# How the Vercel projects are configured

Three projects build from this one repository. Each `apps/*/vercel.json` is
deliberately terse because **Vercel's schema rejects unknown keys** — including
`//`-prefixed ones used as comments elsewhere in this repo. A comment in those
files fails the deployment with:

```
The `vercel.json` schema validation failed with the following message:
should NOT have additional property `//buildCommand`
```

So the explanations live here instead.

## All three projects

| Setting | Value | Why |
| --- | --- | --- |
| Root Directory | `apps/<name>` | Set in the Vercel dashboard, not in the file |
| `installCommand` | `cd ../.. && pnpm install --frozen-lockfile` | Installs the whole workspace: an app's dependencies live at the repo root |
| `buildCommand` | `cd ../.. && pnpm turbo run build --filter=<package>` | Builds through Turborepo so `packages/db` and `packages/ui` are built first |

## The public sites: `ignoreCommand`

```
cd ../.. && npx turbo-ignore @lopoti-nooklean/lopoti
```

Skips the build when neither this app nor anything it depends on changed — so
editing the cleaning site does not redeploy the pet-sitting site. `turbo-ignore`
exits 0 to cancel a build and 1 to proceed.

## The back office: `ignoreCommand` is `exit 1`

Deliberately always builds, never skipped.

The back office owns the database migrations, which run as part of its build. A
skipped build means a skipped migration, and then the code and the schema
disagree. An unnecessary build costs a minute; a missed migration costs a broken
site with a confusing Postgres error.

## Environment variables

Set in the dashboard, per project, not in these files — see
[`setup-secrets.md`](setup-secrets.md).

| Project | Variables |
| --- | --- |
| `admin` | `DATABASE_URL`, `ADMIN_PASSWORD`, `ADMIN_SECRET`, `PUBLIC_ORIGIN_LOPOTI`, `PUBLIC_ORIGIN_NOOKLEAN` |
| `lopoti` | `NEXT_PUBLIC_API_ORIGIN` |
| `nooklean` | `NEXT_PUBLIC_API_ORIGIN` |

The two public sites hold no secrets at all. That asymmetry is enforced in code by
a lint rule, not just by convention.
