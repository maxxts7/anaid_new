# ANAID Quality Disposables Limited
## B2B Ordering and Distribution Platform

### Level 1 — The Flow at a Glance

*This is the shortest of four documents. It describes the whole system in one page. Levels 2, 3 and 4 describe the same flow in progressively greater detail. Nothing new is introduced at the later levels; the same story is simply told more slowly.*

---

## What the system is

ANAID Quality Disposables Limited is a United Kingdom distributor. It supplies disposable food-service and packaging products to businesses. Its customers are restaurants, takeaways, cafés, hotels, pubs, catering companies, supermarkets and similar trade buyers. It does not sell to the general public.

The system described here is the software those customers use to place their orders, and the software ANAID staff use to manage them. It is a single system with two faces:

- **The customer application.** Used on a mobile telephone by a business owner or manager. It is used to browse products, see prices, and place orders.
- **The admin dashboard.** Used on a computer by ANAID staff. It is used to approve customers, manage products and prices, process orders, and issue invoices.

Both faces are served by one shared body of rules and one shared store of data. Neither face is trusted to make decisions on its own.

---

## The one rule that shapes everything

> **A customer cannot see any price, and cannot place any order, until an ANAID administrator has manually approved their account.**

This single rule is the reason the system exists in the shape it does. Wholesale prices are confidential and are negotiated per customer. They must not be visible to a competitor, to a member of the public, or to a business that ANAID has not chosen to trade with.

A customer proving that they own a telephone number is not the same thing as ANAID agreeing to trade with them. The system therefore separates those two events completely, and requires a human decision between them.

---

## The spine

```
  ┌──────────────┐
  │   REGISTER   │   The business submits its details.
  └──────┬───────┘
         ▼
  ┌──────────────┐
  │  VERIFY OTP  │   A one-time code proves the contact details are real.
  └──────┬───────┘
         ▼
  ┌──────────────┐
  │   PENDING    │   The account exists but can do almost nothing.
  │   APPROVAL   │   The customer waits. ANAID is notified.
  └──────┬───────┘
         ▼
  ┌──────────────┐
  │ ADMIN REVIEW │   A member of ANAID staff reads the application
  └──────┬───────┘   and makes a decision.
         │
    ┌────┴────┬──────────┐
    ▼         ▼          ▼
 APPROVED  REJECTED  SUSPENDED
    │         │          │
    │         └────┬─────┘
    ▼              ▼
 Can see       Can browse.
 prices.       Cannot see prices.
 Can order.    Cannot order.
    │
    ▼
  ┌──────────────┐
  │   LOG IN     │
  └──────┬───────┘
         ▼
  ┌──────────────┐
  │    BROWSE    │   Products are shown with that customer's own prices.
  └──────┬───────┘
         ▼
  ┌──────────────┐
  │    BASKET    │   Quantities are chosen. Minimums are checked.
  └──────┬───────┘
         ▼
  ┌──────────────┐
  │   CHECKOUT   │   Delivery details are confirmed. The system, not the
  └──────┬───────┘   customer's device, calculates the final total.
         ▼
  ┌──────────────┐
  │    ORDER     │   ANAID picks, packs, dispatches and delivers.
  └──────┬───────┘
         ▼
  ┌──────────────┐
  │   INVOICE    │   The invoice is issued and later marked paid.
  └──────┬───────┘
         ▼
  ┌──────────────┐
  │   REORDER    │   The customer buys the same items again, in seconds.
  └──────────────┘
```

---

## The stages in one line each

| # | Stage | The customer does | ANAID staff do |
|---|---|---|---|
| 1 | **Register** | Submit business details | Nothing yet |
| 2 | **Verify** | Enter a code sent by text or email | Nothing yet |
| 3 | **Pending** | Wait, and browse products without prices | Receive a notification |
| 4 | **Review** | Wait | Read the application and decide |
| 5 | **Decision** | Receive the outcome | Approve, reject, suspend, or ask for more information |
| 6 | **Log in** | Sign in and reach their dashboard | Nothing |
| 7 | **Browse** | See products priced for their account alone | Maintain the catalogue and prices |
| 8 | **Basket** | Choose quantities | Nothing |
| 9 | **Checkout** | Confirm delivery details and place the order | Nothing |
| 10 | **Fulfil** | Watch the order progress | Confirm, pick, pack, dispatch, deliver |
| 11 | **Invoice** | View and download the invoice | Issue it, and record payment |
| 12 | **Reorder** | Repeat a previous order in a few taps | Nothing |

---

## The principle behind the whole design

Every decision that matters is made by the system's own rules, on ANAID's own servers, and never by the customer's telephone or web browser.

The customer's device is treated as untrustworthy. It may be modified. It may be inspected. It may be replaced by a program pretending to be a customer. The system therefore checks, for every single request it receives: who is asking, whether that account is approved, and what that account is entitled to see or do.

Hiding a price on the screen is not security. Refusing to send the price at all is security. That distinction runs through every part of this system.

---

*Continue to **Level 2 — The Flow Explained** for the same twelve stages broken into their individual steps.*
