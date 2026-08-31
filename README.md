# Groupe ROGUE — Static Prototype

Bilingual static site (FR default / EN at `/en/`). No build step required — pure HTML/CSS/JS.

---

## Stack

- **Frontend:** Static HTML + CSS custom properties + vanilla JS
- **i18n:** Cookie-based (`rogue_lang`) + `data-i18n` attribute DOM hydration
- **Payments:** Stripe Checkout (serverless API routes)
- **Memberships:** Kajabi (provisioned via Stripe webhook)
- **Forms:** Zapier webhook (candidature + contact)
- **Hosting:** Vercel (recommended) or Netlify

---

## Local development

No build step needed. Open any `.html` file directly, or serve with:

```bash
npx serve .
# → http://localhost:3000
```

For API routes (Stripe checkout), use Vercel CLI:

```bash
npm i -g vercel
vercel dev
# → http://localhost:3000 with /api/* routes active
```

---

## Deployment

### Vercel (recommended)

```bash
vercel --prod
```

Set all environment variables in Vercel Dashboard → Project → Settings → Environment Variables (copy from `.env.example`).

### Netlify

```bash
netlify deploy --prod --dir .
```

Place API files in `netlify/functions/` and update fetch URLs in `checkout.js` accordingly.

---

## Stripe setup

### 1. Create products

In **Stripe Dashboard → Products**, create:

| Product | Price | Mode | Metadata |
|---|---|---|---|
| La Cellule (mensuel) | $97 CAD / month | subscription | `membership: cellule` |
| La Cellule (annuel) | $970 CAD / year | subscription | `membership: cellule` |
| La Guilde (mensuel) | $197 CAD / month | subscription | `membership: guilde` |
| La Guilde (annuel) | $1970 CAD / year | subscription | `membership: guilde` |
| Le Sanctuaire | $4997 CAD | payment | `membership: sanctuaire` |
| Rogue File STRUC-01 | $197 CAD | payment | `rf: struc-01` |
| Rogue File TRAJ-02 | $197 CAD | payment | `rf: traj-02` |
| Rogue File ECO-01 | $197 CAD | payment | `rf: eco-01` |
| Rogue File FUTU-01 | $197 CAD | payment | `rf: futu-01` |

Copy each **Price ID** (`price_xxx`) into `.env`.

### 2. Configure webhook

