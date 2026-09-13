# ANAID Quality Disposables — B2B ordering platform

A trade ordering system for a UK distributor of disposable food-service and
packaging products. One Next.js application with two faces:

- **The customer application** (`src/app/(customer)`) — mobile-first. Browse the
  catalogue, see your own prices, order, track orders.
- **The admin dashboard** (`src/app/(admin)`) — desktop-first. Approve customers,
  manage the catalogue and prices, move orders through the warehouse.

The rule that shapes everything:

> **A customer cannot see any price, and cannot place any order, until an ANAID
> administrator has manually approved their account.**

Not hidden on the screen — never sent. `src/lib/pricing.ts` refuses to price
anything for an unapproved account, and it only accepts a customer object read
from the session, never an id from a request.

The four `LEVEL-*.md` documents are the specification. `DECISIONS.md` answers the
questions the specification leaves open and wins wherever the two disagree.

## What is built

v1 covers phases 1–5 of the Level 4 build order: the foundation, the catalogue,
registration and approval, pricing, and ordering. Stock reservation, credit
limits and the audit log are built too, ahead of their phase, because
retrofitting them is expensive.

Not built yet: invoices and PDFs, payment recording, returns and credit notes,
Buy Again / Quick Order / favourites, promotions, reports, product import and
export, delivery rounds, SMS.

## Running it

```bash
npm install
cp .env.example .env      # then fill in the Neon and session values
npm run db:migrate        # applies migrations over DIRECT_URL
npm run db:seed           # catalogue, pricing levels, settings, staff, demo customers
npm run dev
```

| Script | What it does |
|---|---|
| `npm run dev` | Development server on http://localhost:3000 |
| `npm run build` | `prisma generate` then a production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | Create and apply a migration in development |
| `npm run db:deploy` | Apply existing migrations (what CI and Netlify run) |
| `npm run db:seed` | Seed, safely repeatable |
| `npm run db:studio` | Prisma Studio |
| `node scripts/import-anaid-shop.mjs` | Re-import the catalogue from the live site |

### The catalogue

The 136 products, 63 categories, pack sizes, materials and photography are
ANAID's own, imported from **anaidqualitydisposables.uk** through WooCommerce's
public Store API by `scripts/import-anaid-shop.mjs`. Re-run it whenever the live
site changes, then `npm run db:seed`. Images are downloaded to `public/products`
and `public/categories` in two sizes, so the site depends on no external host.

**Prices are the exception.** Every product on the live site carries one of three
placeholder values (£100, £200, £300), so they were unusable. List prices here
are derived from the product family and the case quantity — plausible UK trade
figures, but invented. Replace them in the admin, or set real prices on the live
site and re-import.

A handful of the imported names carry typos from the source (for example "woth
Hole"); they are left exactly as they are rather than silently corrected.

### Signing in

**Customers** sign in with a one-time code. **The code is `1234` for every
account**, because there is no verified sending domain yet. The code is still
written to the database, still expires, and still has attempt and rate limits,
so removing `OTP_FIXED_CODE` from the environment switches real codes on with no
code change.

**Staff** sign in at `/admin/login` with email and password. The seed creates:

| Email | Role |
|---|---|
| `admin@anaid.co.uk` | Super Administrator |
| `sales@anaid.co.uk` | Sales Administrator |
| `warehouse@anaid.co.uk` | Warehouse and Delivery |

All three use `ChangeMe!2026` unless `SEED_STAFF_PASSWORD` was set. **Change the
super-admin password before anyone else can reach the site.**

Seeded demo customers: `orders@copperkettle.co.uk` (approved, Wholesale 2, £2,000
credit) and `hello@spicegarden.co.uk`.

## How it is put together

```
src/
  app/(customer)/        the customer application
  app/(admin)/admin/     the staff dashboard
  components/            ui/ shared, customer/, admin/
  lib/
    db.ts                Prisma client over the pooled connection
    money.ts             integer pence and basis points — all money arithmetic
    pricing.ts           THE PRICING ENGINE and the six price-security checks
    basket.ts            buildOrderDraft — the one place a total is calculated
    permissions.ts       the permission matrix, and canSeePrices()
    auth/session.ts      sessions as database rows, so revocation is immediate
    auth/guards.ts       requireApprovedCustomer, requireStaff, and friends
    settings.ts          every configurable value, typed
    otp.ts, audit.ts, notifications.ts, numbering.ts, orders.ts, catalogue.ts
prisma/
  schema.prisma          the data model
  seed.ts, seed-data.json
```

Conventions worth knowing before editing:

- **Money is integer pence. Rates are integer basis points** (2000 = 20.00%).
  Nothing anywhere holds a fractional price. Use `src/lib/money.ts`.
- **Orders copy, they do not reference.** Addresses, prices, product names and
  VAT rates are written onto the order, so history stays true when the live
  record changes.
- **The server recalculates.** The browser says which products and how many.
  Everything about money is recomputed from the database at checkout by the same
  `buildOrderDraft` the basket screen used.
- **Nothing is deleted.** Products deactivate, staff disable, addresses archive,
  orders cancel.
- **Stock is reserved at order and reduced at dispatch.** `available = onHand −
  reserved`.

## Deploying to Netlify

1. **Push to a Git repository** and connect it to a new Netlify site. Build
   settings come from `netlify.toml` — build `npm run build`, publish `.next`,
   with `@netlify/plugin-nextjs`.

2. **Set the environment variables** in Netlify (Site configuration →
   Environment variables). Every one of them:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Neon **pooled** connection string |
   | `DIRECT_URL` | Neon **direct** connection string (no `-pooler`) |
   | `SESSION_SECRET` | A new secret — `openssl rand -base64 32`. Not the development one. |
   | `NEXT_PUBLIC_APP_URL` | The live site URL |
   | `MAIL_FROM` | e.g. `ANAID <noreply@anaid.co.uk>` |
   | `RESEND_API_KEY` | Optional until email is switched on |
   | `OTP_FIXED_CODE` | `1234` for now. Deleting it switches on real codes. |
   | `SEED_STAFF_PASSWORD` | Optional, only if you seed production |

3. **Apply migrations against the production database** before the first deploy:

   ```bash
   DIRECT_URL="<production direct url>" npm run db:deploy
   ```

   Netlify's build does not run migrations, deliberately — a build should never
   silently change a production schema.

4. **Seed, once**, if this is a fresh database: `npm run db:seed`.

5. **Sign in at `/admin/login` and change the super-admin password.**

6. Check the settings screen: company details, VAT, the free-delivery threshold,
   the minimum order value.

### Switching on real sign-in codes

1. Verify a sending domain in Resend and set `RESEND_API_KEY`.
2. Turn on **Send notifications by email** in `/admin/settings`.
3. Delete `OTP_FIXED_CODE` from the environment.
4. Set the code length, expiry, attempt limit and hourly limit in settings.

Only step 3 changes how codes are generated; nothing in the code needs editing.
SMS is not built — until it is, codes go by email.

## Still to decide

`DECISIONS.md` ends with the questions that do not block v1 but must be answered
before the phase that needs them: partial fulfilment, credit notes, when invoices
are generated, how payments are recorded, chasing overdue invoices, import
behaviour, and which notifications justify their cost.
