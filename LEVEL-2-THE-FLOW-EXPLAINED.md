# ANAID Quality Disposables Limited
## B2B Ordering and Distribution Platform

### Level 2 — The Flow Explained

*This document takes the twelve stages from Level 1 and breaks each one into its individual steps. At every stage, the customer's actions are described first, then the actions ANAID staff take in response. Level 3 will explain why each step exists and what happens when it goes wrong.*

---

## Before anything: the visitor

A person arrives at the ANAID website or opens the ANAID application. They have no account. They have not logged in.

They are permitted to do the following:

- View the home page.
- View the list of product categories.
- Browse all active products.
- Search for products by name.
- Read product descriptions, pack sizes and carton quantities.
- Register for an account.
- Log in, if they already have one.

They are **not** permitted to see any price, any basket, any order, any invoice, or any credit information. Where a price would normally appear, the system displays a short message inviting them to register.

The purpose of this is commercial. ANAID wants prospective customers to see the range of products it carries. It does not want anybody to see what it charges.

---

## Stage 1 — Registration

### The customer

```
Opens registration form ──► Fills in details ──► Accepts terms ──► Submits
```

The customer completes a form describing their business. The form asks for the business name, the name of the person to contact, a mobile telephone number, an email address, the business address, the delivery address, the postcode, and the type of business.

The business type is chosen from a fixed list, which includes restaurant, takeaway, café, fast food, bakery, catering company, hotel, public house, food truck, supermarket, convenience store, and other.

Some further information may be given but is not required. This includes the VAT number, the company registration number, a website, a second contact number, a purchase-order reference, and any notes the customer wishes to add.

Before the form can be submitted, the customer must tick boxes confirming that they accept the terms and conditions and the privacy policy. A third box, offering to receive marketing communications, is optional.

### The system

An account record is created. It is immediately given the status **REGISTERED**. At this point the account can do nothing at all.

### ANAID staff

Nothing happens on the ANAID side yet. The application is not shown to staff until the contact details have been verified, so that abandoned or fraudulent submissions do not fill the review queue.

---

## Stage 2 — Verifying the contact details

### The customer

```
Receives a code ──► Enters the code ──► Code is accepted
                          │
                          └──► Code is wrong or expired ──► Tries again
```

Immediately after registration, the system sends a one-time passcode to either the mobile number or the email address the customer supplied. The customer enters this code into the application.

The code expires after a short period. The customer may request a new one. The number of attempts is limited, and the number of codes that may be requested in a given period is also limited.

### The system

If the code is correct, the account status changes from **REGISTERED** to **PENDING_APPROVAL**.

The customer is shown a clear message:

> Your contact details have been verified. Your account is now awaiting approval from ANAID Quality Disposables Limited.

This wording matters. It tells the customer that something has succeeded, and simultaneously that they cannot yet trade. Verification and approval are deliberately presented as two separate things.

### ANAID staff

A notification is now raised. The application enters the **Customer Approvals** queue in the admin dashboard.

---

## Stage 3 — Waiting

### The customer

The customer may log in. They may browse and search the full product catalogue. They may read every product page.

Wherever a price would appear, they instead see wording such as:

> Price available after account approval.

A banner is displayed across the application reminding them of their position:

> Your account is currently awaiting approval from ANAID Quality Disposables Limited.

They cannot add anything to a basket. There is no basket. They cannot reach a checkout, an order history, or an invoice.

### ANAID staff

The application sits in the approvals queue with a visible registration date, so that older applications are not overlooked.

---

## Stage 4 — Admin review

### ANAID staff

```
Opens queue ──► Opens application ──► Reads details ──► Decides
```

A member of staff with the appropriate permission opens the **Customer Approvals** section. They see a list showing, for each applicant, the contact name, the business name, the telephone number, the email address, the business type, the registration date, whether the contact details were verified, and the current account status.

Opening an individual application shows everything the customer submitted. Staff may add an internal note, which the customer never sees.

Four actions are available:

| Action | Effect |
|---|---|
| **Approve** | The account becomes fully usable |
| **Reject** | The application is declined |
| **Request more information** | The applicant is asked for further detail |
| **Suspend** | Used mainly for existing customers, not new applicants |

When approving, staff also assign the commercial terms: which pricing level the customer belongs to, and, if credit is being offered, the credit limit and payment terms.

### The customer

The customer sees nothing change until a decision is made.

---

## Stage 5 — The decision takes effect

```
                    ┌──────────────────┐
                    │ PENDING_APPROVAL │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
   ┌──────────┐        ┌──────────┐        ┌───────────┐
   │ APPROVED │        │ REJECTED │        │ SUSPENDED │
   └──────────┘        └──────────┘        └───────────┘
   Prices: yes         Prices: no          Prices: no
   Orders: yes         Orders: no          Orders: no
   Browse: yes         Browse: yes         Browse: yes
```

The customer is notified by email, by text message, or within the application itself, according to how the system has been configured.

On approval, the message reads:

> Your ANAID Quality Disposables account has been approved. You can now log in to view your prices and place orders.

On rejection:

> Your ANAID Quality Disposables account application has not been approved. Please contact us for further information.

On suspension:

> Your ANAID Quality Disposables account has been temporarily suspended. Please contact ANAID Quality Disposables Limited.

Approval is also the moment the customer receives their permanent customer number, in the form **ANAID-C00001**. This number appears on their account page, on every order, and on every invoice.