1. Stripe Dashboard → Developers → Webhooks → **Add endpoint**
2. URL: `https://your-domain.com/api/webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the **Signing secret** (`whsec_xxx`) → `STRIPE_WEBHOOK_SECRET` in `.env`

### 3. Test mode

Use `pk_test_` / `sk_test_` keys during development. Test card: `4242 4242 4242 4242`.

---

## Kajabi setup

### 1. Create offers

In **Kajabi → Products → Offers**, create one offer per membership tier:

| Offer | Code (set manually) | Products included |
|---|---|---|
| La Cellule | `cellule-rogue` | Portail Cellule |
| La Guilde | `la-guilde-rogue` | Portail Guilde + Cellule |
| Le Sanctuaire | `sanctuaire-rogue` | All portals + Sanctuaire |
| RF STRUC-01 | `rf-struc-01` | Rogue File STRUC-01 |
| RF TRAJ-02 | `rf-traj-02` | Rogue File TRAJ-02 |
| RF ECO-01 | `rf-eco-01` | Rogue File ECO-01 |
| RF FUTU-01 | `rf-futu-01` | Rogue File FUTU-01 |

### 2. Tags

Create these tags in **Kajabi → People → Tags**:

`membre`, `cellule`, `guilde`, `sanctuaire`, `rogue-file`, `structures`, `trajectoires`, `ecosystemes`, `futurs`, `mensuel`, `annuel`

### 3. Automations

In **Kajabi → Automations**, create:

1. **Tag: cellule** → Send welcome email "Bienvenue dans La Cellule"
2. **Tag: guilde** → Send welcome email "Bienvenue dans La Guilde" + enroll in onboarding sequence
3. **Tag: sanctuaire** → Send welcome email "Bienvenue au Sanctuaire" + assign personal onboarding
4. **Tag: rogue-file** → Send delivery email with portal access link
5. **Offer revoked** → Send offboarding email + remove all member tags

### 4. API credentials

**Kajabi → Settings → Integrations → API** → copy API Key and Site ID to `.env`.

---

## Affiliation program

Affiliate links use a `?ref=` URL parameter:

```
https://grouperogue.com/?ref=AFFILIATE_CODE
```

The `i18n.js` script reads this parameter on page load, writes it to a `rogue_ref` cookie (30-day expiry), and `create-checkout-session.js` passes it as `metadata.affiliate_id` to every Stripe session.

Track conversions in Stripe Dashboard → Reports → filter by metadata key `affiliate_id`.

For automated commission calculation, add a Zapier step in the `checkout.session.completed` flow to log the `affiliate_id` and amount to a Notion database or spreadsheet.

---

## i18n system

### How it works

1. `i18n.js` reads the `rogue_lang` cookie (defaults to `fr`)
2. Fetches `assets/js/i18n/{lang}.json`
3. Walks DOM: `[data-i18n]` → `textContent`, `[data-i18n-html]` → `innerHTML`
4. Language switcher buttons update the cookie and redirect to the FR/EN equivalent URL

### Adding a new page

1. Create `new-page/index.html` (FR) and `en/new-page/index.html` (EN)
2. Set correct `data-i18n-root` on `<html>` (count slashes to root)
3. Add URL mapping in `assets/js/i18n.js` URL_MAP table
4. Add all text keys to both `fr.json` and `en.json`

### Adding a new Rogue

1. Duplicate an existing Rogue profile folder (e.g. `rogues/karim-mansour/`)
2. Update slug, vector color, name, bio, interventions
3. Duplicate the EN equivalent in `en/rogues/`
4. Add card to `rogues/index.html` and `en/rogues/index.html` grids
5. Add all `rogue.[new-slug].*` keys to both JSON files

---

## Placeholder checklist

Before going live, replace all placeholder content:

- [ ] `assets/css/tokens.css` — verify all color tokens match final brand palette
- [ ] Each `rogues/[slug]/index.html` — replace `.profile-photo-placeholder` with `<img>` + `class="grayscale"`
- [ ] `index.html` — replace testimonial placeholder names/quotes with real client quotes
- [ ] `index.html` — replace stat counter values (87, 94, 312) with real figures
- [ ] `memberships/index.html` — verify all prices match Stripe product prices
- [ ] `boutique/index.html` — replace Rogue File descriptions with final editorial
- [ ] `contact/index.html` — replace info sidebar email/social links with real accounts
- [ ] All HTML `<meta name="description">` tags — verify against final SEO strategy
- [ ] `assets/js/checkout.js` — replace `YOUR_PUBLISHABLE_KEY` with `STRIPE_PUBLISHABLE_KEY`
- [ ] `rogueship/index.html` — replace Zapier URL placeholder with real webhook URL
- [ ] `contact/index.html` — replace Zapier URL placeholder with real webhook URL
- [ ] `.env` — fill all values (never commit to git)

---

## File structure

```
rogue/
├── assets/
│   ├── css/
│   │   ├── tokens.css
│   │   ├── global.css
│   │   └── components/
│   │       ├── nav.css
│   │       ├── btn-cta.css
│   │       ├── badge-vecteur.css
│   │       ├── card-rogue.css
│   │       ├── tuile-secteur.css
│   │       ├── card-rogue-file.css
│   │       ├── triptyque.css
│   │       ├── stat-ops.css
│   │       ├── forms.css
│   │       └── footer.css
│   └── js/
│       ├── i18n/
│       │   ├── fr.json
│       │   └── en.json
│       ├── i18n.js
│       ├── filters.js
│       ├── counter.js
│       └── checkout.js
├── api/
│   ├── create-checkout-session.js
│   └── webhook.js
├── index.html                  ← FR homepage
├── mouvement/index.html
├── rogues/
│   ├── index.html
│   ├── karim-mansour/index.html
│   ├── nadia-tremblay/index.html
│   ├── olivier-brisson/index.html
│   ├── sonia-leblanc/index.html
│   ├── marco-pietri/index.html
│   └── yasmine-harrak/index.html
├── memberships/index.html
├── boutique/index.html
├── rogueship/index.html
├── contact/index.html
├── merci/index.html
├── en/                         ← EN mirror
│   ├── index.html
│   ├── movement/index.html
│   ├── rogues/
│   │   ├── index.html
│   │   └── [6 profile folders]
│   ├── memberships/index.html
│   ├── boutique/index.html
│   ├── rogueship/index.html
│   ├── contact/index.html
│   └── merci/index.html
├── .env.example
└── README.md
```
