# Change prices

**Do this in the back office, not in the code.** Prices take effect immediately,
with no deploy and no pull request.

If an AI offers to change a price by editing code, say no and point it at this
file. A price written into the code will stop matching the one the back office
shows, and then nobody knows which is real.

## Cleaning price estimates (Nooklean)

The cleaning site can show visitors an estimated monthly range, worked out from
the postal code and the number of mailboxes. The rates behind it are yours to set.

1. Open the back office and log in.
2. Switch to **Nooklean** using the brand switcher at the top.
3. Go to **Services** → **Tarifs par code postal**.
4. For each postal code, set the low and high euro amount **per mailbox, per
   month**. A range of `18`–`24` on a building with 24 mailboxes shows the
   visitor "432–576 € / mois".
5. Click **Enregistrer**.

Refresh the public site to see the change.

### Turning public estimates off

There is a master switch at the top of that page: **Afficher les estimations sur
le site**. Turn it off and visitors see no numbers at all, while the form keeps
working exactly as before. Use it if a customer ever argues about an estimate —
it takes effect immediately.

### What visitors see

Estimates are always labelled as indicative and confirmed after a visit. Keep it
that way: an estimate presented as a firm price is a commitment you have not
agreed to.

## Pet-sitting prices (Lopoti)

The pet-sitting site deliberately shows **no prices**. Each request is quoted
individually, because the work varies too much — an animal's routine, the
distance, the frequency.

If you decide you want published prices there, that is a real change rather than
a setting. Ask your AI:

> I want to show prices on the Lopoti site. Read `docs/decisions.md` decision 13
> first, then tell me what the options are before changing anything.

## Prices on a quote

The amount on an individual quote is typed when you prepare it, and is not
affected by anything above. See [`send-a-quote.md`](send-a-quote.md).
