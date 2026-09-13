# ANAID — Build Decisions

Answers to the open questions in LEVEL-4 Part Five (the Gap Register), plus the
technical choices they imply. This is the source of truth wherever the four
LEVEL documents leave a question open. Where this file and the LEVEL documents
disagree, this file wins.

Settled 2026-09-13.

---

## Scope

**v1 = Phases 1–5** of the Level 4 build order:

1. Foundation — account statuses, permissions, server-side checks, staff accounts and roles, settings
2. Catalogue — products, categories, images, search, filtering (no prices shown to anybody)
3. Registration and approval — form, OTP, pending state, approvals queue, customer numbers
4. Pricing — levels, customer prices, quantity breaks, the six price-security checks
5. Ordering — basket, checkout, the ten order-security checks, order creation, statuses, history

Deferred to a later version: stock history and low-stock alerts, invoices and
PDFs, payments and credit recording, Buy Again / Quick Order / favourites,
promotions, reports, import/export, delivery management, full notifications,
audit log review UI.

Built in v1 even though they belong to later phases, because retrofitting them
is expensive:

- Stock **reservation** (a phase 6 concept, but the phase 5 checkout needs it)
- Credit limits and the outstanding-balance calculation (the phase 5 credit check needs them)
- The audit log itself — written from day one, only the reading UI is deferred

---

## Technical

| Decision | Choice |
|---|---|
| Framework | Next.js App Router |
| Database | Neon Postgres, existing `DATABASE_URL` / `DIRECT_URL` |
| ORM | Prisma — migrations over `DIRECT_URL`, runtime over the pooled URL |
| Structure | One app, two route groups: `(customer)` mobile-first, `(admin)` desktop-first |
| Hosting | Netlify. I produce `netlify.toml`, the env-var list and a deploy checklist; running the deploy is yours |
| Database state | Empty. Schema built from scratch, first migration and seed run by me |
| Money | Integer minor units (pence) throughout. No floating point anywhere near a price |

---

## Authentication

**Customers** — OTP by phone or email.

- **The code is `1234` for every account, always, for now.** Pinned via
  `OTP_FIXED_CODE`. No message is sent. Deleting that env var re-enables real
  code generation and delivery without any code change.
- Once accepted, the session is remembered for **30 days**, so a daily user is
  not retyping a code.
- Code length, expiry, attempt limit and resend rate limit live in settings,
  not in code. Starting values: 4 digits, 10 minutes, 5 attempts, 3 resends/hour.
- **Several logins per business.** `User` is modelled separately from
  `Customer` from day one. v1 creates one user per business, but sessions,
  orders and audit entries all reference the user, not the business. Per-user
  powers within a business are not built in v1.

**Staff** — email and password, a separate table and a separate login route
from customers. Super Administrator creates staff accounts and assigns roles.
A super-admin is seeded so the first deploy is reachable. Staff may hold more
than one role (gap #24) — roles are a set, not a single value.

---

## Pricing

**Lowest applicable price always wins** (gap #1). The engine computes every
candidate — level price, customer-specific price, quantity break, promotion —
and takes the minimum. It returns the winning price *and* which rule produced
it, so a customer query can be answered from the order record itself.

**Pricing levels are a percentage off the standard price** (gap #16), e.g.
Wholesale 2 = 12% off list. A new product is therefore sellable at every level
the moment it is created. Per-product, per-level explicit overrides exist in the
schema for the cases where a percentage is wrong.

Promotions are not implemented in v1, but the engine takes promotional
candidates as an input, so adding them later changes no call site.

Prices are never sent to a client that is not approved. Not hidden — not sent.

---

## Stock

**Reserve at order, reduce at dispatch** (gap #2). Products carry `onHand` and
`reserved`; available = `onHand − reserved`. Two customers cannot be sold the
same last carton. Cancellation releases the reservation. Full movement history
is phase 6.

---

## Credit and money

- Outstanding balance = **unpaid invoices + orders not yet invoiced** (gap #8).
  Since invoices are not in v1, this is initially the value of live orders, and
  the invoice component drops in without changing the check.
- **Payment on account only** in v1. No card payment, no payment provider. The
  order model carries a payment method from the start so card can be added later.
- VAT **20%** standard, held per product so zero-rated items are supported.
- Free delivery above **£250 ex-VAT**, measured on the subtotal before VAT
  (gap #15), so the threshold matches the number the customer is looking at.
- Minimum order value **£50** (gap #14), in addition to per-product minimum
  order quantities.
- All four figures are editable in admin settings, not constants in code.

---

## Customers and orders

- **Staff may create pre-approved customer accounts** (gap #13). Staff enter an
  existing trade customer's details, set pricing level and credit terms, and the
  account starts APPROVED. This is how the existing book of telephone customers
  gets onto the system.
- **Customer may cancel until Order Confirmed. Staff may amend until Picking**
  (gap #11). Every amendment fully recalculates the order server-side and writes
  an audit entry. Staff never cancel and re-key.
- **Suspension** (gap #7): existing orders run to completion and invoices stay
  visible — a customer who cannot see an invoice cannot pay it. No new orders,
  and no prices on new browsing.
- **Request more information** (gap #12) is PENDING_APPROVAL carrying a flag,
  not a sixth status.
- **Reinstatement** (gap #19): Super Admin or Sales Admin moves a REJECTED or
  SUSPENDED account back to APPROVED, with a mandatory internal note.
- **Duplicate applications** (gap #22) are flagged, not blocked, on matching
  email, mobile, VAT number, or business name + postcode. Staff decide.
- **Abandoned registrations** (gap #21): accounts stuck at REGISTERED are
  flagged in the queue after 30 days. Automatic purging is deferred.
- **Verification** (gap #17): one channel verifies the account — whichever the
  customer used. The other is recorded as unverified and can be verified later
  from the account page.

---

## Design

- **Crisp utility.** Off-white ground, near-black text, one sharp accent for
  actions and status. Tight type scale, generous whitespace, borders rather than
  shadows. A serious tool, not a brochure. Price tables must stay legible on a
  phone in a busy kitchen.
- No existing ANAID branding. The palette, type scale, spacing and components
  are designed here and centralised as tokens, so real branding drops in from the
  admin settings screen later.
- Customer routes are mobile-first. Admin routes are desktop-first, with usable
  tablet layouts for warehouse and delivery staff.

---

## Data

Seeded demo catalogue of genuine UK disposables SKUs — hot cups and lids, burger
and chip boxes, foil containers, napkins, gloves, bin liners, cutlery, cling film
and foil — with plausible pack sizes, carton quantities, minimum order quantities
and list prices. Replaced by real data via import later.

---

## Notifications

Every notification is written to the database and shown in the app. Resend is
integrated but held behind a settings flag that is **off** until a sending domain
is verified, matching the note already in `.env`. Nothing fails silently;
switching it on is one toggle. No SMS in v1 (gap #25 stays open until real costs
are known).

---

## Still open

Not needed for v1, to be answered before the phase that needs them:

- Partial fulfilment (gap #5) — phase 6
- Returns and credit notes (gap #6) — phase 6
- When invoices are generated (gap #9) — phase 6
- How payments are recorded (gap #10) — phase 6
- Overdue invoice process (gap #23) — phase 6
- Import behaviour on partly valid files (gap #20) — phase 8
- Which notifications justify their cost (gap #25) — when SMS goes live
