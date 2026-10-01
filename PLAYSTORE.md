# Pingo — Google Play listing

Everything below is ready to copy into **Play Console**. Character limits are Play's; every field here is inside them.

---

## 1. Upload

| Item | Value |
|---|---|
| App bundle | `dist/pingo-1.0.0-1.aab` (build with `scripts/build_aab.sh`) |
| Package name | `com.akashpatel.pingo` |
| Version | `1.0.0` (versionCode `1`) — bump both in `app.json` for every new upload |
| App signing | Use **Play App Signing** (Google holds the app key). This bundle is signed with your **upload key**: `~/.pingo/pingo-upload.jks` |
| Upload key SHA-256 | `A1:DD:29:DA:DC:47:A4:95:81:39:E4:94:44:DE:35:41:F3:81:1F:8F:21:69:44:74:EB:EE:37:E8:C5:BC:02:E9` |

> ⚠️ Back up `~/.pingo/` (the `.jks` file **and** `keystore.properties`, which holds its password) somewhere safe — e.g. a password manager. If it's lost, Google can reset the upload key, but it takes days.

**Release name:** `1.0.0`

**Release notes** (`<en-IN>` / `<en-US>`):
```
First release of Pingo 🎉
• Track every subscription, trial and renewal in one place
• Add the date you bought it — we work out the next renewal
• Get an app notification and an email before anything charges
• Pick exactly which days to be reminded
• See your monthly and yearly spend, by category
```

---

## 2. Main store listing

**App name** (30 max)
```
Pingo: Subscription Reminder
```

**Short description** (80 max)
```
Track subscriptions & free trials. Get a ping before anything renews or charges.
```

**Full description** (4000 max)
```
Never get surprise charged again.

Pingo keeps every subscription, free trial and renewal in one place — and pings you before your money dips. Add what you pay for, and Pingo tells you exactly when each one renews, expires or turns from a free trial into a paid plan.

WHY PINGO
• One list for everything: streaming, music, AI tools, cloud storage, gym, domains — anything that charges you again and again.
• Reminders that actually reach you: an app notification on your phone, plus an email backup in case you mute us.
• You choose when: 1, 2, 3 or 7 days before, on the day, or pick any exact date.
• Know what you really spend: your monthly and yearly total, and a breakdown by category.

ADD A SUBSCRIPTION IN SECONDS
• Name, price and currency (₹, $, €, £)
• Type: auto-renew, expires, or free trial
• Billing cycle: monthly, quarterly, yearly, every N days, or one-time
• Purchased on: pick the date you bought it and Pingo works out the next renewal for you — even for plans that started on the 31st
• Optional manage link, category, colour and notes

STAY AHEAD OF CHARGES
• Next 7 days at a glance on the home screen
• Free trials flagged before they start charging
• Past renewals roll forward automatically, so your dates are always current
• Mark a subscription cancelled when you drop it — it stops counting toward your spend

WORKS THE WAY YOU DO
• Sign in with a one-time email code — no passwords
• Works offline: changes save on your phone and sync when you're back
• Export everything as CSV whenever you want
• Large text, screen reader and reduced-motion support

PRIVATE BY DESIGN
• No bank logins, no card numbers, no reading your inbox or SMS
• No ads and no tracking
• Delete your account and all your data anytime from Settings

Pingo only knows what you tell it. Add your subscriptions, pick your reminder days, and let Pingo do the nagging.
```

---

## 3. Graphics

All files are in `store/`.

| Asset | File | Play requirement |
|---|---|---|
| App icon | `store/icon-512.png` | 512 × 512 PNG |
| Feature graphic | `store/feature-graphic-1024x500.png` | 1024 × 500 PNG/JPG |
| Phone screenshots (upload in this order) | `store/screenshot-1.png` … `store/screenshot-7.png` | 2–8 images, 1080 × 1920 (9:16) |

Screenshot order:
1. Home — monthly spend + next 7 days ("never get surprise charged again.")
2. Subscriptions list ("every sub in one place.")
3. Add subscription with purchase date ("add when you bought it. we do the math.")
4. Subscription detail with reminder dates ("pick exactly when we nag you.")
5. Reminder notification ("a ping before your money dips.")
6. Spend by category ("see where it all goes.")
7. Settings ("tune how hard we nag you.")

---

## 4. Store settings

