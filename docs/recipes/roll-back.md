# Undo a change that broke a website

**Use this when:** a website looked fine before, a change was merged, and now
something is wrong. Do this first and diagnose afterwards — the websites should
be working while you investigate, not broken.

This takes about one minute and needs no code and no AI.

## What you are doing

Every version of every website is kept. Rolling back means telling Vercel "serve
the previous version again". Nothing is deleted, and you can roll forward again
just as easily.

## Steps

1. Go to [vercel.com](https://vercel.com) and sign in.

2. Open the project that is broken. There are three, and only the broken one
   needs rolling back:

   | Website | Vercel project |
   | --- | --- |
   | The pet-sitting site | `lopoti` |
   | The cleaning site | `nooklean` |
   | The back office | `admin` |

3. Click **Deployments** in the top menu.

4. You will see a list, newest first. The top one is what is live now. Find the
   one below it that was working — the list shows the date and the change
   description.

5. Click the **⋯** menu on the right of that row, then **Promote to Production**.

6. Confirm. Wait about thirty seconds, then reload the website.

## Afterwards

Tell your AI what happened, so the cause gets fixed rather than forgotten:

> I rolled back the `lopoti` project on Vercel because [what was wrong].
> Please find out what caused it and open a pull request with a fix.

## If rolling back does not help

Then the problem is probably not the website code — it may be the database or an
external service. See [`something-is-broken.md`](something-is-broken.md).

## What this does not undo

Rolling back changes the **website code** only. It does not undo:

- Anything you edited in the back office (services, prices, team bios). Change
  those back in the back office itself.
- Customer requests that have arrived. Those are in the database and are safe.
