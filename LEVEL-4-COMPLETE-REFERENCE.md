# ANAID Quality Disposables Limited
## B2B Ordering and Distribution Platform

### Level 4 — Complete Reference

*This is the most detailed of the four documents. It follows the same flow as Levels 1, 2 and 3, but records every field, every check, every message and every failure path. It then covers the areas of the system that sit outside the main flow, and closes with a consolidated register of the questions the original brief leaves unanswered.*

*This document describes what the system must do. It deliberately names no technologies. Any competent developer may choose their own tools, provided the behaviour described here is delivered.*

---

## Contents

**Part One — Foundations**
1. How to read this document
2. The five account statuses
3. The complete permission matrix
4. The people who use the system
5. The information the system holds

**Part Two — The flow, stage by stage**
6. Stage 0 — The visitor
7. Stage 1 — Registration
8. Stage 2 — Verification
9. Stage 3 — Awaiting approval
10. Stage 4 — Administrative review
11. Stage 5 — The decision
12. Stage 6 — Logging in
13. Stage 7 — Catalogue and pricing
14. Stage 8 — The basket
15. Stage 9 — Checkout
16. Stage 10 — Fulfilment
17. Stage 11 — Invoicing, payment and credit
18. Stage 12 — Reordering

**Part Three — The supporting areas**
19. Product management
20. Categories
21. Product import and export
22. Inventory
23. Promotions
24. Delivery management
25. Customer management
26. Notifications
27. Staff roles and permissions
28. Reports
29. Settings and branding
30. Audit logging

**Part Four — Matters that cross the whole system**
31. Security
32. Error handling
33. Performance
34. Responsive design
35. Future integrations

**Part Five — The gap register**

**Part Six — Suggested build order**

---
---

# PART ONE — FOUNDATIONS

## 1. How to read this document

This document is a reference. It is not intended to be read from beginning to end in one sitting, although it can be. Each section stands alone.

Three conventions are used throughout.

**Quoted text in a block** is wording intended to be shown to a user, more or less as written. For example:

> Your account is currently awaiting approval from ANAID Quality Disposables Limited.

**Gap in the brief** marks a question the original brief does not answer. Where this appears, the options are set out and their consequences explained, but no choice is made. These are collected together in Part Five.

**Tables** are used for anything that is a list of rules, fields or permissions, because such things are read by looking up rather than by reading through.

---

## 2. The five account statuses

Everything a customer may or may not do is determined by a single value held against their account. That value is the account status. There are five.

### REGISTERED

The account has been created but the contact details have not yet been verified.

This status is brief. It exists only to give the verification step something to act upon. An account in this state can do nothing beyond completing verification. It cannot log in to any useful screen.

Accounts that remain in this status are abandoned registrations. They should not appear in the approvals queue, because nobody has proved that the details are even real.

### PENDING_APPROVAL

The contact details have been verified. No decision has yet been made.

This is the state the entire design turns upon. The customer has proved they control a telephone number or an email address. They have proved nothing else. ANAID has not agreed to trade with them.

### APPROVED

A member of ANAID staff has decided that ANAID will trade with this business.

This is the only status that permits prices to be seen or orders to be placed.

### REJECTED

The application has been declined.

The account is not deleted. The customer may still browse. This is deliberate: a business rejected today may be acceptable in six months, and destroying the record makes that harder.

### SUSPENDED

An existing customer's access has been withdrawn, usually temporarily.

The commonest reason is non-payment. Suspension is a lever rather than an ending, and the messaging reflects that.

### The transitions between them

```
                    ┌────────────┐
                    │ REGISTERED │
                    └──────┬─────┘
                           │ contact details verified
                           ▼
                  ┌──────────────────┐
                  │ PENDING_APPROVAL │◄──────────┐
                  └────────┬─────────┘           │
                           │                     │ reinstated
        ┌──────────────────┼─────────────┐       │ by admin
        │ approved         │ rejected    │       │
        ▼                  ▼             │       │
  ┌──────────┐       ┌──────────┐        │       │
  │ APPROVED │       │ REJECTED │        │       │
  └────┬─────┘       └──────────┘        │       │
       │                                 │       │
       │ suspended by admin              │       │
       ▼                                 │       │
  ┌───────────┐                          │       │
  │ SUSPENDED │──────────────────────────┴───────┘
  └───────────┘        reinstated to APPROVED
```

**Gap in the brief.** The brief does not describe how an account leaves REJECTED or SUSPENDED. Reinstatement is plainly required — a suspended customer who pays their bill must be able to trade again — but the brief defines no action for it and no record of who performed it.

---

## 3. The complete permission matrix

This table is the definitive statement of what each kind of user may do. Every rule elsewhere in this document is consistent with it.

| Capability | Not logged in | REGISTERED | PENDING | REJECTED | SUSPENDED | APPROVED |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| View home page | Yes | Yes | Yes | Yes | Yes | Yes |
| View categories | Yes | Yes | Yes | Yes | Yes | Yes |
| Browse products | Yes | Yes | Yes | Yes | Yes | Yes |
| Search products | Yes | Yes | Yes | Yes | Yes | Yes |
| Read product details | Yes | Yes | Yes | Yes | Yes | Yes |
| **See any price** | **No** | **No** | **No** | **No** | **No** | **Yes** |
| **Add to basket** | **No** | **No** | **No** | **No** | **No** | **Yes** |
| **Reach checkout** | **No** | **No** | **No** | **No** | **No** | **Yes** |
| **Place an order** | **No** | **No** | **No** | **No** | **No** | **Yes** |
| View own orders | No | No | No | No | Yes (past only) | Yes |
| View own invoices | No | No | No | No | Yes (past only) | Yes |
| See credit information | No | No | No | No | No | Yes |
| Use favourites | No | No | No | No | No | Yes |
| Use Buy Again | No | No | No | No | No | Yes |
| Use Quick Order | No | No | No | No | No | Yes |
| Edit own account details | No | No | Limited | No | No | Yes |
| Register | Yes | — | — | — | — | — |
| Log in | Yes | Yes | Yes | Yes | Yes | Yes |

Two entries in that table are marked with a qualification and should be explained.

A **suspended** customer is shown as able to view past orders and invoices. The reasoning is that suspension is usually imposed for non-payment, and a customer who cannot see the invoices they owe cannot pay them. **Gap in the brief:** the brief does not state this, and says only that a suspended customer may browse. The alternative reading is that they lose all access beyond browsing.

A **pending** customer is shown as having limited ability to edit their own details. Correcting a mistyped telephone number while waiting is reasonable. Changing the business name after ANAID has begun reviewing the application is not. **Gap in the brief:** the brief does not address this.

---

## 4. The people who use the system

### Customers

A customer is a business, not a person. The business is identified by its customer number, in the form ANAID-C00001.

**Gap in the brief.** The brief describes one login per business. In practice a restaurant may have an owner, a manager and a head chef, any of whom may need to order. Three questions follow and none is answered: may a business have several logins; if so, do they all have the same powers; and if an employee leaves, how is their access removed. This is the single most likely source of a future rebuild, because adding multiple users to a system designed for one is substantially harder than allowing for it from the start.

### ANAID staff

Staff are individuals with named accounts and assigned roles. Five roles are defined, and they are described in full in Section 27.

| Role | Broad area of work |
|---|---|
| Super Administrator | Everything, including settings and staff accounts |
| Sales Administrator | Customers, orders, products, pricing |
| Warehouse Staff | Orders, picking, packing, inventory |
| Accounts Staff | Invoices, payments, credit, reports |
| Delivery Staff | Delivery orders, delivery status, delivery addresses |

### Visitors

Anybody who has not logged in. They may browse and register. They may do nothing else.

---

## 5. The information the system holds

The following is a description of the information the system must keep, and how the pieces relate to one another. It is expressed in plain terms rather than as a technical design, but it is complete enough that a developer could work from it.

### The principal records

```
  CUSTOMER ──────┬──── has many ──► ADDRESSES
                 ├──── has many ──► ORDERS ────── has many ──► ORDER LINES
                 ├──── has many ──► INVOICES ──── has many ──► INVOICE LINES
                 ├──── has many ──► PAYMENTS
                 ├──── has many ──► FAVOURITES
                 ├──── has many ──► NOTES  (internal, staff only)
                 ├──── has one ───► PRICING LEVEL
                 └──── has many ──► CUSTOMER PRICES

  PRODUCT ───────┬──── belongs to ► CATEGORY ──── may have ──► SUBCATEGORIES
                 ├──── has many ──► IMAGES
                 ├──── has many ──► QUANTITY PRICE BREAKS
                 ├──── has many ──► CUSTOMER PRICES
                 ├──── has one ───► STOCK POSITION
                 └──── has many ──► STOCK MOVEMENTS

  ORDER ─────────┬──── has many ──► ORDER LINES
                 ├──── has one ───► DELIVERY
                 ├──── has one ───► INVOICE
                 └──── has many ──► STATUS CHANGES
```

### Customer

| Information held | Notes |
|---|---|
| Customer number | ANAID-C00001. Permanent. Issued at approval. |
| Business name | |
| Contact name | |
| Email address | Must be unique across all customers. |
| Mobile number | Must be unique across all customers. |
| Additional contact number | Optional. |
| Business type | From the fixed list. |
| Billing address | |
| Delivery address | The default. Others may be added. |
| Postcode | Used for delivery area and charge. |
| VAT number | Optional. |
| Company registration number | Optional. |
| Website | Optional. |
| Account status | One of the five. |
| Pricing level | Assigned at approval. |
| Credit limit | Zero for non-credit customers. |
| Outstanding balance | Maintained by the system, not typed in. |
| Payment terms | For example, thirty days from invoice. |
| Terms accepted at | Date and time. |
| Privacy policy accepted at | Date and time. |
| Marketing consent | Yes or no, with date and time. |
| Created at | |
| Verified at | |
| Approved at | |
| Approved by | Which member of staff. |
| Rejection reason | Internal only. |

### Product

