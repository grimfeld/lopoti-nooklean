# Contract and quote templates

> **These files are deliberately NOT in this repository.** It is public, and they
> are a real client's cleaning contract and a filled-in quote. They are
> gitignored (`docs/templates/*.docx`) and live on the owner's machine only.
>
> Working copy: `../lopoti-nooklean-private-templates/`, alongside the checkout.

The owner's real Word documents, used as **reference material** when building the
customer-facing quote page. No code reads them.

| File | What it is |
| --- | --- |
| `NOOKLEAN - MODELE CONTRAT ENTRETIEN PARTIES COMMUNES.docx` | Template contract for regular cleaning of shared areas |
| `NOOKLEAN - MODELE DEVIS NETTOYAGE VITRES.docx` | Template quote for window cleaning |
| `CLIENT - ADRESSE - DEVIS VITRES.docx` | A filled-in window-cleaning quote |
| `Xxxxx - LES JARDINS xxxx - CONTRAT NETTOYAGE - xxx.docx` | A filled-in cleaning contract |

The two filled-in examples are the more useful pair: they show which clauses
actually get used and how prices are phrased in practice.

## Why they are not committed

A client's contract is not ours to publish, and a public repository publishes
permanently — removing a file later does not remove it from the history that
people have already cloned. They were committed once and purged; do not add them
back.

They must also never be placed in an app's `public/` directory, which would serve
them to anyone who guessed the URL.

## How they are used

When building or changing the customer-facing quote page
(`/devis/[token]`), read the relevant template first and match its structure and
language. The quote page is meant to be the same document in a better medium, not
a reinvention of it.

If a template changes, replace the file here and say so in the pull request, so
whoever next edits the quote page works from the current wording.
