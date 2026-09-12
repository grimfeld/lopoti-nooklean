# Add or remove a service

**Do this in the back office.** It takes effect immediately, with no deploy.

## Adding a service

1. Open the back office and log in.
2. Switch to the right business at the top — **Lopoti** or **Nooklean**.
3. Go to **Services**.
4. Click **+ Ajouter un service**.
5. Fill in the icon, the name and the description.
6. **Lopoti only:** tick which animals it is offered for, using the chips under
   each animal. A service with no animals ticked will not appear anywhere.
7. Click **Enregistrer**.

Reload the public site to check it.

## One service, several animals (Lopoti)

Services are a shared library, and each animal points at the ones it offers. So
"Visite à domicile" can be offered for cats, rabbits and ferrets while existing
only once.

That means **editing it changes it everywhere it appears**. If a visit for a cat
genuinely differs from a visit for a fish, make two services with distinct
descriptions rather than one vague one.

## Removing a service

1. Same page, click **Retirer** on the service.
2. Click **Enregistrer**.

It disappears from the website and from the form. For Lopoti it is also removed
from every animal that offered it.

### What happens to requests for it

Nothing. Requests keep the service name they were submitted with, so your records
stay accurate and nothing vanishes from your list. You simply stop receiving new
ones.

### Before you remove it

If anyone has a **pending** request for that service, deal with them first —
otherwise you are holding an enquiry for something no longer advertised, which is
awkward to explain on the phone.

## Limits

At least one service and, for Lopoti, at least one animal must remain. Saving an
empty catalogue is refused:

> Échec de l'enregistrement (au moins un service et un animal requis).

This is on purpose — an empty catalogue would leave the form with nothing to
choose and the website looking broken.

## When a new service is more than a name

Some services do not fit the existing form. A service needing a photo upload, a
surface area in square metres, or different pricing rules needs a form change,
which is a code change. Ask your AI:

> I want to add a service called [name] to the [brand] site. It needs the
> customer to tell us [what]. The current form does not ask for that. What are
> the options?

Expect a conversation rather than an immediate change — it affects the form, the
database and the back office together.