| Information held | Notes |
|---|---|
| Product code (SKU) | Unique. For example ANAID-HP10. |
| Barcode | Optional. Used for scanning later. |
| Name | |
| Description | |
| Category | |
| Subcategory | Optional. |
| Brand | |
| Size | |
| Material | |
| Colour | |
| Pack quantity | Items in a pack. |
| Units per carton | |
| Carton quantity | |
| Minimum order quantity | |
| Standard price | The list price, before any customer pricing. |
| VAT rate | |
| Stock quantity | |
| Low stock threshold | |
| Weight | |
| Dimensions | |
| Images | One or several. |
| Featured | Yes or no. |
| Active | Yes or no. Inactive products are hidden from customers but not deleted. |

### Order

| Information held | Notes |
|---|---|
| Order number | ANAID-2026-000001. |
| Customer | |
| Delivery address | Copied onto the order, not merely referenced. |
| Billing address | Copied onto the order. |
| Contact number | |
| Purchase-order reference | Optional, supplied by the customer. |
| Delivery instructions | |
| Preferred delivery date | |
| Order lines | Each with product, quantity, unit price, VAT rate and line total. |
| Subtotal | |
| VAT total | |
| Delivery charge | |
| Grand total | |
| Payment method | |
| Order status | |
| Order date | |
| Actual delivery date | |
| Notes | |

The instruction that addresses are **copied onto the order** rather than referenced is important and easily missed. If an order merely pointed at the customer's current delivery address, then a customer who moved premises would find that all their historical orders appeared to have been delivered to the new address. The same reasoning applies to prices: an order line records the price charged at the time, not a pointer to the current price.

### The remaining records

The system additionally holds: staff users; roles and their permissions; one-time codes and their state; product images; pricing levels; customer-specific prices; quantity price breaks; payments; invoices and invoice lines; deliveries; stock movements; promotions; notifications; favourites; customer notes; audit log entries; and settings.

Each is described in the section of this document that deals with the part of the system that uses it.

### General requirements on the data

- Every record carries the date and time it was created and last changed.
- Records are not deleted where history matters. A discontinued product becomes inactive. A departed member of staff becomes disabled. Deleting them would break the orders and invoices that refer to them.
- Money is stored in a form that cannot suffer rounding drift. Repeated arithmetic on fractional values can produce totals that are a penny out, which is unacceptable on an invoice.
- The fields that are searched or filtered most often — product code, barcode, product name, customer number, business name, postcode, order number, order status, account status, invoice number — must be indexed, so that searching remains fast as the data grows.

---
---

# PART TWO — THE FLOW, STAGE BY STAGE

## 6. Stage 0 — The visitor

### What this stage is for

To let a business that has never dealt with ANAID see the range of products, so that they have a reason to apply, while revealing nothing about price.

### What is shown

The home page introduces ANAID and its range. The category list is shown in full. Any active product may be opened and read.

A product page shows: the images, the name, the product code, the description, the pack size, the carton quantity, the minimum order quantity, whether it is in stock, and related products.

Where the price would be:

> **Login and get approved to view price**

Beside it, a clear invitation to register.

### What is not shown, and how

It is not enough to omit the price from the screen. The price must not be sent to the device at all.

The distinction is worth labouring, because it is the difference between a secure system and one that merely looks secure. When a web page is displayed, the device first receives the underlying data and then draws the screen from it. Anybody can inspect the data their own device received, using tools built into every web browser. If the price was sent and then hidden, it can be read in a few seconds by a person with no special skill.

Therefore: when the system prepares product information for somebody who is not an approved customer, the price is simply absent. Not blank, not zero, not hidden — absent.

This applies to every route by which product information can be obtained, without exception:

- The product listing
- The individual product page
- The search results
- The category listings
- The featured products section
- Any related-products section
- Any other route added in future

A single route that forgets this defeats every other precaution in the system.

### Navigation

Even before logging in, the five-item bar at the foot of the mobile screen is present, but the Basket entry either does not appear or leads to an invitation to register.

### Failure paths

| Situation | What happens |
|---|---|
| A product does not exist | A plain "product not found" page, with a link back to the catalogue. |
| A product has been deactivated | Treated as not found. Inactive products are invisible to customers. |
| A search returns nothing | A message, and suggestions of popular categories. |
| The site is under maintenance | A plain holding page. No technical detail. |

---

## 7. Stage 1 — Registration

### What this stage is for

To collect enough information for a member of ANAID staff to decide whether to trade with this business, and enough for the warehouse to deliver to them afterwards.

### The form in full

**Required fields**

| Field | Type | Validation | If it fails |
|---|---|---|---|
| Business name | Text | Present; at least two characters | "Please enter your business name." |
| Contact person's name | Text | Present; at least two characters | "Please enter a contact name." |
| Mobile number | Telephone | Present; a valid United Kingdom mobile number; not already registered | "Please enter a valid UK mobile number." / "This number is already registered. Please log in." |
| Email address | Email | Present; correctly formed; not already registered | "Please enter a valid email address." / "This email address is already registered. Please log in." |
| Business address | Address | Present | "Please enter your business address." |
| Delivery address | Address | Present, or a tick to say it is the same as the business address | "Please enter a delivery address." |
| Postcode | Text | Present; a valid United Kingdom postcode format | "Please enter a valid UK postcode." |
| Business type | Choice | One of the listed options | "Please select your business type." |

**Optional fields**

| Field | Type | Validation |
|---|---|---|
| VAT number | Text | If given, must be a plausible United Kingdom VAT number format |
| Company registration number | Text | If given, must be a plausible Companies House number format |
| Website | Text | If given, must be a plausible web address |
| Additional contact number | Telephone | If given, must be a valid telephone number |
| Purchase/order reference | Text | None |
| Notes | Long text | Reasonable length limit |

**Business type options**

Restaurant, Takeaway, Café, Fast Food, Bakery, Catering Company, Hotel, Pub, Food Truck, Supermarket, Convenience Store, Other.

### The consent section

Three checkboxes.

| Checkbox | Required | Default |
|---|---|---|
| I accept the terms and conditions | Yes | Unticked |
| I accept the privacy policy | Yes | Unticked |
| I would like to receive marketing communications | No | Unticked |

The marketing checkbox must never be ticked by default. Under United Kingdom law, consent must be a positive action.

The date and time of each acceptance is recorded against the account, permanently. If ANAID is ever asked to demonstrate that a customer consented, that record is the evidence.

### What happens when the form is submitted

1. Every field is validated again on the server, regardless of what the device has already checked. Validation performed only on the device can be bypassed entirely.
2. The account record is created with the status **REGISTERED**.
3. A one-time code is generated and sent.
4. The customer is moved to the verification screen.

The customer does **not** receive a customer number at this point. Customer numbers are issued at approval, so that the sequence is not filled with abandoned registrations.

### Protections on this form

Registration is exposed to the open internet and must be protected accordingly.

- **Rate limiting.** A limited number of registrations may be submitted from the same origin in a given period. Without this, a single script can create thousands of accounts and send thousands of text messages at ANAID's expense.
- **Input validation.** Every field is checked for type, length and format. Text submitted by a stranger is never treated as anything other than text.
- **No confirmation of existence.** Where possible, error messages avoid confirming which email addresses and telephone numbers are already registered. This is a minor concern for a business-to-business system but costs nothing to observe.

### Failure paths

| Situation | What happens |
|---|---|
| A required field is missing | The specific field is identified. Nothing else is lost. |
| The email address is already in use | The customer is invited to log in instead. |
| The mobile number is already in use | The customer is invited to log in instead. |
| The code cannot be sent | The account is still created. The customer is told there was a problem and offered a resend. |
| Too many registrations from one source | A neutral message asking them to try later. |
| The customer abandons the form partway | Nothing is created. |
| The customer abandons after submitting but before verifying | The account remains REGISTERED and never enters the approvals queue. |

**Gap in the brief.** The brief does not say what becomes of accounts that remain REGISTERED indefinitely. They accumulate, and they hold personal information that serves no purpose. A reasonable answer is that unverified accounts are deleted after a set period, but the brief does not set one.

**Gap in the brief.** The brief does not say whether duplicate applications from the same business should be detected. Matching on business name, postcode or VAT number would help staff, but produces false matches where several businesses share an address.

---

## 8. Stage 2 — Verification of contact details

### What this stage is for

To prove that the telephone number or email address supplied is genuinely controlled by the applicant.

And to be clear about what it does not do: it establishes nothing about whether the business is real, solvent, or somebody ANAID wishes to supply. That is decided by a person at Stage 4. The two are separated deliberately and must never be merged.

### How the code works

A short numeric code is generated at random. It is sent to the chosen contact route. The customer types it in.

Six properties are required of it.

| Property | Why |
|---|---|
| Random | A predictable code can be calculated rather than guessed. |
| Short-lived | Limits how long an intercepted or guessed code remains useful. |
| Single use | Once accepted, it can never be used again, even before it expires. |
| Attempt-limited | A small number of wrong entries destroys the code. This defeats guessing. |
| Request-limited | A limited number may be requested in a period. This prevents cost abuse and harassment of a stranger whose number was entered. |
| Unreadable at rest | Stored in a form that cannot be read back, so that access to the database does not yield working codes. |

### Suggested settings

The brief does not specify values. The following are conventional and are offered as a starting point, to be confirmed.

| Setting | Suggested value |
|---|---|
| Code length | Six digits |
| Validity period | Ten minutes |
| Maximum attempts per code | Five |
| Delay before a resend is allowed | Sixty seconds |
| Maximum codes per hour | Five |
| Lockout after repeated failure | Fifteen minutes |

**Gap in the brief.** The brief requires expiry, resend, maximum attempts and rate limiting, but sets no figures for any of them. They must be decided, and should be adjustable from the settings screen rather than fixed in the code.

### On success

1. The account status changes from REGISTERED to **PENDING_APPROVAL**.
2. The date and time of verification is recorded.
3. The application enters the Customer Approvals queue.
4. ANAID staff are notified.
5. The customer is shown:

> Your contact details have been verified. Your account is now awaiting approval from ANAID Quality Disposables Limited.

That message is the most important piece of wording in the customer application. It confirms a success and, in the same sentence, sets the expectation that trading is not yet possible. A customer who mistakes verification for approval will attempt to order, fail, and telephone ANAID in confusion.

### Failure paths

