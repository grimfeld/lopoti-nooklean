# Contract and quote templates

The owner's real Word documents, kept as **reference material**. No code reads
these — they are here so the wording of the quote pages and contracts can be
kept faithful to what he actually sends clients today.

| File | What it is |
| --- | --- |
| `NOOKLEAN - MODELE CONTRAT ENTRETIEN PARTIES COMMUNES.docx` | Template contract for regular cleaning of shared areas |
| `NOOKLEAN - MODELE DEVIS NETTOYAGE VITRES.docx` | Template quote for window cleaning |
| `CLIENT - ADRESSE - DEVIS VITRES.docx` | A filled-in window-cleaning quote, client details redacted |
| `Xxxxx - LES JARDINS xxxx - CONTRAT NETTOYAGE - xxx.docx` | A filled-in cleaning contract; the `xxx` are redactions |

The two filled-in examples are more useful than the blank templates: they show
which clauses actually get used and how prices are phrased in practice.

## Why they are here and not in an app

They are source material, not assets. Nothing serves them to a visitor, and they
should never be added to an app's `public/` directory — a client's contract is not
something to publish by accident.

## How they are used

When building or changing the customer-facing quote page
(`/devis/[token]`), read the relevant template first and match its structure and
language. The quote page is meant to be the same document in a better medium, not
a reinvention of it.

If a template changes, replace the file here and say so in the pull request, so
whoever next edits the quote page works from the current wording.
