# Change text on a page

Headings, paragraphs, button labels — anything that is not a service name or a
price. These live in the code, so the change goes through a preview you approve.

**This is deliberate.** Prose cannot be checked automatically, so a person looks
at it before customers do. Service names and prices are different; those you edit
directly in the back office.

## Steps

1. Find the exact text you want to change. Copy it from the website itself so the
   AI can find it precisely.

2. Tell your AI what you want, with the old and new wording:

   > On the Nooklean homepage, change "Vos parties communes, impeccables." to
   > "Des parties communes impeccables, toute l'année."

   If you only know roughly what you want, say so — ask for two or three options
   rather than guessing at wording yourself.

3. The AI opens a pull request. Automated checks run, about two to three minutes.

4. You get a comment with **three preview links** — one per website. Open the
   relevant one and look at the actual page.

5. Happy: click **Merge**. The real website updates within a minute or two.
   Not happy: say what is wrong and ask for another attempt. Nothing has changed
   for customers yet.

## Getting good results

**Be specific about where.** "Change the heading" is ambiguous on a page with six
headings. "The big heading at the top of the cleaning site's homepage" is not.

**Ask for the whole section if you are unsure.** "Rewrite the three steps in
'Vous réservez. On fait briller.' so they sound less formal" works well — the AI
can see all three and keep them consistent with one another.

**Mention length.** A heading that doubles in length may wrap badly on a phone.
Saying "keep it about the same length" avoids that.

**Check the preview on your phone.** Open the preview link on your phone, not only
your computer. Most visitors are on a phone, and text that fits a wide screen can
break a narrow one.

## Two things to keep

**French stays French.** Both businesses serve French customers. Never let a
"consistency" pass translate anything.

**Do not promise a confirmed booking.** The forms take a *request*, which you
confirm by hand. Copy saying "réservez immédiatement" or "créneau garanti" would
be a promise the system does not make, and an annoyed customer later.

## If a preview looks broken rather than wrong

Blank page, unstyled text, an error message — that is a bug, not a wording
problem. Do not merge. Say:

> The preview is broken: [what you see]. Please fix it before I merge.

The point of the preview is to catch exactly this, before customers see it.
