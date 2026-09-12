# Send a quote to a customer

**Nothing is ever sent automatically.** You write the quote, you read it, you
press send in your own email program. That is deliberate: a quote with the wrong
price cannot be unsent.

## Steps

1. Open the back office and log in.
2. Switch to the right business at the top.
3. Click the request in the list.
4. Click **Préparer un devis**.

The form is pre-filled with what the customer told you — service, addresses,
mailbox counts, the dates they asked for — so you are adding the commercial terms
rather than retyping their details.

5. Fill in:

   | Field | Notes |
   | --- | --- |
   | **Référence** | Pre-filled, e.g. `NOOK-2026-001`. Change it if you number quotes your own way. |
   | **Montant** | Free text, so write it how you mean it: `480 € HT / mois`, or `à partir de 1 200 €`. |
   | **Valable jusqu'au** | Defaults to thirty days out. |
   | **Prestations incluses** | What you will actually do. The most important field — this is what you are agreeing to. |
   | **Conditions particulières** | Anything specific: access, a technical visit, equipment. |
   | **Message** | The note the customer reads first. |

6. Click **Voir l'aperçu client** to see exactly what they will see. Read it
   properly — this is the last check before it leaves.

7. Click **Valider et préparer l'e-mail**.

8. Your email program opens with the customer's address, a subject line and a
   short message containing a link to the quote. **Read it, then press send
   yourself.**

## What the customer receives

A short email with a link. The link opens the quote as a proper page with your
branding, which they can read on a phone and print or save as PDF.

The link is long and unguessable, and the page is hidden from search engines. Only
someone with the link can open it.

## Saving a draft

**Enregistrer le brouillon** keeps your work without preparing an email. The
request shows as **Brouillon** so you can tell at a glance which quotes are
half-written.

## After sending

Mark the request **Confirmée** once the customer accepts. That is what books the
time on your calendar — across both businesses, so you cannot be booked twice.

Sending a quote does **not** book the time. Until you confirm, that slot is still
available to anyone.

## Changing a quote after sending

Edit it and prepare the email again. The link stays the same, so the customer sees
the updated version at the same address.

If they have already agreed to the old terms, say what changed rather than
quietly editing it — the page they bookmarked will have changed underneath them.

## Later: sending from the system itself

Quotes could be emailed by the system rather than by you, with a record of what
was sent and when. That was deliberately left for later
(`docs/decisions.md`, *Deliberately deferred*) because automatic sending is the
one mistake that reaches a customer irreversibly. If you are sending several
quotes a week and the manual step is slowing you down, that is the moment to
revisit it.
