# Recipes

Step-by-step instructions for the things you will actually want to change.

**How to use these:** open your AI assistant in this project and say, for example:

> Follow `docs/recipes/change-a-service.md` — I want to rename "Balade &
> promenade" to "Promenade en ville".

The recipe tells the AI exactly which files to touch and what not to break, so
you get the same result every time instead of a fresh improvisation.

## Changing what the websites say

| I want to… | Recipe |
| --- | --- |
| Change a service's name or description | [`change-a-service.md`](change-a-service.md) |
| Add or remove a service | [`add-a-service.md`](add-a-service.md) |
| Change prices | [`change-prices.md`](change-prices.md) |
| Change text on a page | [`edit-page-text.md`](edit-page-text.md) |
| Add or replace a photo | [`add-a-photo.md`](add-a-photo.md) |
| Change the contact email or phone number | [`change-contact-details.md`](change-contact-details.md) |

## Running the business

| I want to… | Recipe |
| --- | --- |
| See and manage incoming requests | [`use-the-back-office.md`](use-the-back-office.md) |
| Send a quote to a customer | [`send-a-quote.md`](send-a-quote.md) |

## When something is wrong

| I want to… | Recipe |
| --- | --- |
| Undo a change that broke a website | [`roll-back.md`](roll-back.md) |
| Work out why a website is broken | [`something-is-broken.md`](something-is-broken.md) |
| Change the back-office password | [`change-the-password.md`](change-the-password.md) |

## Later, when you are ready

| I want to… | Recipe |
| --- | --- |
| Use a real domain name instead of the Vercel address | [`add-a-domain.md`](add-a-domain.md) |

---

## The two rules that matter

**1. Some things are edited in the back office, not in the code.**

Service lists, prices, zones and team bios are all editable from the back office
and take effect immediately, with no deploy. If a recipe sends you to the back
office, do not let an AI edit code instead — a price written into the code stops
matching the one on the website.

**2. Every code change goes through a preview first.**

Your AI opens a pull request. Automated checks run. You click the preview link,
look at the website, and merge only if it looks right. Nothing reaches the real
websites until you press merge — so you can always say no.