| Situation | What the customer sees |
|---|---|
| The code is wrong | "The code you entered is not correct. Please try again." |
| The code has expired | "This code has expired. Please request a new one." |
| Too many wrong attempts | "Too many incorrect attempts. Please request a new code." |
| A resend is requested too soon | "Please wait before requesting another code." |
| Too many codes requested | "Please wait before requesting another code." A longer wait. |
| The message never arrives | A resend option; after repeated failure, ANAID's telephone number and email address. |
| The customer closes the application | The code remains valid until it expires. Returning to the screen allows them to continue. |

**Gap in the brief.** The brief does not state whether both the telephone number and the email address must be verified, or only one. Verifying one is quicker and cheaper. Verifying both means every notification route is known to work before the customer is approved, which matters because invoices are sent by email and delivery notices by text message.

---

## 9. Stage 3 — Awaiting approval

### What this stage is for

To hold the customer in a clearly explained state while a person makes a decision, and to make that waiting time useful rather than empty.

### What the customer may do

Precisely what a visitor may do: browse, search and read. Nothing more.

The practical difference between a pending customer and an anonymous visitor is only that the pending customer is logged in and is shown messages about their own position.

### What is displayed

A banner, visible across the application:

> Your account is currently awaiting approval from ANAID Quality Disposables Limited.

Where a price would appear, on every product, in every listing:

> **Price available after account approval**

On the home screen, a short explanation of what happens next and roughly how long it takes, together with ANAID's telephone number in case the customer wishes to speed matters along. A telephone call from an applicant is not a nuisance; it is a sales opportunity.

### What the customer may not do

There is no basket. Not an empty basket — no basket at all. The Basket item in the navigation either is absent or leads to an explanation.

There is no checkout, no order history, no invoice list, and no credit information. These are refused by the system, not merely omitted from the screen.

### ANAID's side

The application appears in the Customer Approvals queue, showing how long it has been waiting. Applications should be sorted oldest first by default, so that the queue naturally empties in order.

### Failure paths

| Situation | What happens |
|---|---|
| The customer attempts to reach the checkout directly | The request is refused. They are returned to the pending message. |
| The customer attempts to obtain a price by another route | No price is returned. There is nothing to obtain. |
| The application is never reviewed | This is a business failure rather than a technical one. See the gap below. |

**Gap in the brief.** No target is set for how quickly applications are reviewed, and no mechanism is described for chasing one that has been forgotten. Two simple additions would address this: an ageing indicator in the queue, and a reminder to staff when an application has waited beyond a set number of days.

---

## 10. Stage 4 — Administrative review

### What this stage is for

This is the decision the entire system exists to protect. A member of ANAID staff decides whether a business becomes a customer, and on what terms.

### Who may perform it

The Super Administrator and the Sales Administrator. No other role.

### The queue

The Customer Approvals screen lists every application awaiting a decision.

| Column | Purpose |
|---|---|
| Business name | Identification |
| Contact name | Who to speak to |
| Telephone | For checking |
| Email | For checking |
| Business type | An immediate sense of the trade |
| Registration date | And how long they have waited |
| Verification status | Confirmation that the details are real |
| Account status | Currently PENDING_APPROVAL |

The queue may be searched and filtered, and is sorted oldest first by default.

### The individual application

Opening one shows everything submitted at registration, including the optional fields, together with:

- Any internal notes previously recorded
- The complete history of the account, including when it registered and when it verified
- A record of any previous decision, if the account is being reconsidered

### The four actions

**Approve.** The account becomes APPROVED. This is not a single decision but four made together:

1. That ANAID will trade with this business.
2. Which pricing level applies. This determines every price the customer will ever see.
3. Whether credit is offered, and if so the credit limit and the payment terms.
4. Whether any product-specific negotiated prices apply.

**Reject.** The account becomes REJECTED. A reason should be recorded internally so that staff can explain the decision if the customer telephones.

**Request more information.** The applicant is contacted and asked to supply something further — commonly a VAT number, proof of trading, or confirmation of the delivery address.

**Suspend.** Available here, but properly belonging to existing customers rather than new applicants.

### Internal notes

Staff may record a note against a customer at any time, at review or later. Notes are never visible to the customer. Each records who wrote it and when.

They are the natural place for observations such as *spoke to the owner, premises confirmed*, or *previously traded under another name, late payer*.

### Failure paths

| Situation | What should happen |
|---|---|
| Two members of staff open the same application simultaneously | The second decision must not silently overwrite the first. The second member of staff should be told the decision has already been made. |
| An approval is made in error | It must be reversible, by suspending the account. |
| A rejection is recorded with no reason | The customer telephones and nobody can explain. A reason should be required, not optional. |
| Staff approve without assigning a pricing level | See the gap below. |

**Gap in the brief.** *Request more information* is listed as an action, but no account status corresponds to it. An application in that condition is neither pending nor decided. Either a sixth status is needed, or the account stays PENDING_APPROVAL carrying a flag that records information has been requested. The second is simpler and probably better, but the brief does not choose, and the queue will behave differently depending on which is adopted.

**Gap in the brief.** The brief does not say whether assigning a pricing level is compulsory at approval. If it is optional, a customer may be approved with no pricing level at all, and the pricing engine would have no basis on which to price for them. Requiring it at the point of approval removes the question.

**Gap in the brief.** The brief does not say whether ANAID staff may create a customer account directly, without the customer registering. In practice this is frequently needed: an existing telephone-ordering customer is set up by staff, and then invited to log in. Without it, every existing ANAID customer must register themselves before the system can be used for them.

---

## 11. Stage 5 — The decision takes effect

### On approval

Four things happen.

**The status changes.** The account becomes APPROVED. The date and time, and the identity of the approving member of staff, are recorded permanently. This is written to the audit log.

**A customer number is issued.** In the form ANAID-C00001. It is permanent, sequential and never reused. It appears on the customer's account page, on every order and on every invoice, and it is the reference staff use internally and on the telephone.

**The commercial terms take effect.** The pricing level, any negotiated prices, the credit limit and the payment terms are all now live.

**A notification is sent.**

> Your ANAID Quality Disposables account has been approved. You can now log in to view your prices and place orders.

Nothing needed to be deployed or altered for prices to become visible. The same rules that previously refused now permit, because the value they consult has changed.

### On rejection

The status becomes REJECTED. The reason is recorded internally. A notification is sent:

> Your ANAID Quality Disposables account application has not been approved. Please contact us for further information.

No reason is given to the customer. The reason exists internally so that staff can explain it in conversation. An automatically transmitted written reason can create difficulties that a telephone call does not.

### On suspension

The status becomes SUSPENDED. A notification is sent:

> Your ANAID Quality Disposables account has been temporarily suspended. Please contact ANAID Quality Disposables Limited.

The word *temporarily* is chosen deliberately. Suspension is most often a lever applied for non-payment, intended to prompt a telephone call rather than to end the relationship.

### How the notification is delivered

According to the settings, by email, by text message, within the application, or by any combination.

### Failure paths

| Situation | What happens |
|---|---|
| The notification cannot be sent | The status change still takes effect. The failure is logged so staff can follow up. |
| The customer's email address has become invalid | Logged, and flagged on the customer record. |
| The customer is logged in at the moment of approval | On their next action the new status takes effect, because status is read fresh each time. They need not log out and in again. |

**Gap in the brief.** The brief does not say what happens to work in progress when a customer is suspended. If they hold a basket, does it survive? If they have an order at the picking stage, is it completed or halted? If they have unpaid invoices, can they still see them in order to pay? The most defensible position is that existing orders complete, invoices remain visible, and no new order may be placed — but the brief does not say so, and each part of that has to be decided.

---

## 12. Stage 6 — Logging in

### What this stage is for

To confirm that the person using the application owns the account, and then to route them according to the account's status.

### The sequence

```
Customer enters mobile number or email address
        │
        ▼
Does an account exist?
        │
   No ──┴── Yes
    │        │
    │        ▼
    │   A one-time code is sent
    │        │
    │        ▼
    │   Customer enters the code
    │        │
    │   ┌────┴────┐
    │   ▼         ▼
    │ Wrong    Correct
    │   │         │
    │   ▼         ▼
    │ Message   ══════════════════════════
    │           THE ACCOUNT STATUS IS READ
    │           ══════════════════════════
    │                     │
    │      ┌──────────────┼──────────────┬─────────────┐
    │      ▼              ▼              ▼             ▼
    │  APPROVED       PENDING        REJECTED     SUSPENDED
    │      │              │              │             │
    │      ▼              ▼              ▼             ▼
    │  Customer       Holding        Holding       Holding
    │  dashboard      screen         screen        screen
    │
    ▼
Neutral message
```

The two questions asked in that sequence are entirely separate, and the order matters. First: is this person who they claim to be? Second: is this account permitted to trade? A correct answer to the first implies nothing whatever about the second.

### The holding screens

A customer whose account is not APPROVED is not turned away. They reach a screen stating their position plainly, offering the catalogue without prices, and giving ANAID's contact details.

| Status | Wording |
|---|---|
| PENDING_APPROVAL | "Your account is awaiting admin approval." |
| REJECTED | "Your account has not been approved." |
| SUSPENDED | "Your account has been temporarily suspended." |

Each is accompanied by ANAID's telephone number and email address.

### Protections

| Protection | Purpose |
|---|---|
| Rate limiting on code requests | Prevents an attacker from generating text messages to a stranger's telephone. |
| Attempt limiting on code entry | Prevents guessing. |
| Neutral message for unknown accounts | Avoids confirming which numbers and addresses are registered. |
| Session expiry | An unattended device does not remain logged in indefinitely. |
| Fresh status check on every request | A customer suspended at eleven o'clock is refused at one minute past, without having to log out. |

That final row deserves emphasis. It would be simpler to record the account status when the customer logs in and to rely on that record afterwards. It would also be wrong. A customer suspended for non-payment would continue trading until they happened to log out. The status must be read from the database on every request that depends on it.

### Failure paths

| Situation | What the customer sees |
|---|---|
| No account exists for that number or address | A neutral message that does not confirm whether an account exists. |
| The code is wrong | "The code you entered is not correct." |
| The code has expired | "This code has expired. Please request a new one." |
| Too many attempts | A temporary lockout, with the duration stated. |
| The account is REGISTERED but never verified | The customer is returned to the verification step. |
| The session expires while shopping | The basket is preserved. The customer logs in again and continues. |

