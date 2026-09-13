# Setting the secrets (you do this part)

Three Vercel projects need configuring, and the database needs creating. You
handle the secrets so they never pass through a chat; everything else is already
wired.

Values below were generated for you with a cryptographic random number
generator. **Use them or replace them — but do not reuse a password from
elsewhere.**

```
ADMIN_SECRET    12da283df680d95711e75a63163eac90580fdedae7e7cec22c2d2d79c3e32206
ADMIN_PASSWORD  flocon-mardi-lampe-mesange
```

`ADMIN_SECRET` signs the login cookie — nobody ever types it.
`ADMIN_PASSWORD` is what your friend types to open the back office. Put it in a
password manager before you set it, or you will lose it.

---

## Step 1 — Create the database

1. [vercel.com](https://vercel.com) → the **admin** project → **Storage** tab.
2. **Create Database** → **Neon** (Postgres) → Free plan → **Create**.
3. When it asks which projects to connect, tick **all three**: `admin`,
   `nooklean`, and the Lopoti project.

Vercel injects `DATABASE_URL` and `POSTGRES_URL` automatically. You never copy a
connection string by hand.

> The public sites do not use the database — they call the back office. Connecting
> them is harmless and makes the Vercel dashboard show the relationship
> correctly.

## Step 2 — Set the two secrets on the `admin` project only

**admin** project → **Settings** → **Environment Variables**. Add both, ticked
for **Production, Preview and Development**:

| Key | Value |
| --- | --- |
| `ADMIN_PASSWORD` | `flocon-mardi-lampe-mesange` |
| `ADMIN_SECRET` | `12da283df680d95711e75a63163eac90580fdedae7e7cec22c2d2d79c3e32206` |

**Do not add these to the other two projects.** The public sites are deployed
with no secrets at all, and a lint rule in the code enforces that. Adding them
there would be the one mistake that undoes it.

## Step 3 — Tell me when that is done

I then finish the rest, which needs no secrets:

- `NEXT_PUBLIC_API_ORIGIN` on both public sites (a URL, not a credential)
- `PUBLIC_ORIGIN_LOPOTI` / `PUBLIC_ORIGIN_NOOKLEAN` on the back office, so it
  accepts requests from them
- first deployment of all three
- checking the back office login works and a test request reaches it

---

## What each project ends up with

| Project | Variables | Secrets? |
| --- | --- | --- |
| **admin** | `DATABASE_URL`, `ADMIN_PASSWORD`, `ADMIN_SECRET`, `PUBLIC_ORIGIN_*` | Yes — all of them |
| **nooklean** | `NEXT_PUBLIC_API_ORIGIN` | No |
| **lopoti** | `NEXT_PUBLIC_API_ORIGIN` | No |

That asymmetry is the whole security design: one app holds everything worth
stealing, and it is the one nobody but your friend can open.

## Changing the password later

See [`recipes/change-the-password.md`](recipes/change-the-password.md). It is the
same procedure as Step 2, plus a redeploy — environment variables only take
effect on a new deployment.
