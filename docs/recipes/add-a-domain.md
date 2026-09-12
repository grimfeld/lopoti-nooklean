# Use a real domain name

Right now the websites live at addresses Vercel provides, ending in
`.vercel.app`. They work perfectly, but they do not look like a real business.

This is the one-time job of pointing your own domain at them. Nothing in the code
has to change in any meaningful way.

## Before you start

Decide what you want. Two sensible shapes:

**One domain, three subdomains** — one registration, one bill:

| Website | Address |
| --- | --- |
| Pet sitting | `lopoti.votredomaine.fr` |
| Cleaning | `nooklean.votredomaine.fr` |
| Back office | `admin.votredomaine.fr` |

**Two domains, one per brand** — stronger branding, two registrations:

| Website | Address |
| --- | --- |
| Pet sitting | `lopoti.fr` |
| Cleaning | `nooklean.fr` |
| Back office | `admin.lopoti.fr` |

The second looks more established to customers. The first is cheaper and simpler.
You can start with the first and move to the second later — the steps are the
same both times.

## Buying the domain

Buy it through Vercel (**Domains** in the dashboard) and the DNS is configured
for you. Slightly more expensive than a specialist registrar, considerably less
to go wrong. For a `.fr` domain, Gandi or OVH are the usual French alternatives.

## Connecting it

For each of the three projects:

1. Open the project on [vercel.com](https://vercel.com).
2. **Settings** → **Domains**.
3. Type the address you want for that project and click **Add**.
4. If you bought through Vercel, it is done. Otherwise Vercel shows the DNS
   records to create at your registrar — copy them exactly.
5. Wait. Usually minutes; occasionally a few hours.

The `.vercel.app` addresses keep working afterwards, so nothing breaks while you
wait.

## The one code change

The back office only accepts requests from addresses it recognises, so the two
public sites' new addresses have to be allowed. Ask your AI:

> We have connected real domains. The pet-sitting site is now at [address], the
> cleaning site at [address], and the back office at [address]. Please update the
> allowed origins and open a pull request.

It is a small change to one configuration value, plus two environment variables
in the `admin` Vercel project. Until it is done, the forms on the new addresses
will report that they cannot reach the server — the sites will look fine but
submissions will fail, so do this straight away rather than later.

## Email addresses

A domain also lets you have `bonjour@votredomaine.fr` instead of a personal Gmail
address. That is separate from the websites and needs an email provider — Vercel
does not do email. Worth doing, but it is its own job.

## Afterwards

Update anything that points at the old addresses: business cards, Google Business
profile, social media, your email signature, and your own bookmarks.