**Gap in the brief.** The brief describes a one-time code at login and mentions no password. Requiring a code at every login is secure, but a customer ordering daily will find it tedious, and every code costs ANAID a text message. The usual compromise is to require a code on a device not seen before, and then to remember that device for a set period. The brief does not address this, and it materially affects both the customer's experience and ANAID's running costs.

---

## 13. Stage 7 — The catalogue, and the pricing engine

### The catalogue

Products are organised into categories. The brief lists the following, and administrators may create any number of further categories and subcategories:

Cups · Cup Lids · Food Containers · Burger Boxes · Pizza Boxes · Takeaway Boxes · Meal Trays · Paper Bags · Plastic Bags · Cutlery · Straws · Napkins · Aluminium Containers · Aluminium Foil · Cling Film · Baking Products · Cleaning Products · Disposable Gloves · Catering Supplies · Packaging · Other

### The product page

| Element | Shown to whom |
|---|---|
| Images | Everybody |
| Product name | Everybody |
| Product code | Everybody |
| Description | Everybody |
| Pack size | Everybody |
| Carton quantity | Everybody |
| Minimum order quantity | Everybody |
| Availability | Everybody |
| **Price** | **Approved customers only** |
| Add to Basket | Approved customers only |
| Add to Favourites | Approved customers only |
| Related products | Everybody |

### Searching

Customers may search by product name, product code, barcode, category, brand or description.

Results may be narrowed by category, brand, size, material, availability, featured status, and whether the customer has purchased the item before.

That last filter — *recently purchased* — is disproportionately valuable. A wholesale customer buys the same thirty or forty items over and over. Making those items easy to find matters more than any other search feature in the system.

### The pricing engine

For an approved customer only, the system determines a price by working through the following.

```
        ┌────────────────────────────────┐
        │ Step 1: the standard price      │
        │ The product's list price.       │
        └───────────────┬─────────────────┘
                        ▼
        ┌────────────────────────────────┐
        │ Step 2: customer-specific price │
        │ Has ANAID agreed a particular   │
        │ rate with this customer for     │
        │ this product?                   │
        └───────────────┬─────────────────┘
                        ▼
        ┌────────────────────────────────┐
        │ Step 3: pricing level           │
        │ If no specific price, apply the │
        │ customer's assigned level.      │
        └───────────────┬─────────────────┘
                        ▼
        ┌────────────────────────────────┐
        │ Step 4: quantity break          │
        │ Does the quantity reach a bulk  │
        │ price band?                     │
        └───────────────┬─────────────────┘
                        ▼
        ┌────────────────────────────────┐
        │ Step 5: promotion               │
        │ Is an active promotion          │
        │ applicable to this product,     │
        │ this customer and this date?    │
        └───────────────┬─────────────────┘
                        ▼
              The price the customer sees
```

### Pricing levels

A pricing level is a named band assigned to a customer. The brief suggests: Standard, Wholesale Level 1, Wholesale Level 2, Wholesale Level 3, VIP and Special Customer Price. Administrators may create others.

A level may be expressed either as a percentage adjustment to the standard price, or as an explicit price per product. The second is more laborious to maintain but gives exact control, and wholesale pricing is usually exact rather than proportional.

**Gap in the brief.** The brief does not say which of these two forms a pricing level takes. This is a significant practical difference: a percentage level applies automatically to new products, whereas an explicit level requires every new product to be priced at every level before it can be sold.

### Customer-specific prices

A price agreed with one customer for one product, overriding their level. This is how a negotiated rate, settled on the telephone, is recorded.

Worked example, the same product seen by four parties:

| Who | What they see |
|---|---|
| Standard price | £25.00 |
| Customer A (Wholesale Level 1) | £22.00 |
| Customer B (Wholesale Level 2) | £20.00 |
| Customer C (negotiated price) | £18.50 |
| A visitor, or any unapproved customer | Nothing at all |

### Quantity price breaks

A product may carry bands based on how much is bought.

| Quantity | Price per carton |
|---|---|
| 1 to 4 cartons | £25.00 |
| 5 to 9 cartons | £23.00 |
| 10 or more cartons | £21.00 |

The system applies the correct band automatically as the quantity changes, and the basket updates accordingly. It is worth showing the customer how close they are to the next band, because it increases order sizes.

**Gap in the brief.** This is the most consequential unanswered question in the entire pricing area. When rules conflict, which wins?

Consider a customer with a negotiated price of £18.50, looking at a product whose quantity break offers £21.00 at ten cartons. The break is worse for them and should presumably be ignored. But if the break offered £17.00, should it override the negotiated price?

Two coherent answers exist:

1. **The customer always receives the lowest applicable price.** Simple to explain, generous, and predictable.
2. **A negotiated customer price overrides everything.** Gives ANAID exact control, but means a customer with a negotiated rate may pay more than one without.

These produce different invoices. The choice must be made deliberately, written down, and applied consistently, because whichever is chosen will eventually be questioned by a customer.

The same question arises between promotions and negotiated prices, and between promotions and quantity breaks.

### What is shown when the customer is not approved

| Account status | What appears where a price would be |
|---|---|
| Not logged in | Login and get approved to view price |
| REGISTERED | Login and get approved to view price |
| PENDING_APPROVAL | Price available after account approval |
| REJECTED | Price available after account approval |
| SUSPENDED | Price available after account approval |
| APPROVED | **Your Price: £22.00** |

In every case except the last, no price figure is sent to the device.

### Price security — the six checks

Before any price is returned, the system establishes all six of the following. If any fails, no price is returned.

1. The request comes from an authenticated account.
2. That account is linked to a customer record.
3. That customer's status is APPROVED.
4. The customer identifier in the request matches the authenticated account. A customer must never be able to ask for another customer's price by substituting an identifier.
5. The account has permission to view prices.
6. The correct pricing rule for that customer has been applied.

Point four is the one most often overlooked. If the system accepts a customer identifier supplied by the device and returns that customer's price, then any customer can read every other customer's pricing by changing a number. The identifier must come from the authenticated session, never from the request.

---

## 14. Stage 8 — The basket

### What this stage is for

To assemble an order, to show its true cost before commitment, and to prevent the customer from reaching checkout with an order that cannot be fulfilled.

### What it contains

For each line: the product image and name, the product code, the quantity, the applicable unit price, and the line total.

Beneath the lines:

```
Subtotal                    £412.00
VAT                          £82.40
Delivery                      £0.00   (free over £250)
                            ─────────
Total                       £494.40
```

### What the customer may do

Add a product, change a quantity, remove a line, and empty the basket. The basket is saved, so an order begun in the morning may be completed in the afternoon, or on a different device.

### The checks applied continuously

**Minimum order quantity.** Where a line falls below the product's minimum, the basket says so plainly:

> Minimum order quantity is 5 cartons.

Checkout is prevented until it is resolved.

**Stock.** If a product has become unavailable since it was added, the basket says so rather than allowing the customer to find out after ordering.

**Price changes.** If a price has changed since the product was added, the basket shows the current price. It does not honour the old one.

**Delivery charge.** Recalculated as the order value changes, and — where the customer is close to the free-delivery threshold — it is worth telling them:

> Spend £38.00 more for free delivery.

### Failure paths

| Situation | What happens |
|---|---|
| A product is deactivated while in the basket | The line is marked unavailable and must be removed before checkout. |
| Stock falls below the quantity in the basket | The available quantity is shown. |
| The price changes | The new price is shown, with a note that it has changed. |
| The session expires | The basket survives and is restored on the next login. |
| The customer is suspended while holding a basket | See the gap in Section 11. |

**Gap in the brief.** The brief specifies a minimum quantity per product but no minimum value for the order as a whole. Most distributors set one, because delivering a single carton across a city costs more than the margin on it.

**Gap in the brief.** The brief does not say whether the free-delivery threshold is measured before or after VAT. On an order near £250 this changes the result, and customers will notice.

---

## 15. Stage 9 — Checkout

### What this stage is for

To capture the delivery arrangements, and then to convert the basket into a binding order — but only after the system has independently verified every part of it.

### What the customer confirms

| Field | Required | Notes |
|---|---|---|
| Delivery address | Yes | Defaults to the address on the account. |
| Billing address | Yes | Defaults to the business address. |
| Contact number | Yes | Defaults to the number on the account. |
| Purchase order number | No | Many businesses require one on the invoice. |
| Delivery instructions | No | For example, "rear entrance, ring the bell". |
| Preferred delivery date | No | Subject to ANAID's delivery days for that area. |
| Delivery notes | No | |

### Payment method

| Method | Available to |
|---|---|
| Account / Invoice | Customers who have been granted credit |
| Online payment | Any approved customer, once a payment provider is connected |

Administrators may enable or disable each method from the settings screen.

### The recalculation

This is the most important process in the system.

Everything sent by the customer's device is treated as a request and nothing more. The device has said which products it wants and in what quantities. It has also said what it believes the prices and totals to be. **Those beliefs are discarded entirely.**

Working only from its own data, the system then establishes:

| # | Check | If it fails |
|---|---|---|
| 1 | The request comes from an authenticated account | The order is refused. |
| 2 | The account status is APPROVED, read now | The order is refused. |
| 3 | Every product still exists and is active | The line is identified to the customer. |
| 4 | Every product is available in the quantity requested | The available quantity is stated. |
| 5 | Every line meets its minimum order quantity | The minimum is stated. |
| 6 | The correct price for this customer, product and quantity | Recalculated from ANAID's data. |
| 7 | The correct VAT on each line | Recalculated. |
| 8 | The correct delivery charge for the value and the postcode | Recalculated. |
| 9 | The correct grand total | Recalculated. |
| 10 | For credit customers, that the limit is not exceeded | The available credit is stated. |

Only when all ten are satisfied is an order created.

The reason is not abstract. If the system accepted the total the device sent, a person could alter that device and buy ten thousand pounds of goods for a pound. This is among the most common ways commercial systems are defrauded. The defence is not to make devices harder to alter — that is impossible. The defence is to ignore entirely what the device says about money.

### The credit check

