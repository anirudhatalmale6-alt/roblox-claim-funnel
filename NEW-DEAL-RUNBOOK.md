# New Deal Runbook

How to stand up a complete lead funnel for a new case type — site, lead
delivery, tracking, and a live Whop campaign.

Written for a non-technical person. You do not need to understand the code.
Where you need to change something, the exact file and line is given.

The Roblox funnel is used as the worked example throughout, because it is
live and working and you can compare against it at any point.

**Realistic time: 2–3 hours for your first one, under an hour once you have
done it twice.** The first Roblox launch took far longer than that, and
Section 8 is where most of those hours went.

---

## 0. What you are building

Five pieces that have to agree with each other:

| Piece | What it does |
|---|---|
| The site | Asks the visitor 14 questions, screens out people who don't qualify, collects contact details and consent |
| Google Sheet + Apps Script | Receives every lead, writes a row, emails you |
| TrustedForm | Records proof of what the visitor saw and agreed to |
| Whop pixel | Tells the ad platform when someone completes the form |
| Whop campaign | Buys the traffic |

If any one of them is misconfigured the other four still *look* fine. That
is the thing to keep in mind the whole way through, and it is what Section 7
exists to catch.

---

## 1. Copy the site

Take a copy of the whole Roblox folder and rename it for the new deal.
Everything below is a find-and-replace job in the copy.

### 1a. The config block

Open `index.html`. Near the top of the script section (around **line 558**)
there is a block of settings, each with a comment above it explaining what it
does. These are the only lines in that file you need to touch:

| Setting | Around line | What to put |
|---|---|---|
| `ENDPOINT` | 558 | The `/exec` URL from Section 2. **Leave empty until Section 2 is done.** |
| `LEAD_SECRET` | 566 | A random password. Must match the Apps Script exactly. |
| `FIRM_NAME` | 570 | The firm actually receiving the leads |
| `EXCLUDED_STATES` | 573 | Two-letter states you cannot accept. Roblox uses `['LA','CO','CA','FL']` |

Also change:

- **`OPERATOR`** (around line 1049) — the company that runs the *site*. On
  Roblox this is `Legal Advocate Group`. The consent sentence names both the
  operator and the firm, and de-duplicates them if they are the same company.
  Leave that logic alone; just set the two names.
- **Phone number** — appears around **line 175** (header) and **line 534**
  (footer). Currently `(848) 863-6987`.
- **Business address** — footer, around line 534.

### 1b. The questions

The 14 questions and their screen-out rules live further down `index.html`.
Each question is a block, and each answer that disqualifies is marked in the
code. **This part genuinely needs someone comfortable editing HTML** — it is
the one section where a careless edit breaks the funnel silently.

If you want a new case type's questions written properly, send me the intake
criteria (what makes a claim qualify, what kills it) and I will do the
question set. That is the part worth handing to me rather than fighting with.

### 1c. The legal pages

`privacy.html`, `terms.html` and `disclaimer.html` each carry the firm name,
address and phone. Update all three. **The privacy policy also contains the
opt-out contact** — that has to be a real, monitored address or you have a
compliance problem, not just a typo.

### 1d. Do not touch

- The `submitLead` function and its 8-second timeout
- The TrustedForm loader in the `<head>`
- The hidden `xxTrustedFormCertUrl` field
- `pixel.js` apart from the two IDs in Section 5

These are the parts that took the longest to get right and none of them vary
per deal.

---

## 2. Lead delivery (Google Sheet + Apps Script)

### 2a. Create it

1. New Google Sheet. Name it something like "Roblox Leads".
2. **Extensions → Apps Script.**
3. Delete whatever is in the editor.
4. Paste the entire contents of `RobloxClaimAdvocate-LeadHandler.gs`.

### 2b. Set two values

| Setting | Line | What to put |
|---|---|---|
| `NOTIFY_EMAIL` | 38 | Where lead alert emails go. It ships as `CHANGE_ME@example.com` — **it will not email anyone until you change this.** |
| `LEAD_SECRET` | 45 | The same random password you put in `index.html`. Character for character. |

Leave `SHEET_NAME` as `Leads`. Leave `FIRM_ENDPOINT` empty unless you are
forwarding leads straight into a firm's system.

### 2c. Deploy it — read this part twice

1. **Press Ctrl+S first.** ⚠️ See the warning below.
2. **Deploy → New deployment.**
3. Type: **Web app**.
4. Execute as: **Me**.
5. Who has access: **Anyone**. (It will not work otherwise. This is safe —
   the address only accepts submissions, it cannot be used to read your
   leads back out.)
6. Deploy, approve the permissions prompt.
7. Copy the URL it gives you. It looks like
   `https://script.google.com/macros/s/AKfy...long.../exec`
8. Paste it into `ENDPOINT` in `index.html` (Section 1a).

