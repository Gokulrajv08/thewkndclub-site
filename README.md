# The Wknd Club — website & membership automation

Community events across Chennai · [@thewkndclub_](https://www.instagram.com/thewkndclub_/)

A single-file static site (`index.html`) + a Google Apps Script (`Code.gs`) that gives you:
form → sheet → **you flip a Status dropdown** → applicant gets an automatic email. Total cost: ₹0 (plus a domain, if you want one).

```
Applicant fills form  ──►  Google Sheet row
        │                        │
        ▼                        ▼
 instant "we got it"      you set Status = Approved
      email                      │
                                 ▼
                     automatic welcome email
                     with WhatsApp invite link
```

---

## 1. Put the site on GitHub Pages (~5 minutes)

1. Create a new **public** repo on GitHub, e.g. `thewkndclub-site`.
2. Add `index.html` (and this README) to the repo root and push:
   ```bash
   git init
   git add index.html README.md
   git commit -m "The Wknd Club website"
   git branch -M main
   git remote add origin https://github.com/<your-username>/thewkndclub-site.git
   git push -u origin main
   ```
3. In the repo: **Settings → Pages → Source: Deploy from a branch → Branch: `main` / root → Save.**
4. In a minute or two your site is live at
   `https://<your-username>.github.io/thewkndclub-site/`

Every future `git push` to `main` redeploys automatically.

> Tip: name the repo `<your-username>.github.io` instead and the site lives at
> `https://<your-username>.github.io/` directly.

## 2. Create the Google Form

1. [forms.google.com](https://forms.google.com) → new form, e.g. *"Join The Wknd Club"*.
2. **Critical:** Settings → Responses → turn ON **Collect email addresses**
   (pick *Responder input* or *Verified*). The automation reads this column.
3. Add your questions. Keep one question whose title is exactly **`Name`**
   (or change `NAME_COLUMN_HEADER` in `Code.gs` to match whatever you call it).
4. **Responses tab → Link to Sheets** → create a new spreadsheet.

## 3. Embed the form in the site

1. In the form: **Send → `< >` (embed) tab** → copy only the URL inside `src="..."`.
   It looks like `https://docs.google.com/forms/d/e/XXXX/viewform?embedded=true`.
2. Open `index.html`, find `GOOGLE_FORM_EMBED_URL` near the bottom, paste the URL.
3. Commit & push. Done — until you do this, the site shows a friendly
   "form is almost ready" card instead of a broken frame.

If the embedded form is cut off or too tall, adjust the `height` values in the
`.form-shell iframe` CSS rule.

## 4. Set up the approval column in the Sheet

1. Open the linked response spreadsheet (tab is usually **Form Responses 1**).
2. In the first empty column, put the header **`Status`** (row 1).
3. Select that whole column → **Insert → Dropdown** → options:
   `Pending`, `Approved`, `Rejected` (give them colors — it becomes your review dashboard).

## 5. Install the Apps Script

1. In the spreadsheet: **Extensions → Apps Script**.
2. Delete the placeholder code, paste in the contents of `Code.gs`, and edit the
   `CONFIG` block at the top (WhatsApp link, column names, sheet name).
3. Save, then run the `authorizeOnce` function once (Run ▶) and grant permissions
   when Google asks (it warns because it's your own unverified script — that's normal:
   Advanced → Go to project).
4. Add the two triggers: left sidebar **⏰ Triggers → + Add Trigger**:

   | Function              | Event source     | Event type       |
   |-----------------------|------------------|------------------|
   | `onFormSubmitHandler` | From spreadsheet | **On form submit** |
   | `onEditHandler`       | From spreadsheet | **On edit**        |

5. Test: submit the form yourself → you should get the "we got your application"
   email and see the row appear with Status `Pending`. Flip it to `Approved` →
   welcome email with the WhatsApp link arrives.

Free Gmail accounts can send ~100 automated emails/day via Apps Script — plenty for now.
Check your remaining quota anytime by running `authorizeOnce` (it logs it).

## 6. Customize the site content

Everything lives in `index.html`:

- **Past events** — three cards in the `<section id="events">` block. Swap the emoji
  placeholders for real photos (instructions are in an HTML comment right above them:
  add an `assets/` folder to the repo and reference `assets/event-1.jpg` etc.).
- **Copy** — hero text, ticker words, steps: plain HTML, edit freely.
- **Colors** — all defined once in the `:root` CSS variables, pulled from your logo.
- **Logo** — embedded in the file as base64, so the site works as a single file.

## 7. Custom domain (optional, the only paid part)

1. Buy `thewkndclub.in` / `.com` (Cloudflare Registrar, Namecheap, GoDaddy — ₹700–1,500/yr).
2. Repo **Settings → Pages → Custom domain** → enter the domain.
3. At your registrar, add the DNS records GitHub shows you
   (a `CNAME` for `www` pointing to `<your-username>.github.io`, plus 4 `A` records
   for the apex — GitHub's Pages docs list the exact IPs).
4. Back in GitHub Pages settings, tick **Enforce HTTPS** once DNS propagates.

## Troubleshooting

- **No auto-reply email** → "Collect email addresses" wasn't on, or the
  `onFormSubmitHandler` trigger isn't installed, or check Apps Script → Executions for errors.
- **Approval email doesn't fire** → the trigger must be **installable** (added via the
  Triggers page), not the automatic simple `onEdit` — simple triggers can't send email.
  Also confirm `SHEET_NAME` and `STATUS_COLUMN_HEADER` match exactly.
- **Form looks cramped on the site** → tweak the iframe heights in the CSS.
- **Site not updating** → GitHub Pages caches briefly; hard-refresh (Ctrl/Cmd+Shift+R).