```
Credit limit                    £5,000.00
Outstanding balance             £1,200.00
                                ──────────
Available credit                £3,800.00

This order                        £494.40
                                ──────────
Remaining after this order      £3,305.60     ✓ Permitted
```

An order that would exceed the available credit is refused:

> This order would exceed your credit limit. Your available credit is £3,800.00. Please contact ANAID Quality Disposables Limited.

An authorised administrator may override the refusal. The override is recorded in the audit log with the identity of the person who made it.

**Gap in the brief.** The brief does not define what counts towards the outstanding balance. Two readings are possible: the total of unpaid invoices only, or that total plus orders placed but not yet invoiced. The second is the prudent choice, because under the first a customer could place several large orders in quick succession, before any is invoiced, and pass their limit unnoticed.

### The order number

A successful order receives a number in the form **ANAID-2026-000001**: unique, sequential, and carrying the year so that staff can read it at a glance.

### What the customer sees afterwards

A confirmation screen showing the order number, the full order, the delivery details and the total. A confirmation is also sent by email and, if configured, by text message.

### Failure paths

| Situation | What the customer sees |
|---|---|
| The account is no longer approved | A plain statement that the order cannot be placed. |
| A product has been deactivated | The line is identified; they are asked to remove it. |
| Stock is insufficient | The available quantity is stated. |
| A minimum order quantity is not met | The minimum is stated. |
| The credit limit would be exceeded | The available credit is stated. |
| Online payment fails | A clear message. The basket is preserved intact. |
| The network drops mid-submission | The order is not duplicated. Submitting twice must not create two orders. |
| An internal error occurs | A neutral apology and a reference number. No technical detail. |

That final row is a security measure as well as a courtesy. Technical error messages describe how a system is built, and that description is of considerable use to somebody attacking it.

The row above it is a genuine technical requirement, not a nicety. A customer on a poor mobile connection will press the button twice. The system must recognise the second attempt as a repeat of the first and not create a duplicate order.

---

## 16. Stage 10 — Fulfilment

### What this stage is for

To move the order through the warehouse and out to the customer, while keeping the customer informed without them having to telephone.

### The nine statuses

| # | Status | Meaning | Who advances it |
|---|---|---|---|
| 1 | Order Received | The order exists. ANAID has not yet looked at it. | The system, automatically |
| 2 | Order Confirmed | Staff have accepted it. | Sales |
| 3 | Processing | Preparation has begun. | Sales or Warehouse |
| 4 | Picking | Goods are being collected in the warehouse. | Warehouse |
| 5 | Packed | The order is assembled and ready to go. | Warehouse |
| 6 | Dispatched | It has left the premises. | Warehouse |
| 7 | Out for Delivery | It is with the driver. | Delivery |
| 8 | Delivered | The customer has received it. | Delivery |
| — | Cancelled | The order will not be fulfilled. | Sales or Super Administrator |

### What the customer sees

A simple progress indicator, and a notification at the points that matter: confirmed, dispatched, and delivered. Notifying at every one of the nine stages produces a great deal of noise for little benefit.

### What each role sees

| Role | Which orders | What they may do |
|---|---|---|
| Sales | All | Confirm, cancel, amend, change status up to Packed |
| Warehouse | Confirmed and beyond | Advance through Picking, Packed, Dispatched |
| Delivery | Dispatched and beyond | Advance to Out for Delivery and Delivered |
| Accounts | All, read only | Generate and manage invoices |

### Every status change is recorded

Each change records which member of staff made it and when. This produces a complete history of the order, which is what is needed when a customer telephones to ask where their delivery is.

### Failure paths

**Gap in the brief.** Partial fulfilment is not described. If the warehouse finds only six of the ten cartons ordered, there is no defined process for supplying six, adjusting the order, and invoicing accordingly. This occurs regularly in distribution, and without a process staff will resort to cancelling and re-entering orders, which destroys the history.

**Gap in the brief.** Cancellation is listed as a status but no rules surround it. It is not stated whether a customer may cancel their own order, up to which stage cancellation is permitted, what happens to stock that was reserved, what happens to a payment already taken, or whether the customer is notified.

**Gap in the brief.** Order amendment is not described at all. A customer telephones to add two more cartons to an order placed an hour ago. Staff need to amend it, and the amendment must recalculate the price, the VAT, the delivery charge and the credit check — and must be recorded.

---

## 17. Stage 11 — Invoicing, payment and credit

### The invoice

| Section | Contents |
|---|---|
| ANAID's details | Company name, address, telephone, email, website, VAT registration number, company registration number |
| Customer details | Business name, customer number, billing address, contact name |
| Invoice details | Invoice number, order number, invoice date, due date, purchase order reference |
| Lines | Product code, description, quantity, unit price, VAT rate, line total |
| Totals | Subtotal, VAT, delivery charge, grand total |
| Payment | Payment terms, payment status, ANAID's bank details |

### Why invoice prices are frozen

The prices on an invoice are those recorded on the order at the moment it was placed. They are never recalculated.

If ANAID raises a price the following week, last week's invoice is unaffected. This is why an order line stores the price charged rather than pointing at the product's current price. It is a small decision in the data design with large consequences: without it, reprinting an old invoice would produce different figures from the original, which is both commercially embarrassing and unacceptable to an accountant.

### What staff may do

| Action | Role |
|---|---|
| Generate an invoice from an order | Accounts, Super Administrator |
| Produce a PDF | Accounts, Super Administrator |
| Send by email | Accounts, Super Administrator |
| Mark as paid | Accounts, Super Administrator |
| Mark as unpaid | Accounts, Super Administrator |
| Record a payment | Accounts, Super Administrator |

### What the customer may do

View their own invoices, filter them by date and by payment status, and download them.

### Credit

For customers trading on account, three figures are maintained and always shown together:

```
Credit limit          £5,000.00     Set by ANAID at approval or later
Outstanding           £1,200.00     Maintained by the system
                      ──────────
Available             £3,800.00     The difference
```

The credit limit is set by staff. The outstanding balance is calculated by the system and is never typed in by hand, because a hand-typed balance will drift out of step with reality.

Any change to a credit limit is written to the audit log.

### Failure paths

**Gap in the brief.** The brief does not say when an invoice is created. It says staff *can* generate one, implying a manual action, but does not rule out automatic generation on dispatch or on delivery. Manual generation risks invoices being forgotten. Automatic generation on dispatch risks invoicing goods that were never received.

**Gap in the brief.** No process is described for recording payments. A bank transfer arrives in ANAID's bank account, not in this system. Somebody must record it, decide which invoice it settles, and handle the case where one payment covers several invoices or only part of one. None of this is in the brief, and all of it is needed.

**Gap in the brief.** Credit notes and returns are not mentioned anywhere. A distributor will face rejected deliveries, damaged cartons and wrong items. Without credit notes, the only remedy is to alter an issued invoice, which is poor accounting practice and in some circumstances not permissible.

**Gap in the brief.** Overdue invoices are mentioned as something administrators are notified about, but no process follows from the notification. It is not stated whether reminders are sent automatically, whether the account is suspended after a period, or whether this is left entirely to staff judgement.

---

## 18. Stage 12 — Reordering

### Why this stage matters more than it appears to

The first order a customer places is a decision. The fiftieth is a habit. The purpose of this stage is to make the habit effortless, because a customer who can reorder in forty seconds from their telephone does not telephone a competitor.

### Buy Again

A list of every product the customer has previously purchased.

| Column | Contents |
|---|---|
| Product | Image and name |
| Last ordered quantity | For example, 10 cartons |
| Last order date | For example, 4 September 2026 |
| Current price | Their price, now |
| Action | Add to basket |

The *current* price is shown rather than the price previously paid. Showing the old price would mislead, and the customer would discover the difference at checkout.

The list may be searched and sorted, most usefully by how often the item is bought.

### Reorder a previous order

From any past order, one action adds every still-available line to the basket at the same quantities.

**Gap in the brief.** The brief says this adds all *available* items, correctly implying that discontinued or out-of-stock items are skipped. It does not say how prominently the customer must be told what was left out. Silently dropping a line is how a restaurant discovers on a Friday evening that no chip boxes arrived. The omission must be stated clearly and unmissably.

### Quick Order

For customers who already know what they want.

```
  Product code        Quantity
  ──────────────────  ─────────
  ANAID-HP10          10 cartons      ✓ Hinged Burger Box 10in
  ANAID-CUP12          4 cartons      ✓ Paper Cup 12oz
  ANAID-NAP200         2 cartons      ✓ White Napkin 2-ply
  ANAID-XXXX                          ✗ Product code not recognised
  ────────────────────────────────────────────────────────────────
                                        Add all to basket
```

As each code is typed, the product name appears, so the customer can confirm they have the right item. Unrecognised codes are flagged immediately rather than at submission.

### Favourites

Customers may mark any product as a favourite and order from that list directly. Where Buy Again reflects what has been bought, favourites reflect what the customer has chosen to remember.

---
---

# PART THREE — THE SUPPORTING AREAS

## 19. Product management

### What administrators may do

Create products, edit them, deactivate them, upload images, set prices, set stock levels, set VAT rates, set minimum order quantities, mark products as featured, and assign them to categories.

### Deactivation rather than deletion

A product that is no longer sold is marked inactive. It disappears from the customer catalogue and from search results. It is not deleted.

The reason is that orders and invoices refer to it. Deleting the product would leave historical records pointing at nothing, and reprinting an old invoice would fail. Every part of the system that holds history follows this same principle.

### Images

A product may have several. One is the principal image, shown in listings. Images should be stored at a size suitable for the largest screen and served at a size suitable for the screen actually viewing them, so that a customer on a mobile connection is not made to download a photograph intended for a desktop display.

### Failure paths

| Situation | What happens |
|---|---|
| A duplicate product code is entered | Refused. Product codes must be unique. |
| A product is deactivated while in customers' baskets | Those lines are marked unavailable. |
| A price is changed while orders are in progress | Existing orders keep their recorded prices. Baskets show the new price. |
| An image fails to upload | The product is still saved. The image may be added later. |

---

## 20. Categories

Administrators may create any number of categories and subcategories, of any depth the business requires.

Each category has a name, an optional description, an optional image, a position in the ordering, and a parent category if it is a subcategory.

