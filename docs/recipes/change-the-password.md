# Change the back-office password

There is one shared password for the back office. It cannot be recovered — only
replaced — so if you have forgotten it, this is the same procedure.

Changing it logs out everyone, including you, on every device.

## Steps

1. Choose a new password. A **passphrase** is both stronger and easier: four
   unrelated words, like `ascenseur-girafe-mardi-pluie`. Minimum twelve
   characters. Do not reuse a password from anywhere else — this one guards every
   customer's name, address and phone number.

2. Go to [vercel.com](https://vercel.com) and open the **admin** project.

3. **Settings** → **Environment Variables**.

4. Find `ADMIN_PASSWORD`. Click the **⋯** menu on its row, then **Edit**.

5. Replace the value. Leave the environments (Production, Preview, Development)
   ticked as they are.

6. Click **Save**.

7. **The change is not live yet.** Environment variables only apply to a new
   deployment. Go to **Deployments**, open the most recent one, click the **⋯**
   menu and choose **Redeploy**. Confirm.

8. Wait about a minute, then open the back office and log in with the new
   password.

## Storing it

Put it in a password manager, or write it on paper somewhere only you can reach.
There is no "forgot password" email — it is a single shared secret, which is why
it is simple, and why losing it means repeating this procedure.

## If you are locked out

Nothing is lost. Customer requests are in the database, untouched by any of this.
Follow the steps above to set a new password, and you are back in.

## Who should know it

As few people as possible. Anyone with it can read every customer's contact
details and change every booking. If someone who knew it no longer needs it,
change it.

## If you think someone has it who should not

Change it immediately, following the steps above. Then tell whoever maintains the
site, so they can check the request list for anything that looks altered.

## A note on attempts

Repeated wrong guesses are throttled — after several failures in a row, that
visitor has to wait a few minutes. So a forgotten-password fumble may briefly
lock you out too. Wait five minutes and try again; nothing is broken.