> ### ⚠️ The trap that cost us three rounds
>
> **Apps Script has three states, not two: on screen → saved → deployed.**
>
> "New version" publishes the last *saved* file. If you paste code and deploy
> without saving first, it deploys the **old** code — and tells you
> "Deployment successfully updated". Success message, old code, no warning.
>
> Every time you change the script afterwards:
> **Ctrl+S → Deploy → Manage deployments → pencil icon → Version: New version → Deploy.**
> That keeps the same URL, so nothing else needs changing.
>
> Also: if **Manage deployments** lists more than one deployment, only the one
> whose URL is in `index.html` matters. Editing any other row changes nothing
> and reports success.

### 2d. Prove it works

Do not skip this. Open the live site, complete the funnel with fake details,
and confirm **both**:

- a row appears in the sheet, and
- the notification email arrives.

If the row appears but no email, `NOTIFY_EMAIL` is still the placeholder.

---

## 3. Domain and hosting

The site is hosted free on GitHub Pages.

1. Create a new repository, upload the site files.
2. **Settings → Pages →** set source to the main branch.
3. The `CNAME` file in the folder holds the domain — one line, no `https://`,
   no trailing slash. Roblox's reads `robloxclaimadvocate.com`.
4. At the domain registrar, point the domain at GitHub Pages
   (A records to GitHub's four IPs, or a CNAME for a subdomain).
5. Back in Settings → Pages, tick **Enforce HTTPS** once it offers to.

Timing: changes to the site appear about **40 seconds** after upload. New DNS
can take up to an hour. If the domain shows a certificate warning at first,
that is normal — it clears once the certificate issues.

Keep the empty `.nojekyll` file. It stops GitHub mangling the folder.

---

## 4. TrustedForm

Already built into the page. **There is nothing to configure and no account
key to paste** — the snippet is identical for every publisher. Your buyer
claims the certificate with their own key.

Just confirm it is working: after a test submission, the sheet row should have
a `xxTrustedFormCertUrl` column containing a URL like
`https://cert.trustedform.com/abc123...`

**A blank certificate column means the script did not load.** The lead still
saves — that is deliberate, losing a lead is worse than losing a certificate —
so the blank column is your only warning. Check it after the first real lead.

---

## 5. Whop pixel

Open `pixel.js`:

| Setting | Line | What to put |
|---|---|---|
| `WHOP_BIZ_ID` | 20 | Your Whop business ID |
| `FB_PIXEL_ID` | 23 | A Meta pixel ID, if you have one. Optional — leave empty to skip. |

Your Whop business ID is in the dashboard URL:
`whop.com/dashboard/`**`biz_j32p4qTUuisYPg`**`/ads/...`

**Verifying the pixel:** Whop's verification panel only goes green when
*someone completes the funnel while it is watching*. Somebody on your team has
to walk the whole 14 questions through to the thank-you screen. Testing from
another machine does not satisfy it.

---

## 6. The Whop campaign

### 6a. Before you start — the Facebook page

Every ad runs from a Facebook page, including on Whop. Three things to know:

- **A blocked or restricted page cannot run ads at all**, and this looks
  exactly like a permissions problem from inside the tools — an empty picker
  with no explanation. Check the page's standing *first*.
- Adding a page to a business portfolio needs **full control**, not task
  access. Task access is not enough and the error does not make that obvious.
- If the page is unusable, **let Whop create a fresh one.** That is what we
  ended up doing for Roblox and it was the right call.

### 6b. Campaign step

- Objective: **Leads**
- Special ad category: **None** — this only applies to credit, employment and
  housing. Legal claims are not a special category.
- Budget: start low. Roblox launched at $30/day.

### 6c. Ad group step — the two settings that matter

| Setting | Set it to | Why |
|---|---|---|
| **Lead location** | **Website** | 🔴 The single most important setting on this page |
| Conversion event | **Lead** | Optimises for people who finish the form, not people who click |
| Targeting | Country, age range | |

> ### 🔴 Lead location — read this
>
> It defaults to **"Website and instant forms"**. That is wrong for us, and it
> is what blocks the launch with **"Lead Form Not Configured"**.
>
> Pick **"Website"** — the third option, on its own.
>
> **Do not accept the instant form Whop offers to create.** A Meta instant form
> collects the lead *inside Facebook*. The visitor never reaches your site,
> which means no qualifying questions, no row in your sheet, and **no
> TrustedForm certificate** — the exact thing your buyer is paying for. It is
> the convenient-looking button that quietly removes the product.

**Settings are per ad group.** If you have three ad groups, you set Lead
location three times. There is an "Apply these settings to all ad groups"
button — avoid it, it copies targeting too and will flatten different age
ranges into each other.

### 6d. Ad step

Every field here is required:

- Creative (image or video)
- Primary text
- Headline
- **Destination URL** — your funnel, e.g. `https://robloxclaimadvocate.com/`
- Call to action — "Learn More" works well
- Facebook page

Whop appends its own tracking parameters to the URL automatically
(`utm_source`, `wacid`, `waid` and others). You do not add these. They are
captured into the sheet so you can see which ad produced which lead.

### 6e. Launch

The header shows **"1/1 ready"** when everything is complete. If it says
**0/1** or **0/2**, something is incomplete — most often an **ad group with no
ad in it**, which shows a red "No ads created".

---

## 7. Pre-flight checklist

**Run every one of these before you spend a penny.** A funnel that drops every
lead looks identical to one that works — the visitor still sees a thank-you
screen.

- [ ] **`ENDPOINT` in `index.html` is not empty.** 🔴 The expensive one. An
      empty endpoint means every lead shows a thank-you screen and vanishes,
      and you find out days later when you go looking for leads.
- [ ] Completed the funnel yourself on the live domain, start to finish
- [ ] A row appeared in the sheet
- [ ] The notification email arrived
- [ ] The `xxTrustedFormCertUrl` column has a certificate URL in it
- [ ] Deleted every test row before going live
- [ ] Consent wording names the correct firm, and does not name it twice
- [ ] Phone number is correct in the header, footer and legal pages
- [ ] Opt-out contact in `privacy.html` is a real monitored address
- [ ] Destination URL in the ad matches the live site
- [ ] Budget is what you intended
- [ ] Lead location is **Website** on **every** ad group

---

## 8. Troubleshooting

Everything below actually happened on the Roblox build.

| What you see | What it means | Fix |
|---|---|---|
| **"Lead Form Not Configured"** on launch | An ad group has Lead location on "Website and instant forms" | Section 6c. Check **every** ad group — one wrong group blocks the whole campaign |
| Instant form field still there after fixing it | You fixed a *different* ad group, or the page is showing stale state | Refresh the page (F5) first. Then check the group your ad actually sits under |
| **"0/1 ready"** / **"No ads created"** | An ad group has no creative in it | Add an ad, or delete the empty group |
| **"Could not load instant forms for this page"** | Whop cannot reach the Facebook page | Usually resolves itself. If it changes to "No instant forms found on this page yet", the page connection is now healthy |
| Facebook page missing from every picker | The page may be **blocked**, not hidden | Check `facebook.com/accountquality`. A blocked page cannot run ads at all |
| "Only people with full control can add this page" | Task access is not enough | The page owner must grant full control, or let Whop create a fresh page |
| Submit button stuck on **"Sending…"** | Fixed in the current code — the 8-second timeout handles it | If it comes back, the endpoint is unreachable. Check `ENDPOINT` |
| Leads not arriving, visitors see thank-you screen | `ENDPOINT` empty or wrong | Section 2. This is silent — nothing errors |
| Leads arrive, no emails | `NOTIFY_EMAIL` still `CHANGE_ME@example.com` | Line 38, then **save and redeploy** |
| Changed the script, nothing changed | You saved but did not deploy, or deployed without saving | Section 2c |
| Everything rejected after adding the password | `LEAD_SECRET` differs between `index.html` and the script | They must match exactly. Visitors still see a thank-you screen, so this fails silently |
| `xxTrustedFormCertUrl` column blank | TrustedForm did not load | Check the snippet is still in the `<head>` |
| Whop pixel: "Lead event was not collected" | Nobody has completed the funnel while Whop was watching | Walk the funnel yourself with the verification panel open |

### Things that look broken but are not

- **Whop's welcome tour** shows example figures — Spend $2.54, Clicks 18,
  Results 1. Those are not your numbers. Your real spend is on the dashboard
  behind the popup.
- **Day one performance is the worst it will ever be.** A fresh pixel has no
  data, so early leads are expensive. Do not judge a campaign on its first day.
- **Ads sitting in review overnight** is normal, especially for legal and
  injury. If it is rejected, the policy they name tells you whether it is the
  creative, the landing page or the wording — three different fixes.

---

## 9. Quick reference — what changes per deal

| Thing | Where |
|---|---|
| Firm receiving leads | `FIRM_NAME`, `index.html` line ~570 |
| Company operating the site | `OPERATOR`, `index.html` line ~1049 |
| Lead destination | `ENDPOINT`, `index.html` line ~558 |
| Shared password | `LEAD_SECRET` — `index.html` ~566 **and** script line 45 |
| Excluded states | `EXCLUDED_STATES`, `index.html` line ~573 |
| Phone number | `index.html` lines ~175 and ~534, plus the three legal pages |
| Alert email | `NOTIFY_EMAIL`, script line 38 |
| Domain | `CNAME` file |
| Whop business ID | `WHOP_BIZ_ID`, `pixel.js` line 20 |
| The 14 questions | `index.html` — send me the intake criteria instead |

---

## 10. When to call me

Worth doing yourselves: a new deal that follows this pattern closely.

Worth sending to me instead:

- A new question set with different qualifying logic
- Anything involving forwarding leads directly into a firm's system
  (`FIRM_ENDPOINT`)
- An ad rejection you cannot interpret — send the **exact wording**
- Clicks arriving with zero leads. Tell me straight away rather than letting
  it run; that pattern means something broke between the ad and the sheet,
  and it burns budget while it does.