A category containing products cannot simply be deleted. Either the products must be moved first, or the deletion must move them to an uncategorised holding area. The brief does not say which.

---

## 21. Product import and export

### Why import matters

ANAID will not enter several thousand products by hand. The system must accept a spreadsheet.

### The columns

| Column | Required | Notes |
|---|---|---|
| SKU | Yes | Must be unique |
| Product Name | Yes | |
| Category | Yes | Created if it does not exist, or rejected — see below |
| Brand | No | |
| Description | No | |
| Pack Size | No | |
| Carton Quantity | No | |
| Minimum Order | No | Defaults to 1 |
| Standard Price | Yes | |
| VAT | Yes | |
| Stock | No | Defaults to 0 |
| Barcode | No | |

### The import process

```
Administrator uploads the file
        │
        ▼
The file is read and checked, but nothing is saved
        │
        ▼
A preview is shown:
   • How many rows will be created
   • How many rows will update existing products
   • How many rows contain errors, and what those errors are
        │
   ┌────┴────┐
   ▼         ▼
Cancel    Confirm ──► The import is applied
```

Validation before saving is essential. An import that fails halfway leaves the catalogue in an unknown state, with some products updated and others not. Checking everything first, and saving only when everything passes, avoids this entirely.

**Gap in the brief.** The brief says the file should be validated and errors shown before completing the import, which is correct, but it does not say what happens to a file that is mostly valid. Two approaches are possible: refuse the whole file until every row is correct, or import the valid rows and report the rest. The first is safer and easier to reason about.

**Gap in the brief.** It is not stated whether an import creates categories that do not yet exist, or rejects rows naming an unknown category. Automatic creation is convenient but a single spelling mistake produces a duplicate category.

**Gap in the brief.** It is not stated whether an import updates existing products or only creates new ones. Updating is far more useful, since it is how a price list is refreshed, but it is also how an entire catalogue can be overwritten by accident.

### Export

Products may be exported in the same format, which gives ANAID a straightforward way to edit prices in bulk: export, edit in a spreadsheet, import again.

---

## 22. Inventory

### What is tracked

| Quantity | Meaning |
|---|---|
| Current stock | What is on the shelf now |
| Stock received | Deliveries in from suppliers |
| Stock sold | Reduced by customer orders |
| Stock adjustments | Corrections, breakages, stock counts |
| Low stock threshold | The level at which an alert is raised |

### The history

Every movement is recorded, never merely applied. A record holds the product, the type of movement, the quantity, the stock level before, the stock level after, the reason, who made it, and when.

Worked example:

| Date | Movement | Quantity | Before | After | By |
|---|---|---|---|---|---|
| 1 Sep | Opening position | — | — | 500 | System |
| 3 Sep | Received from supplier | +200 | 500 | 700 | Warehouse |
| 5 Sep | Sold, order ANAID-2026-000412 | −100 | 700 | 600 | System |
| 8 Sep | Adjustment, damaged | −4 | 600 | 596 | Warehouse |

The value of the history is that it answers the question "why does the system say 596 when I count 600?" Without it, that question cannot be answered and confidence in the figures collapses.

### Failure paths

**Gap in the brief.** The brief does not say when stock is reduced. Three points are possible: when the order is placed, when the order is picked, or when it is dispatched.

This matters most when two customers order the last carton within a minute of one another. If stock is reduced at order, the second customer is correctly refused. If stock is reduced at dispatch, both orders are accepted and one customer is disappointed later.

The usual answer in distribution is to *reserve* stock when the order is placed, and to *reduce* it when the order is dispatched. Reserved stock is unavailable to other customers but has not yet left the building, so the figure on the screen still matches the figure on the shelf. The brief does not describe reservation at all.

**Gap in the brief.** It is not stated whether a product may be sold when stock has reached zero. Some distributors allow it, fulfilling from the next delivery. Others refuse. The answer affects what the basket does.

---

## 23. Promotions

### What may be created

| Type | Example |
|---|---|
| New product | A badge drawing attention to a recent addition |
| Special price | A reduced price for a period |
| Quantity offer | Buy ten, receive a special rate |
| Free delivery | Delivery charge waived for a period or for a group |
| Customer special | An offer visible only to certain customers |

### What is configured

| Setting | Purpose |
|---|---|
| Start date | When it begins |
| End date | When it ends |
| Products | Which products it applies to |
| Customer group | Which customers see it, by pricing level or individually |
| Discount | The amount or percentage |
| Quantity requirement | Any minimum that must be met |

### Where promotions appear

On the customer's home screen, on product pages, and in the basket where the discount has been applied.

Promotions are never shown to customers who are not approved, because a promotion reveals price.

### Failure paths

**Gap in the brief.** The interaction between promotions and the rest of the pricing engine is not defined. If a customer has a negotiated price and a promotion also applies, does the promotion reduce the negotiated price further, or is it ignored? This is the same question raised in Section 13, and it needs one answer covering all of it.

**Gap in the brief.** It is not stated what happens to a promotion that expires while a customer holds the discounted item in their basket. Honouring the promotion is friendlier; recalculating is more correct.

---

## 24. Delivery management

### What administrators configure

| Setting | Example |
|---|---|
| Delivery areas | By postcode, or groups of postcodes |
| Delivery charge | Per area |
| Free delivery threshold | £250 |
| Delivery days | Which days each area is served |
| Delivery slots | Morning, afternoon, or specific times |
| Delivery notes | Standing instructions for an area |

### The rule as stated in the brief

```
Order value £250 or more  ──►  FREE DELIVERY
Order value below £250    ──►  Delivery charge applies
```

Both the threshold and the charge are configurable and may differ by area.

### What delivery staff see

The orders assigned to them, the delivery addresses, the contact numbers, the delivery instructions, and the ability to mark an order as out for delivery and then as delivered.

They see the delivery information they need. They do not see prices, invoices or credit information, because no part of their work requires it.

**Gap in the brief.** It is not stated whether the free-delivery threshold is measured before or after VAT. See Section 14.

**Gap in the brief.** It is not stated what happens when a customer's postcode falls outside every configured delivery area. Refusing the order is one answer; applying a default charge is another; flagging it for staff to price manually is a third.

---

## 25. Customer management

### Searching

Administrators may search by business name, contact name, telephone number, email address, customer number, postcode, business type, or account status.

### The customer profile

| Section | Contents |
|---|---|
| Account | Every field submitted at registration, plus the customer number, status, and dates |
| Commercial | Pricing level, customer-specific prices, credit limit, payment terms |
| Orders | Every order, with status and value |
| Invoices | Every invoice, with payment status |
| Payments | Every payment recorded |
| Balance | Outstanding, and credit available |
| Notes | Internal notes, each with author and date |
| History | Status changes, approvals, suspensions |

### What administrators may change

Account details, pricing level, customer-specific prices, credit limit, payment terms, account status, and notes.

Every one of these changes is written to the audit log, because every one of them has commercial consequences.

### What customers may change themselves

Their contact name, telephone number, additional contact number, delivery instructions, and — with appropriate care — their addresses.

They may not change their business name, their customer number, their pricing level, their credit limit or their account status. These are ANAID's to determine.

**Gap in the brief.** The brief says that sensitive changes should require additional verification but does not say which changes are sensitive or what the additional verification is. A reasonable reading is that changing the email address or telephone number — being the routes by which the account is accessed — should require a code sent to the existing address first.

---

## 26. Notifications

Three routes are supported: email, text message, and messages within the application.

### To customers

| Event | Suggested route |
|---|---|
| Account approved | Email and text message |
| Account rejected | Email |
| Account suspended | Email and text message |
| Order received | Email and in-app |
| Order confirmed | In-app |
| Order dispatched | Email and text message |
| Order delivered | In-app |
| Invoice generated | Email |
| Payment reminder | Email |
| Promotions | In-app, and email where marketing consent was given |

The last row carries a legal condition. Marketing communications may be sent only to customers who ticked the optional consent box at registration. Notifications about an order or an invoice are not marketing and may be sent regardless.

### To administrators

| Event | Who is notified |
|---|---|
| A new customer registers | Sales |
| A customer verifies their contact details | Sales |
| A customer is awaiting approval | Sales |
| A new order arrives | Sales, Warehouse |
| A payment is received | Accounts |
| Stock falls below its threshold | Warehouse |
| An invoice becomes overdue | Accounts |

### Configuration

Administrators may enable or disable each notification and choose its routes, without a developer.

**Gap in the brief.** Text messages cost money. A system that sends one at every stage of every order will cost more than expected. The brief does not address which notifications justify the cost, and the settings must allow ANAID to decide.

---

## 27. Staff roles and permissions

Five roles are defined. A member of staff has one role, and that role determines every screen and every action available to them.

### Super Administrator

Complete access to everything, including settings, staff accounts, and the audit log.

This role should be held by very few people. It can change prices, credit limits and permissions, and its actions are consequential.

### Sales Administrator

| Area | Access |
|---|---|
| Customers | Full |
| Customer approvals | Full |
| Orders | Full |
| Products | Full |
| Categories | Full |
| Pricing | Full |
| Inventory | View |
| Invoices | View |
| Reports | Sales reports |
| Settings | None |
| Staff accounts | None |

### Warehouse Staff

| Area | Access |
|---|---|
| Orders | View, and advance picking, packing and dispatch |
| Products | View |
| Inventory | Full, including adjustments |
| Customers | Delivery details only |
| Prices | **None** |
| Invoices | None |
| Reports | Inventory reports |

Warehouse staff do not see prices. Picking and packing an order does not require knowing what it cost, and confidential pricing should be visible to as few people as the work allows.

### Accounts Staff

| Area | Access |
|---|---|
| Invoices | Full |
| Payments | Full |
| Credit limits | Full |
| Customers | Financial information |
| Orders | View |
| Reports | Financial reports |
| Products | View |
| Inventory | None |

### Delivery Staff

| Area | Access |
|---|---|
| Orders | Dispatched orders only |
| Delivery status | Update to out for delivery and delivered |
| Customer delivery details | Address, contact number, instructions |
| Prices | **None** |
| Invoices | None |
| Everything else | None |

### How the restrictions are enforced

