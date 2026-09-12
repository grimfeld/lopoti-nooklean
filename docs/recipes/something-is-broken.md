# Work out why a website is broken

**Do this second.** If a website is broken right now and was working before,
[roll back first](roll-back.md) — get it working, then find out why.

## Start with the health page

The back office has a page that checks the whole system and answers in plain
French.

1. Open the back office and log in.
2. Go to **État du système**.

It tells you whether the database is reachable, when the last request arrived,
whether the schema is up to date, and whether each public site is responding.

Anything red, copy the whole line and give it to your AI:

> The health page says: [paste the red line]. Please investigate.

## If the health page itself will not load

Then the back office is down, not just unhappy. Work through these in order.

### 1. Is it only you?

Try the site on your phone, on mobile data rather than wifi. If it works there,
the problem is your own connection or browser, not the website.

### 2. Is Vercel having an outage?

Check [vercel-status.com](https://www.vercel-status.com). If Vercel is down,
nothing you do will help — wait, and tell anyone who asks that it is a hosting
outage.

### 3. Did a deployment fail?

1. Go to [vercel.com](https://vercel.com) and open the project.
2. Click **Deployments**.
3. A failed one is marked **Error** in red. Click it, then **Build Logs**.
4. Copy the last twenty lines and give them to your AI:

   > The `admin` deployment failed. Here are the build logs: [paste]

### 4. Is the database asleep or full?

The database (Neon) pauses itself when unused and wakes on the next request, so
the first page load after a quiet night can be slow. If it is consistently
unreachable, open the Neon dashboard from the Vercel project's **Storage** tab
and look for a warning about storage or compute limits.

## Common symptoms

| What you see | Usually means |
| --- | --- |
| A form says "Impossible de joindre le serveur" | The back office is down, or its address changed. Check the `admin` project on Vercel. |
| The back office shows no requests at all, but there should be some | You are looking at the wrong brand. Check the brand switcher at the top. |
| "Ce créneau est déjà confirmé" when confirming | Working as intended: another job is already confirmed at that exact time. Pick another slot or cancel the other one. |
| A price on the site is wrong | It was edited in code instead of the back office. See [`change-prices.md`](change-prices.md). |
| The site looks unstyled, like plain text | A failed deployment served a partial build. Roll back. |

## What to tell your AI

Vague reports produce vague fixes. Include:

1. **Which website** — pet sitting, cleaning, or back office.
2. **What you did** — the exact page and what you clicked.
3. **What you expected**, and **what happened instead**.
4. **Any red text**, copied exactly rather than described.
5. **When it last worked**, if you know.

## What is never lost

Customer requests are in the database, not in the website code. A broken
website, a failed deployment, or a rollback does not touch them. They are still
there when the site comes back.
