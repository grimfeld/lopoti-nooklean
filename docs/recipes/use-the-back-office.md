# Use the back office

The back office is where customer requests arrive and where you manage them. One
place for both businesses, with a switcher at the top.

**Address:** the `admin` project's URL on Vercel. Bookmark it.

## Logging in

One shared password. If you have forgotten it, see
[`change-the-password.md`](change-the-password.md) — it cannot be recovered, only
replaced.

You stay logged in for 30 days, and that renews whenever you use it, so in
practice you log in rarely.

## Switching between the businesses

The two buttons at the top — **Lopoti** and **Nooklean** — switch which
business's requests you are looking at.

Two views deliberately ignore the switcher and always show **both**:

- **Calendrier** — because it is your time, and you can only be in one place.
- **État du système** — because it covers everything at once.

## The request list

Newest first. Each row shows when it arrived, what was asked for, who asked, and
how to reach them. Click the email address to write to them.

### Statuses

| Status | Meaning |
| --- | --- |
| **Nouvelle** | Just arrived. Nobody has looked at it. |
| **Confirmée** | You have agreed to do it. **This is what books the time.** |
| **Terminée** | Done. |
| **Annulée** | Not happening. Frees the slot again. |

Change a status with the dropdown in the row. It saves immediately.

### Why "Confirmée" matters

A request is only an enquiry. Marking it **Confirmée** is what claims that time
slot — and it claims it across *both* businesses, because it is the same you.

Two people can ask for Tuesday at 10:00. Both sit there as **Nouvelle** until you
decide. The moment you confirm one, that time disappears from both websites.

If you try to confirm a second job at a time that is already confirmed, you will
see:

> Ce créneau est déjà confirmé pour une autre demande.

That is the system refusing to double-book you. Pick another time, or cancel the
other job first.

## The calendar

Shows every **confirmed** job from both businesses. Enquiries are not shown —
they would fill the calendar with things that may never happen.

Click a job to see its details or move it to another date. There is no
drag-and-drop: you change the date in a field, on purpose, so a job cannot be
moved by an accidental swipe.

## Services and prices

See [`change-prices.md`](change-prices.md) and
[`change-a-service.md`](change-a-service.md). These are edited here, not in the
code, and take effect immediately.

## Quotes

See [`send-a-quote.md`](send-a-quote.md).

## What you cannot break from here

Editing a service, a price or a status cannot break a website. The worst case is
wrong information showing, which you fix by editing it again.

The one thing to be careful about: **deleting** a service that customers are
currently choosing. Existing requests keep the service name they were submitted
with, so nothing is lost — but the option disappears from the form.