The same principle as customer approval applies. Hiding a menu item does not prevent a member of staff from reaching the screen behind it. Every request is checked on the server against the role of the person making it.

The test to apply is simple: if a member of the delivery staff typed the address of the pricing screen directly into their browser, the system must refuse them — not merely fail to offer them a link.

**Gap in the brief.** The brief does not say whether a member of staff may hold more than one role. A small distributor will have people who do two jobs. Allowing several roles, with the permissions combined, is more flexible.

---

## 28. Reports

| Report | Contents |
|---|---|
| Daily sales | Orders and value for a day |
| Weekly sales | Orders and value for a week |
| Monthly sales | Orders and value for a month |
| Annual sales | Orders and value for a year |
| Sales by customer | Which customers buy most |
| Sales by product | Which products sell most |
| Sales by category | Which parts of the range perform |
| Best-selling products | Ranked, over a chosen period |
| Customer growth | Registrations, approvals and rejections over time |
| Repeat orders | How many customers order again, and how often |
| Outstanding invoices | Unpaid invoices, with their age |
| Payment history | Payments received over a period |
| Inventory | Current stock across the range |
| Low-stock products | What needs reordering |

Every report may be filtered by date range and, where sensible, exported to a spreadsheet or a PDF.

Reports must remain fast as the data grows. A sales report covering three years must not require reading every order ever placed. This is a matter of how the data is stored and indexed, and is a consideration from the beginning rather than a problem to solve later.

---

## 29. Settings and branding

### Company details

Company name, trading name, address, telephone, email, website, VAT registration number, and company registration number. These appear on invoices and throughout the application.

### Branding

| Item | Purpose |
|---|---|
| Logo | Header, invoices, emails |
| Favicon / app icon | Browser tab and mobile home screen |
| Colours | The application's palette |

The logo must be replaceable from the settings screen, without a developer.

The visual identity should communicate wholesale supply, reliability, professionalism and speed. It should be clean and plain rather than decorative. The customers are business people placing repeat orders, not consumers being persuaded; clarity serves them better than style.

### Commercial settings

| Setting | Example |
|---|---|
| Default VAT rate | 20% |
| Delivery charge | £15.00 |
| Free delivery threshold | £250.00 |
| Payment methods enabled | Account: yes. Online: not yet |
| Currency | Pounds sterling |

### Operational settings

| Setting | Purpose |
|---|---|
| One-time code length | |
| One-time code validity | |
| Maximum code attempts | |
| Resend delay | |
| Approval settings | Whether staff are alerted immediately on each registration |
| Notification settings | Which notifications are sent, and by which route |
| Email settings | The provider's connection details |
| Text message settings | The provider's connection details |

The principle across all of these is that anything ANAID may reasonably wish to change should be changeable from a screen. A system that requires a developer to alter a delivery charge will not be maintained.

---

## 30. Audit logging

### What is recorded

Every action with commercial or security consequences.

| Action |
|---|
| Customer approved |
| Customer rejected |
| Customer suspended |
| Customer reinstated |
| Credit limit changed |
| Pricing level changed |
| Customer-specific price created or changed |
| Product price changed |
| Product created |
| Product deactivated |
| Stock adjusted |
| Order status changed |
| Order amended |
| Order cancelled |
| Invoice generated |
| Invoice marked paid |
| Credit limit override at checkout |
| Staff account created or changed |
| Staff permissions changed |
| Settings changed |

### What each entry holds

| Field | Purpose |
|---|---|
| Who | The member of staff |
| What | The action |
| When | Date and time |
| Which record | The customer, product, order or invoice affected |
| Before | The previous value, where a value changed |
| After | The new value |

Recording the before and after values is what makes the log useful. An entry saying only that a price was changed answers nothing; one saying it was changed from £25.00 to £19.00 by a named person at a named time answers everything.

### Who may read it

The Super Administrator only.

### The log is never edited

Entries are written and never altered or removed. A log that can be edited proves nothing.

---
---

# PART FOUR — MATTERS THAT CROSS THE WHOLE SYSTEM

## 31. Security

### The governing principle

> Never trust the frontend.

The customer's telephone and the member of staff's browser are outside ANAID's control. They can be modified. They can be inspected. They can be replaced altogether by a program pretending to be a customer.

Everything they send is a request. Nothing they send is a fact.

### The consequences of that principle

**Every request is checked.** Not only the first. Not only the ones that seem important. Every request that returns data or changes data establishes who is asking and what they are entitled to.

**Status is read fresh.** The account status is read from the database at the moment it is needed, never remembered from login. A customer suspended at eleven o'clock is refused at one minute past.

**Identifiers come from the session.** When a customer asks for their price, their orders or their invoices, the customer identity is taken from the authenticated session, never from the request. If it were taken from the request, any customer could read any other customer's data by changing a number.

**Money is calculated by the server.** Prices, VAT, delivery charges and totals are computed from ANAID's own data. Figures sent by the device are discarded without being read.

**Validation happens on the server.** Checks performed on the device are a convenience for the user. They are not security, because they can be removed.

### The measures required

| Measure | Purpose |
|---|---|
| Secure authentication | Establishing who a user is |
| One-time codes | Proving control of a telephone number or address |
| Role-based permissions | Confining staff to their own work |
| Server-side authorisation | Checking every request, without exception |
| Rate limiting | On registration, on code requests, on login, on search |
| Input validation | Everything received is checked for type, length and format |
| Secure data rules | The data layer itself refuses improper access |
| Audit logging | A record of who did what |
| Secure sessions | Expiry, and invalidation on logout |
| Encryption | Data protected in transit and, where appropriate, at rest |

### The two rules that matter most

**Price security.** Before any price is returned, all six checks in Section 13 must pass. A customer must never obtain another customer's price by any route.

**Order security.** Before any order is accepted, all ten checks in Section 15 must pass. The final price is always calculated by the system.

### The test to apply

For any new screen or function added to this system in future, ask one question:

> If somebody bypassed the application entirely and sent this request directly, would the system still refuse them?

If the answer is no, the protection is decoration.

---

## 32. Error handling

### The principle

Messages shown to customers state what happened and what to do about it. They never describe how the system is built.

A message reading *database connection timeout on table customer_pricing* tells an attacker the shape of the system. A message reading *We could not complete that request. Please try again* tells them nothing, and tells the customer just as much as they needed to know.

Technical detail goes to the log, where staff can find it, together with a reference number the customer can quote.

### The messages

| Situation | Message |
|---|---|
| Invalid one-time code | The code you entered is not correct. Please try again. |
| Expired one-time code | This code has expired. Please request a new one. |
| Too many code attempts | Too many incorrect attempts. Please request a new code. |
| Unknown login | We could not sign you in. Please check your details and try again. |
| Account pending | Your account is awaiting admin approval. |
| Account rejected | Your account has not been approved. |
| Account suspended | Your account has been temporarily suspended. |
| Product unavailable | This product is not currently available. |
| Insufficient stock | Only 6 cartons are currently available. |
| Minimum not met | Minimum order quantity is 5 cartons. |
| Credit limit exceeded | This order would exceed your credit limit. Your available credit is £3,800.00. |
| Payment failed | Your payment could not be completed. Your basket has been saved. |
| No network | You appear to be offline. Please check your connection. |
| Server error | Something went wrong at our end. Please try again shortly. Reference: A4F92. |

Every one of those states the problem in plain words and, where possible, gives the specific figure needed to resolve it. *Insufficient stock* is far less useful than *only 6 cartons are currently available*.

---

## 33. Performance

The system must remain usable at the scale ANAID expects to reach: thousands of products, thousands of customers, years of order history, several administrators working simultaneously, and many customers ordering at once.

| Technique | Purpose |
|---|---|
| Pagination | Long lists are returned in pages, never all at once |
| Indexing | The fields searched and filtered most often are indexed |
| Image optimisation | Images are served at a size suited to the screen viewing them |
| Caching | Data that rarely changes is not fetched repeatedly |
| Lazy loading | Content is loaded as it is needed rather than all at once |
| Efficient queries | A list of a hundred products is fetched in one request, not a hundred |

The last of these deserves a note, because it is the commonest cause of a system that works in testing and fails in use. If displaying a list of products requires one request for the list and then a further request for each product's price, a page of a hundred products makes a hundred and one requests. With ten products in testing this is imperceptible. With a full catalogue and thirty customers browsing, it is fatal.

The practical standard to aim for: a customer on a mobile connection in a kitchen should see the catalogue in under two seconds, and should be able to place a repeat order in under a minute.

---

## 34. Responsive design

### The customer application

Designed for the mobile telephone first. Larger screens are an improvement on that design, not the other way round.

At the foot of the screen, permanently:

```
┌────────┬──────────┬────────┬────────┬─────────┐
│  Home  │ Products │ Basket │ Orders │ Account │
└────────┴──────────┴────────┴────────┴─────────┘
```

Buttons are large. Text is legible without effort. Forms are short. Quantities are adjusted with clear plus and minus controls rather than by typing.

The person using this application is frequently standing in a kitchen or a stockroom, holding a telephone in one hand. The design must assume those conditions rather than a desk.

### The admin dashboard

Designed for the desktop, and usable on a tablet. Down the left-hand side:

```
┌──────────────────────┐
│ Dashboard            │
│ Customers            │
│ Customer Approvals   │
│ Orders               │
│ Products             │
│ Categories           │
│ Pricing              │
│ Inventory            │
│ Invoices             │
│ Payments             │
│ Deliveries           │
│ Promotions           │
│ Reports              │
│ Users & Permissions  │
│ Settings             │
└──────────────────────┘
```

### The dashboard itself

| Widget | Contents |
|---|---|
| Today's sales | Value taken today |
| Today's orders | Count placed today |
| Pending orders | Awaiting action |
| Pending customer approvals | Awaiting a decision |
| New customers | Recently registered |
| Outstanding invoices | Unpaid, with total value |
| Low-stock products | Below threshold |
| Best-selling products | Over a recent period |
| Top customers | By value |

### Screens to be tested

Small telephones, large telephones, tablets in both orientations, laptops, and desktop monitors.

---

## 35. Future integrations

None of the following is to be built now. The system must be structured so that each can be added later without rebuilding.