| Field | Value |
|---|---|
| App or game | App |
| Free or paid | Free |
| Category | **Finance** |
| Tags (pick up to 5) | Budgeting, Personal finance, Bill reminders, Productivity, Reminders |
| Contact email | heatmonks.venture@gmail.com |
| Website | https://github.com/akashpatel87654/reminder-app (optional — leave blank if you prefer) |
| Privacy policy URL | https://github.com/akashpatel87654/reminder-app/blob/main/PRIVACY.md |
| Countries | India (add more any time) |

---

## 5. App content (Policy → App content)

### Privacy policy
`https://github.com/akashpatel87654/reminder-app/blob/main/PRIVACY.md`

### App access
Select **"All or some functionality is restricted"** → *Add instructions*:

```
Pingo requires signing in with a one-time code sent to an email address.

Test account
Email: <REVIEW EMAIL>
<HOW THE REVIEWER GETS THE CODE — see note below>

Steps: open the app → swipe through the 3 intro cards (or tap "skip") → enter the email → tap "send magic code" → enter the 6-digit code. You land on the home screen with sample subscriptions already added.
```

> ⚠️ **Needs a decision before submitting.** Play reviewers can't read your inbox, so a plain email-code login will be rejected as "can't access app". Two options:
> 1. **Recommended:** a review account that signs in with a fixed password (the reviewer-only path is hidden behind one specific email). Ask Claude to add it — about 30 minutes, plus a test.
> 2. A dedicated Gmail for reviewers whose password you share here. Weaker: Google often blocks sign-ins from unfamiliar locations, so reviewers may still get stuck.

### Ads
**No, my app does not contain ads.**

### Content rating (IARC questionnaire)
- Category: **Utility, Productivity, Communication, or Other**
- Violence, fear, sexuality, language, controlled substances, crude humour: **No** to all
- Users can interact or exchange content with each other: **No**
- Shares user's location with others: **No**
- Allows users to purchase digital goods: **No**
- Gambling / simulated gambling: **No**
- Expected rating: **Everyone / 3+**

### Target audience and content
- Target age group: **18 and over**
- Appeals to children: **No**

### News app
**No**

### COVID-19 contact tracing / status app
**No**

### Data safety

**Overview**
- Does your app collect or share any of the required user data types? **Yes**
- Is all of the user data collected by your app encrypted in transit? **Yes**
- Do you provide a way for users to request that their data is deleted? **Yes** — in the app (Settings → delete account) and by email
- Delete account URL: `https://github.com/akashpatel87654/reminder-app/blob/main/PRIVACY.md#deleting-your-account-without-the-app`

**Data collected** (none of it is *shared*; none is processed only on-device; collection is **required** for the app to work)

| Data type | Collected | Purposes |
|---|---|---|
| Personal info → **Email address** | Yes | App functionality, Account management |
| Financial info → **Other financial info** (subscription names, prices, dates you enter) | Yes | App functionality |
| App info and performance | No | — |
| Device or other IDs | No | — |
| Location, Contacts, Messages, Photos, Files, Calendar, Health, Web history, Audio | No | — |

**Data shared with third parties:** None. (Supabase and Google only process data on our behalf as service providers, which Play doesn't count as "sharing".)

### Government apps
**No**

### Financial features
**None of the above.** Pingo doesn't provide loans, payments, banking, crypto or trading; it only stores reminders the user types in.

### Health apps
**No**

### Permissions
Pingo asks for **notifications** only (Android 13+ prompt). No sensitive permissions need a declaration. Storage and overlay permissions are blocked in `app.json`.

---

## 6. Testing track before production (recommended)

New personal developer accounts must run a **closed test with at least 12 testers for 14 days** before they can publish to production.

1. Testing → **Closed testing** → create track → upload `dist/pingo-1.0.0-1.aab`.
2. Add testers (a Google Group or a list of Gmail addresses) — at least 12.
3. Share the opt-in link; testers install from Play and keep it for 14 days.
4. Then **Production** → promote the same release → submit for review.

---

## 7. Checklist

- [ ] Developer account verified (identity + $25 fee)
- [ ] App created: name **Pingo: Subscription Reminder**, default language English (India)
- [ ] App access test account added (decide option 1 or 2 above)
- [ ] All *App content* sections completed
- [ ] Store listing: descriptions, icon, feature graphic, 7 screenshots
- [ ] Closed test: 12 testers × 14 days
- [ ] Upload key backed up (`~/.pingo/`)
- [ ] Promote to production → **Send for review**