---

## Stage 6 — Logging in

### The customer

```
Enters phone or email ──► Receives code ──► Enters code ──► Status is checked
```

The customer identifies themselves by mobile number or email address. A one-time code is sent and entered, exactly as during registration.

Once the code is accepted, the system checks the account status before granting access. The outcome depends entirely on that status:

| Status | What the customer reaches |
|---|---|
| **APPROVED** | The full customer dashboard |
| **PENDING_APPROVAL** | A holding screen: the account is awaiting approval |
| **REJECTED** | A holding screen: the account was not approved |
| **SUSPENDED** | A holding screen: the account is temporarily suspended |

In the three non-approved cases the customer may still browse the catalogue, but without prices.

---

## Stage 7 — Browsing with prices

### The customer

An approved customer sees their dashboard, headed with their business name. From here they can reach the product catalogue, a quick-order screen, their previous purchases, their orders, their invoices, their favourites, and their account details.

Products now display a price. Critically, it is *their* price.

Three things determine the number shown:

1. **The pricing level** assigned to their account. ANAID maintains several, for example Standard, Wholesale Level 1, Wholesale Level 2, Wholesale Level 3 and VIP.
2. **Any price set specifically for that customer**, which overrides the level.
3. **The quantity being ordered**, where bulk price breaks exist. For example, one to four cartons at one rate, five to nine at a lower rate, and ten or more at a lower rate again.

A different customer looking at the same product at the same moment may see a different figure. Neither can see the other's.

### ANAID staff

Staff maintain the catalogue: products, categories, images, descriptions, stock levels and prices. They set the pricing levels, the per-customer overrides and the quantity breaks.

---

## Stage 8 — The basket

### The customer

The customer adds products and sets quantities. The basket shows, for each line, the product, the quantity, the applicable unit price and the line total. Beneath the lines it shows the subtotal, the VAT, the delivery charge and the grand total.

Two checks are applied continuously:

- **Minimum order quantity.** Many wholesale products cannot be bought below a certain quantity. If the customer is below it, the basket says so plainly and the checkout is blocked.
- **Delivery charge.** ANAID sets a threshold above which delivery is free. Below it, a charge applies. Both figures are configurable.

---

## Stage 9 — Checkout

### The customer

The customer confirms the delivery address, the billing address, a contact number, a purchase-order reference if their business uses one, any delivery instructions, and a preferred delivery date.

They then choose how to pay. Two methods are envisaged: payment on account, for customers who have been granted credit, and online card payment.

A final summary is shown, and the order is placed.

### The system

Before accepting the order, the system independently recalculates everything. It does not trust any figure sent by the customer's device. It confirms that the account is approved, that every product is still active and available, that minimum quantities are met, that the correct prices have been applied, and — for credit customers — that the order will not push them beyond their credit limit.

Only when all of these pass is an order created and given a number, in the form **ANAID-2026-000001**.

---

## Stage 10 — Fulfilment

The order moves through a fixed sequence of statuses. ANAID staff advance it; the customer watches it.

```
Order Received ──► Order Confirmed ──► Processing ──► Picking ──► Packed
      ──► Dispatched ──► Out for Delivery ──► Delivered

                    (Cancelled may occur instead)
```

Warehouse staff see the orders they need to pick and pack. Delivery staff see the orders they need to take out. Each role sees only what its work requires.

---

## Stage 11 — Invoicing and payment

An invoice is produced carrying ANAID's company details, the customer's details, the invoice number, the related order number, the invoice date, the due date, every line with its quantity and unit price, the VAT, and the total.

Staff can generate it, send it by email, produce a PDF copy, and mark it paid or unpaid. The customer can view and download their own invoices at any time.

For customers trading on credit, the account carries three linked figures: the credit limit, the amount currently outstanding, and the difference between them, which is the credit still available.

---

## Stage 12 — Reordering

This is the stage that determines whether the system is genuinely useful day to day.

Three routes are offered:

- **Buy Again.** A list of everything the customer has previously purchased, showing the last quantity ordered, the date, and the current price, with a button to add it straight to the basket.
- **Reorder a previous order.** Every still-available item from an earlier order is added to the basket in one action.
- **Quick Order.** A screen for customers who already know what they want. They type a product code and a quantity, repeatedly, and add the lot to the basket.

A busy restaurant manager should be able to repeat last week's order from a telephone in under a minute.

---

## Where the brief leaves questions open

The original brief is detailed, but a small number of decisions are not settled by it. They are listed here because each one changes how the system behaves, and each will have to be answered before building.

1. **Which price wins when rules conflict?** If a customer has a negotiated price of £18.50, and a bulk rule offers £21.00 at ten cartons, and a promotion offers a further discount, the brief does not state the order of precedence.
2. **Is a one-time code required at every login?** The brief describes codes at login but never mentions a password. Requiring a code every time is secure but slow for a daily user.
3. **Can one business have more than one login?** A restaurant may have an owner and a manager who both order. The brief describes one account per business.
4. **When is stock reduced?** At the moment the order is placed, or when it is picked, or when it is dispatched? This determines what happens when two customers order the last carton.
5. **What happens to an order already in progress if the customer is suspended?**
6. **Are returns and credit notes required?** They are not mentioned at all, but a distributor will need them.

These are examined in full, alongside others, in Level 4.

---

*Continue to **Level 3 — The Flow in Detail** for the same stages with their reasoning, their variations and their failure paths.*