| Integration | What it would do |
|---|---|
| Stripe or similar | Card payment at checkout |
| Xero, Sage, QuickBooks | Invoices and payments flowing into the accounts |
| WhatsApp | Order confirmations and reminders |
| Text message provider | Codes and notifications |
| Email provider | Notifications and invoices |
| Warehouse management | Picking and stock at a larger scale |
| Barcode scanners | Picking and stock counting |
| Delivery management | Route planning and driver tracking |
| Driver application | Proof of delivery, signatures |
| Multiple warehouses | Stock held in more than one place |
| Product recommendations | Suggesting items a customer commonly buys together |
| Automatic reorder reminders | Prompting a customer when they are likely to be running low |

### What makes them possible later

The system should be built so that each external service is reached through a single, replaceable component. Sending a text message should be one clearly defined function that the rest of the system calls. Changing the provider then means changing that one function.

Where this is not done — where sending a text message is written inline at each of the fifteen places a message is sent — changing provider means finding and changing fifteen places, and one will be missed.

The same applies to payment, to email, to accounting, and to every other outside service.

---
---

# PART FIVE — THE GAP REGISTER

The original brief is unusually thorough. The following questions are nonetheless not settled by it. Each is listed with its consequence and the options available. None is answered here, because each is a business decision rather than a technical one.

They are ordered by how much difficulty they will cause if left unanswered.

### 1. Which pricing rule wins when rules conflict

**Where:** Sections 13, 23.
**The question:** When a negotiated customer price, a quantity break and a promotion all apply to the same line, which determines the price?
**Why it matters:** Different answers produce different invoices. A customer will eventually query it.
**Options:** The customer always receives the lowest applicable price; or a negotiated price overrides all others; or a defined order of precedence is set down.

### 2. When stock is reduced, and whether it is reserved

**Where:** Section 22.
**The question:** Is stock reduced when the order is placed, when it is picked, or when it is dispatched?
**Why it matters:** Determines what happens when two customers order the last carton.
**Options:** Reserve at order and reduce at dispatch, which is the usual approach in distribution; or reduce at order; or reduce at dispatch with no reservation and accept occasional disappointment.

### 3. Whether a business may have more than one login

**Where:** Section 4.
**The question:** May a restaurant have separate logins for its owner and its manager?
**Why it matters:** This is the most likely cause of a future rebuild. Adding multiple users to a system designed for one is substantially harder than allowing for it at the start.
**Options:** One login per business; or several logins under one customer account, optionally with different powers.

### 4. Whether a one-time code is required at every login

**Where:** Section 12.
**The question:** Must a code be entered each time, or may a device be remembered?
**Why it matters:** Affects both the daily experience of the customer and ANAID's text message costs.
**Options:** A code every time; or a code on a new device, remembered thereafter for a set period; or a password with a code as a second factor.

### 5. Partial fulfilment

**Where:** Section 16.
**The question:** What happens when the warehouse can supply only part of an order?
**Why it matters:** It happens regularly. Without a process, staff will cancel and re-enter orders, destroying the history.
**Options:** Amend the order and invoice for what was supplied; or ship in part and carry the remainder forward; or cancel the shortfall and notify the customer.

### 6. Returns and credit notes

**Where:** Section 17.
**The question:** Not mentioned anywhere in the brief. How are rejected deliveries, damaged goods and wrong items handled?
**Why it matters:** Without credit notes, the only remedy is to alter an issued invoice, which is poor practice.
**Options:** Build credit notes into the first version; or handle them outside the system initially and add them later.

### 7. What happens to work in progress when a customer is suspended

**Where:** Sections 3, 11.
**The question:** Does a suspended customer keep their basket, their in-flight orders, and sight of their unpaid invoices?
**Why it matters:** Suspension is usually for non-payment. A customer who cannot see their invoices cannot pay them.
**Options:** Complete existing orders and keep invoices visible, but permit no new orders; or withdraw all access beyond browsing.

### 8. What counts towards the outstanding balance

**Where:** Section 15.
**The question:** Unpaid invoices only, or unpaid invoices plus orders not yet invoiced?
**Why it matters:** Under the first, a customer could place several large orders before any is invoiced and pass their credit limit unnoticed.
**Options:** Invoices only; or invoices plus uninvoiced orders, which is the prudent choice.

### 9. When invoices are generated

**Where:** Section 17.
**The question:** Manually by staff, or automatically at dispatch or delivery?
**Why it matters:** Manual generation risks invoices being forgotten. Automatic generation risks invoicing goods never received.
**Options:** Manual; or automatic on dispatch; or automatic on delivery; or automatic with staff review before sending.

### 10. How payments are recorded

**Where:** Section 17.
**The question:** A bank transfer arrives in ANAID's bank, not in this system. Who records it, and how are part payments and payments covering several invoices handled?
**Why it matters:** Without an answer, outstanding balances will be wrong.
**Options:** Manual entry by accounts staff; or a bank feed, later; or accounting software integration, later.

### 11. Cancellation and amendment rules

**Where:** Section 16.
**The question:** May customers cancel their own orders, and up to which stage? May staff amend an order after it is placed?
**Why it matters:** Customers telephone to change orders constantly. Without amendment, staff will cancel and re-enter.
**Options:** Customer cancellation up to Order Confirmed; staff amendment up to Picking, with full recalculation and an audit entry.

### 12. The status for *Request more information*

**Where:** Section 10.
**The question:** The action is listed but no status corresponds to it.
**Options:** A sixth status; or PENDING_APPROVAL carrying a flag, which is simpler.

### 13. Whether staff may create customer accounts directly

**Where:** Section 10.
**The question:** Can an existing telephone-ordering customer be set up by staff without registering themselves?
**Why it matters:** Without it, every current ANAID customer must register before the system can be used for them.
**Options:** Staff create the account and invite the customer; or every customer registers.

### 14. Minimum order value

**Where:** Section 14.
**The question:** The brief sets minimum quantities per product but no minimum value for the order.
**Why it matters:** Delivering a single carton across a city costs more than the margin on it.

### 15. Whether the delivery threshold is measured before or after VAT

**Where:** Sections 14, 24.
**The question:** On an order near £250, this changes the result.

### 16. How pricing levels are expressed

**Where:** Section 13.
**The question:** A percentage adjustment to the standard price, or an explicit price per product per level?
**Why it matters:** A percentage applies automatically to new products. An explicit price requires every new product to be priced at every level before it can be sold.

### 17. Whether both telephone and email must be verified

**Where:** Section 8.
**The question:** One or both?
**Why it matters:** Invoices go by email and delivery notices by text message. If only one route is verified, the other may not work when needed.

### 18. The values behind the one-time code rules

**Where:** Section 8.
**The question:** Code length, validity period, attempt limits and rate limits are all required but none is given a figure.
**Note:** These should be adjustable from settings rather than fixed.

### 19. How reinstatement works

**Where:** Section 2.
**The question:** How does an account leave REJECTED or SUSPENDED? No action is defined.

### 20. Import behaviour

**Where:** Section 21.
**The questions:** Does a partly valid file import the valid rows or none? Does an import create unknown categories? Does an import update existing products or only create new ones?

### 21. What happens to abandoned registrations

**Where:** Section 7.
**The question:** Accounts that verify their details are never reviewed and never deleted. They accumulate, holding personal information for no purpose.

### 22. Duplicate application detection

**Where:** Section 7.
**The question:** Should the system detect a business applying twice, and on what basis?

### 23. Overdue invoice process

**Where:** Section 17.
**The question:** Administrators are notified, but no process follows. Are reminders automatic? Is the account suspended after a period?

### 24. Whether staff may hold more than one role

**Where:** Section 27.
**The question:** A small distributor will have people who do two jobs.

### 25. Which notifications justify their cost

**Where:** Section 26.
**The question:** Text messages are charged for. Sending one at every stage of every order will cost more than expected.

---
---

# PART SIX — SUGGESTED BUILD ORDER

The brief sets out what should be built first. The following expands that into a sequence, each phase producing something that works before the next begins.

### Phase 1 — The foundation

The account statuses, the permission rules, and the principle that every request is checked on the server. Staff accounts and roles. The settings screen.

Nothing visible to a customer is produced by this phase. Everything afterwards depends on it, and retrofitting it is close to impossible.

### Phase 2 — The catalogue

Products, categories, images, search and filtering. The customer-facing catalogue, with no prices shown to anybody.

At the end of this phase ANAID has a browsable catalogue, which is useful on its own.

### Phase 3 — Registration and approval

The registration form. One-time code verification. The pending state. The Customer Approvals queue. Approve, reject and suspend. Customer numbers. Approval notifications.

At the end of this phase the central rule of the system is working: customers can register, and ANAID can approve them.

### Phase 4 — Pricing

Pricing levels, customer-specific prices, quantity breaks, and the six price-security checks. Prices become visible to approved customers and to nobody else.

### Phase 5 — Ordering

The basket, the checkout, the ten order-security checks, order creation, order numbers, and order statuses. Customer order history. Administrative order management.

At the end of this phase the system can take an order, which is the point of it.

### Phase 6 — Inventory and invoicing

Stock tracking, movements and history, low-stock alerts. Invoice generation, PDFs, emailing, and payment status. Credit limits and outstanding balances.

### Phase 7 — Making it fast to use again

Buy Again, reorder from a previous order, Quick Order, favourites. The customer dashboard.

This phase is what turns a system that can take an order into one that customers prefer to the telephone.

### Phase 8 — The remainder

Promotions. Reports. Product import and export. Order export. Delivery management. The full notification set. Audit log review.

---

## A closing note on the central rule

Every part of this document serves one requirement, which is worth restating in the terms the brief used:

> **REGISTER → VERIFY OTP → WAIT FOR ANAID ADMIN APPROVAL → ADMIN APPROVES → CUSTOMER LOGS IN → CUSTOMER CAN SEE THEIR PRICES → CUSTOMER CAN ORDER**

A customer who has verified their telephone number or email address, but who has not been approved by an ANAID administrator, must never see a product price and must never be able to place an order.

This is not enforced by hiding prices on a screen. It is enforced by refusing to send them, on every route, on every request, with the account status read fresh from the database each time.

If any single part of this system is built correctly, it should be that one.

---

*End of Level 4.*

