# ANAID Quality Disposables Limited
## B2B Ordering and Distribution Platform

### Level 3 — The Flow in Detail

*This document follows the same twelve stages described in Levels 1 and 2. It adds three things to each stage: what is asked for and why, what happens when something goes wrong, and what the person sees immediately afterwards. Level 4 adds the remaining detail — every individual field, message and rule — together with the areas of the system that sit outside the main flow.*

---

## How to read this document

Each stage is set out in the same shape:

1. **Purpose.** Why the stage exists at all.
2. **The steps.** What happens, in order.
3. **The customer's side.** What the business owner does and sees.
4. **ANAID's side.** What staff do and see.
5. **When it goes wrong.** The failure paths, and what the system does about each.

Where the original brief does not settle a question, the point is marked **Gap in the brief** and left open rather than answered by assumption.

---

## The vocabulary

These terms are used throughout. They are defined once here.

| Term | Meaning |
|---|---|
| **Customer** | A business that buys from ANAID. Not an individual member of the public. |
| **Account status** | The state of a customer's account. It controls what that customer may do. There are five: REGISTERED, PENDING_APPROVAL, APPROVED, REJECTED and SUSPENDED. |
| **Approval** | A deliberate decision by an ANAID member of staff that ANAID is willing to trade with a business. |
| **Verification** | Proof that a telephone number or email address genuinely belongs to the person using it. This is not approval. |
| **OTP** | A one-time passcode. A short number, valid briefly, sent by text message or email, used to prove identity. |
| **Pricing level** | A named band of prices, such as Wholesale Level 2, which is assigned to a customer and determines what they pay. |
| **SKU** | Stock keeping unit. The short code that identifies one specific product, for example ANAID-HP10. |
| **Carton** | The standard wholesale unit of sale. A carton contains a fixed number of individual items. |
| **Minimum order quantity** | The smallest amount of a given product that may be bought. |
| **Backend** | The part of the system that runs on ANAID's own servers. It holds the data and enforces the rules. |
| **Frontend** | The part that runs on the customer's telephone or in their web browser. It displays things. It decides nothing. |

---

## The two applications, and why they are separate

The system presents two quite different interfaces to two quite different groups of people.

**The customer application** is used by business owners and managers, usually on a mobile telephone, often while standing in a kitchen or a stockroom. It must be fast, simple and usable with one hand. It is built mobile-first, meaning the small screen is designed properly first and larger screens are treated as an improvement rather than the other way round. At the foot of the screen sits a permanent bar of five destinations: Home, Products, Basket, Orders and Account.

**The admin dashboard** is used by ANAID staff at a desk. It must be dense, precise and comprehensive. Down the left-hand side runs a list of every area of the business: Dashboard, Customers, Customer Approvals, Orders, Products, Categories, Pricing, Inventory, Invoices, Payments, Deliveries, Promotions, Reports, Users and Permissions, and Settings.

They are separate because the two audiences need opposite things. What they share is the backend. There is one set of data and one set of rules, and both applications must ask the backend for permission to do anything at all.

---

## Stage 0 — The visitor who has not registered

### Purpose

To let a prospective customer see what ANAID sells, so that they have a reason to apply for an account, while revealing nothing commercially sensitive.

### What the visitor can do

They may view the home page, browse the category list, open any active product, read its description, see its pack size and carton quantity, and search the catalogue. They may begin registration or log in.

### What the visitor cannot do

They cannot see any price. They cannot open a basket, because no basket exists for them. They cannot reach any checkout, order or invoice screen.

Where a price would appear, the product page instead shows:

> **Login and get approved to view price**

### When it goes wrong

The important failure here is not a visible one. It is the possibility that a visitor obtains prices by some route other than the screen — by inspecting the data the page received, by calling the system directly, or by using the search function to reveal figures the product page withholds.

The system therefore does not send the price at all. A product sent to an unauthenticated visitor simply has no price in it. There is nothing to uncover, because nothing was transmitted. This same principle applies to every route into the data: the product list, the individual product, the search results and any other.

---

## Stage 1 — Registration

### Purpose

To collect enough information for ANAID to make an informed decision about whether to trade with this business, and enough to deliver to them afterwards.

### What is asked, and why

**Required:**

| Field | Why it is needed |
|---|---|
| Business name | This is the trading identity. It appears on orders and invoices. |
| Contact person's name | Staff need to know who to speak to. |
| Mobile number | Used for verification, for delivery coordination, and for notifications. |
| Email address | Used for verification, for invoices, and for notifications. |
| Business address | The registered or trading address, used for invoicing. |
| Delivery address | Often different from the business address. The warehouse needs this. |
| Postcode | Determines the delivery area and therefore the delivery charge. |
| Business type | Tells ANAID what kind of trade this is, which affects pricing and credibility. |

**Optional:**

VAT number, company registration number, website, an additional contact number, a purchase-order reference, and free-text notes.

The optional fields matter more than they appear to. A VAT number and a company number allow ANAID staff to confirm quickly that a real, trading business is applying. Their absence is not disqualifying, but their presence speeds approval considerably.

### Consent

Three checkboxes are presented. Two are compulsory: acceptance of the terms and conditions, and acceptance of the privacy policy. The third, consent to receive marketing communications, is optional and must not be ticked by default.

The date and time of each consent is recorded against the account. Under United Kingdom data protection law, ANAID must be able to demonstrate that consent was given, and when.

### What happens on submission

The account is created with the status **REGISTERED**. In this state it can do nothing. It cannot log in to anything useful. It exists only so that the verification step has something to attach itself to.

### When it goes wrong

| Situation | What the system does |
|---|---|
| A required field is empty | The form identifies the specific field and refuses to submit. |
| The email address is malformed | The form says so before submission. |
| The telephone number is not a valid United Kingdom mobile number | The form says so before submission. |
| The email address is already registered | The customer is told the address is in use and invited to log in instead. |
| The same business applies twice | Two applications appear in the approvals queue. Staff must resolve this manually. |

**Gap in the brief.** The brief does not say whether duplicate registrations should be detected automatically — by matching the business name, the postcode or the VAT number — or left entirely to staff. Automatic detection reduces staff effort but produces false matches where two genuinely different businesses share a building.

---

## Stage 2 — Verifying the contact details

### Purpose

To establish that the telephone number and email address given are real and are controlled by the applicant. This prevents a person from registering hundreds of fictitious businesses, and ensures ANAID can actually reach the customer later.

It is essential to understand what this step does **not** do. It proves control of a telephone number. It proves nothing whatever about whether the business is real, is creditworthy, or is somebody ANAID wishes to supply. That judgement is made by a person, at Stage 4.

### The steps

```
Registration complete
        │
        ▼
System generates a code ──► Sends by SMS or email
        │
        ▼
Customer enters the code
        │
    ┌───┴────┐
    ▼        ▼
 Correct   Incorrect ──► Attempt counted ──► Too many? ──► Locked out
    │
    ▼
Status becomes PENDING_APPROVAL
```

### The protections that surround it

A one-time code is a short number. A short number can be guessed. Several protections are therefore applied together, and each one closes a gap the others leave open.

- **Expiry.** The code stops working after a short period. This limits how long an attacker has.
- **Limited attempts.** After a small number of wrong entries, that code is destroyed and a new one must be requested. This prevents guessing.
- **Limited requests.** A customer may only request so many codes in a given period. This prevents somebody from generating thousands of text messages, which cost ANAID money and may be used to harass a stranger whose number was entered.
- **Single use.** Once a code has been accepted it can never be used again.
- **Not readable at rest.** The code is not stored in a form that could be read by anybody who obtained access to the database.
- **Uninformative errors.** The system does not say whether a code was wrong or merely expired in a way that would help an attacker distinguish the two.

### What the customer sees afterwards

> Your contact details have been verified. Your account is now awaiting approval from ANAID Quality Disposables Limited.

This wording is chosen carefully. It confirms success, and in the same breath sets the expectation that access has not yet been granted. A customer who believes verification was approval will attempt to order, fail, and telephone ANAID. Clear wording here prevents that call.

### When it goes wrong

| Situation | What the customer sees |
|---|---|
| Wrong code | The code entered is not correct. Please try again. |
| Expired code | This code has expired. Please request a new one. |
| Too many wrong attempts | Too many incorrect attempts. Please request a new code. |
| Too many codes requested | Please wait before requesting another code. |
| The message never arrived | A resend option, and after repeated failure, ANAID's telephone number. |

**Gap in the brief.** The brief does not state whether both the telephone number and the email address must be verified, or only one of them. Verifying only one is faster. Verifying both means every notification route is known to work.

---

## Stage 3 — Waiting for approval

### Purpose

To hold the customer in a useful, clearly explained state while a human decision is made.

This stage is often treated as dead time. It should not be. A customer who is browsing the catalogue while they wait arrives at approval already knowing what they want to buy.

### What the customer can do

Everything a visitor can do, and nothing more. Browse, search, read. The only difference between a pending customer and an anonymous visitor is that the pending customer is logged in and is shown a message about their own position.

Where a price would be, they see:

> **Price available after account approval**

And across the application:

> Your account is currently awaiting approval from ANAID Quality Disposables Limited.

### What the customer cannot do

There is no basket. There is no checkout. There is no order history, because there are no orders. There are no invoices. There is no credit information. These are not merely hidden from view; the underlying capability is refused.

### ANAID's side

The application now appears in the **Customer Approvals** queue. An alert is raised for staff, so that applications are not discovered only by chance.

### When it goes wrong

The principal failure here is silence. A business that registers and hears nothing for a week will find another supplier.

**Gap in the brief.** The brief sets no target for how quickly applications are reviewed, and provides no mechanism for chasing an application that has been sitting unattended. A simple ageing indicator in the queue, and a reminder to staff after a set number of days, would address this.

---

## Stage 4 — The administrator reviews the application

### Purpose

This is the decision the entire system is built around. A member of ANAID staff decides whether this business becomes a customer.

### What the administrator sees

The queue lists every application awaiting a decision, showing the contact name, the business name, the telephone number, the email address, the business type, the date of registration, whether the contact details were verified, and the current status.

Opening one shows the complete submission, including the optional fields, together with any internal notes previously added.

### What the administrator decides

Approval is not one decision but several made together.

1. **Whether to trade with this business at all.**
2. **Which pricing level to assign.** Standard, Wholesale Level 1, 2 or 3, VIP, or a special arrangement. This determines every price that customer will ever see, so it is a commercially significant choice.
3. **Whether to offer credit.** If so, what the credit limit is and what the payment terms are. If not, the customer pays at the point of order.
4. **Whether any product-specific prices apply.** A negotiated rate on a particular item, agreed in conversation, is recorded here.

### The four actions

| Action | Resulting status | Effect |
|---|---|---|
| Approve | APPROVED | Full access. Prices become visible. Ordering becomes possible. |
| Reject | REJECTED | Browsing continues. Prices and ordering remain closed. |
| Request more information | *(see gap below)* | The applicant is asked to supply something further. |
| Suspend | SUSPENDED | Used for existing customers rather than new applicants. |

**Gap in the brief.** The brief lists *Request more information* as an available action but defines no corresponding account status for it. An application in that state is neither pending nor decided. Either a sixth status is required, or the account remains PENDING_APPROVAL with a flag recording that information has been requested. The second is simpler and is probably the better answer, but the brief does not choose.

**Gap in the brief.** The brief does not say whether assigning a pricing level is compulsory at the moment of approval. If it is not, a customer could be approved with no pricing level, and the system would have to decide what price to show them. Requiring it at approval avoids the question entirely.

### Internal notes

Staff may record notes against a customer at any time. These are visible only to ANAID staff and never to the customer. They are the natural place for observations such as *spoke to the owner, confirmed premises* or *late payer at previous account*.

### When it goes wrong

| Situation | What should happen |
|---|---|
| Two staff members open the same application at once | The second decision should not silently overwrite the first. |
| An approval is made in error | It must be reversible by suspending the account. |
| The reason for a rejection is not recorded | The customer telephones and nobody can explain the decision. A reason should be required. |

---

## Stage 5 — The decision reaches the customer

### Purpose

To tell the customer what has happened, promptly and in plain terms, and to bring the account into its new state.

### On approval

Three things happen at once.

First, the account status becomes **APPROVED**, and the date and the identity of the approving member of staff are recorded permanently against the account.

Second, the customer is issued a permanent customer number in the form **ANAID-C00001**. This number never changes. It appears on their account page, on every order, and on every invoice, and it is the reference ANAID staff use when discussing the account internally or on the telephone.

Third, a notification is sent:

> Your ANAID Quality Disposables account has been approved. You can now log in to view your prices and place orders.

From this moment the pricing engine will produce figures for this customer, and the ordering system will accept orders from them. Nothing needed to be deployed or changed; the same rules that previously refused now permit, because the status they consult has changed.

### On rejection

> Your ANAID Quality Disposables account application has not been approved. Please contact us for further information.

The message deliberately gives no reason. The reason is recorded internally, so that staff can explain it if the customer telephones, but it is not published. A written reason sent automatically can create difficulties that a conversation does not.

### On suspension

> Your ANAID Quality Disposables account has been temporarily suspended. Please contact ANAID Quality Disposables Limited.

The word *temporarily* is deliberate. Suspension is a commercial lever, most often used for non-payment, and is intended to prompt a telephone call rather than to end the relationship.

### When it goes wrong

**Gap in the brief.** The brief does not state what happens to work already in progress when a customer is suspended. If they have a basket, does it survive? If they have an order at the picking stage, is it completed or halted? If they have unpaid invoices, do these remain visible to them? The most defensible answer is that existing orders are completed and invoices remain visible, but no new orders may be placed. The brief does not say.

---

## Stage 6 — Logging in

### Purpose

To confirm that the person now using the application is the person who owns the account, and then to route them according to their account status.

### The steps

```
Enters mobile number or email
        │
        ▼
System sends a one-time code
        │
        ▼
Customer enters the code
        │
        ▼
Code is checked ──► Wrong ──► Attempt counted, message shown
        │
     Correct
        │
        ▼
ACCOUNT STATUS IS CHECKED
        │
   ┌────┼──────────┬──────────┐
   ▼    ▼          ▼          ▼
APPROVED  PENDING  REJECTED  SUSPENDED
   │        │         │          │
   ▼        ▼         ▼          ▼
Full    Holding   Holding    Holding
access   screen    screen     screen
```

The status check after successful verification is the most important line in this entire document. Proving identity and being permitted to trade are two separate questions, asked in that order, and a correct answer to the first does not imply anything about the second.

### The holding screens

A customer who is pending, rejected or suspended is not thrown out. They reach a screen that explains their position plainly and offers them the catalogue without prices. They are never left guessing.

### When it goes wrong

| Situation | What the customer sees |
|---|---|
| The number or email is not registered | A neutral message, phrased so that it does not confirm whether an account exists. |
| The code is wrong | The code entered is not correct. |
| Too many attempts | A temporary lockout, with the duration stated. |
| The account status is not APPROVED | The relevant holding screen, with ANAID's contact details. |

**Gap in the brief.** The brief describes a one-time code at login and mentions no password at all. Requiring a code for every single login is secure, but a customer ordering daily will find it tiresome, and every code costs ANAID a text message. Common practice is to require the code on a new device and then to remember that device for a period. The brief does not address this.

---

## Stage 7 — The catalogue, and how a price is chosen

### Purpose

To present products clearly, and to show each approved customer the one price that applies to them.

### The catalogue

Products are organised into categories such as cups, cup lids, food containers, burger boxes, pizza boxes, takeaway boxes, meal trays, paper bags, plastic bags, cutlery, straws, napkins, aluminium containers, aluminium foil, cling film, baking products, cleaning products, disposable gloves, catering supplies and packaging. Administrators may create any number of further categories and subcategories.

Each product carries a name, a product code, one or more images, a description, a category and subcategory, a brand, a size, a material, a colour, a pack quantity, the number of units in a carton, the minimum order quantity, the stock position, a VAT rate, a weight, dimensions, a barcode, and flags marking whether it is featured and whether it is active.

### Searching and filtering

Customers may search by product name, product code, barcode, category, brand or description, and may narrow the results by category, brand, size, material, availability, featured status, or whether they have purchased the item before.

That final filter — *recently purchased* — deserves emphasis. A wholesale customer buys the same forty items repeatedly. Making those forty easy to find is more valuable than any other search feature.

### How the price is determined

For an approved customer, the system works through the following:

```
Start: the product's standard price
        │
        ▼
Is there a price set specifically for this customer?
        │
   Yes ─┴─ No
    │      │
    │      ▼
    │   Apply the customer's pricing level
    │      │
    └──────┤
           ▼
Does the quantity reach a bulk price break?
           │
           ▼
Is an active promotion applicable?
           │
           ▼
The price the customer sees
```

**Gap in the brief.** The order shown above is a reasonable reading of the brief, but the brief does not actually state it. The unanswered question is what happens when rules conflict. If a customer has a negotiated price of £18.50 and a bulk rule offers £21.00 at ten cartons, the bulk rule is worse for them and should presumably be ignored — but if the bulk rule offered £17.00, should it override the negotiated price? A simple and defensible answer is that the customer always receives the lowest applicable price. A different answer is that a negotiated price overrides everything. These produce different invoices, and the difference must be settled deliberately.

### What is shown to whom

| Account status | What appears where the price would be |
|---|---|
| Not logged in | Login and get approved to view price |
| PENDING_APPROVAL | Price available after account approval |
| REJECTED | Price available after account approval |
| SUSPENDED | Price available after account approval |
| APPROVED | **Your Price: £22.00** |

In the first four cases no price figure is sent to the device at all.

---

## Stage 8 — The basket

### Purpose

To assemble an order, to show its cost accurately before commitment, and to prevent the customer from reaching checkout with an order that cannot be fulfilled.

### What the customer does

They add products, adjust quantities, and remove lines. The basket persists, so an order begun in the morning can be completed in the afternoon or on a different device.

Each line shows the product, the quantity, the applicable unit price and the line total. Beneath the lines, the basket shows the subtotal, the VAT, the delivery charge and the grand total.

### The checks applied

**Minimum order quantity.** Wholesale products frequently cannot be sold below a certain quantity. Where the basket falls short, it says so directly:

> Minimum order quantity is 5 cartons.

Checkout is prevented until this is resolved.

**Delivery charge.** ANAID configures a threshold above which delivery is free. The basket shows the charge, and where the customer is close to the threshold, it is helpful to say so.

**Stock.** If a product has become unavailable since it was added, the basket must say so rather than allowing the customer to discover it after ordering.

**Gap in the brief.** The brief specifies minimum quantities per product but no minimum value for the order as a whole. Most distributors set one, because delivering a single carton across a city costs more than the margin on it.

**Gap in the brief.** The brief does not say whether the delivery threshold is measured before or after VAT. On an order near £250 this changes the outcome.

---

## Stage 9 — Checkout, and the recalculation that matters

### Purpose

To capture the delivery arrangements, and to convert the basket into a binding order — but only after the system has independently verified every part of it.

### What the customer confirms

The delivery address, the billing address, a contact number, a purchase-order reference if their business requires one, any delivery instructions, a preferred delivery date, and any further notes.

They choose a payment method. Two are envisaged: payment on account, available only to customers who have been granted credit, and online card payment.

### What the system does before accepting

This is the single most important process in the system, and it must be understood clearly.

Everything the customer's device sent is treated as a suggestion and nothing more. The device has said what products it wants and in what quantities. It has also said what it believes the prices and totals to be. Those beliefs are discarded.

The system then, using only its own data, establishes:

1. That the request comes from a genuinely authenticated account.
2. That the account status is APPROVED — checked again, at this moment, not relied upon from earlier.
3. That every product in the order still exists, is still active, and is still available.
4. That the minimum order quantity is satisfied on every line.
5. What the correct price is for this customer, for this product, at this quantity, at this moment.
6. What the correct VAT is on each line.
7. What the correct delivery charge is, given the order value and the delivery postcode.
8. What the correct total is.
9. For a credit customer, that this order will not carry them past their credit limit.

Only when all nine are satisfied is an order created.

The reason is straightforward. If the system accepted the total sent by the device, a person could modify that device and order ten thousand pounds of goods for one pound. This is not a theoretical risk; it is among the most common ways commercial systems are defrauded. The defence is not to make the device harder to modify. The defence is to ignore what it says about money.

### The credit check

For a customer trading on account, three figures are maintained:

```
Credit limit      £5,000
Outstanding       £1,200
                  ───────
Available         £3,800
```

An order that would exceed the available credit is refused, with a clear message. An authorised administrator may override the refusal, and that override is recorded.

**Gap in the brief.** The brief does not define what counts towards the outstanding balance. Is it the total of unpaid invoices only, or does it also include orders that have been placed but not yet invoiced? The second is the prudent choice, because otherwise a customer could place several large orders before any of them is invoiced and pass their limit unnoticed.

### The order number

A successful order receives a number in the form **ANAID-2026-000001**. It is unique, it is sequential, and it carries the year, which makes it immediately readable by staff.

### When it goes wrong

| Situation | What the customer sees |
|---|---|
| The account is no longer approved | A plain message that the order cannot be placed. |
| A product has been deactivated | The line is identified and the customer is asked to remove it. |
| Stock is insufficient | The available quantity is stated. |
| A minimum is not met | The minimum is stated. |
| The credit limit would be exceeded | The available credit is stated. |
| Payment fails | A clear message, with the basket preserved intact. |
| The system itself fails | A neutral apology. No technical detail is ever shown. |

That last row is a security measure as much as a courtesy. Technical error messages tell an attacker how the system is built.

---

## Stage 10 — Fulfilment

### Purpose

To move the order through the warehouse and out to the customer, while keeping the customer informed.

### The statuses

```
1. Order Received      The order exists. ANAID has not yet looked at it.
2. Order Confirmed     Staff have accepted it.
3. Processing          Preparation has begun.
4. Picking             Goods are being collected in the warehouse.
5. Packed              The order is assembled and ready.
6. Dispatched          It has left the premises.
7. Out for Delivery    It is with the driver.
8. Delivered           The customer has received it.

   Cancelled           The order will not be fulfilled.
```

### Who does what

Each status belongs to a particular group of staff, and the system's role-based permissions mean each group sees only the orders and functions relevant to them.

- **Sales staff** confirm orders and handle queries.
- **Warehouse staff** work through picking and packing.
- **Delivery staff** see dispatched orders, the delivery addresses and the delivery notes.
- **Accounts staff** deal with invoicing and payment.

### The customer's view

The customer sees the progress of their order without needing to telephone. This is the single greatest reduction in inbound calls that such a system delivers.

### When it goes wrong

**Gap in the brief.** The brief does not describe partial fulfilment. If the warehouse finds only six of the ten cartons ordered, there is no defined process for supplying six, adjusting the order, and invoicing accordingly. This happens regularly in distribution and needs an answer.

**Gap in the brief.** The brief lists *Cancelled* as a status but sets no rules around it. It does not say whether a customer may cancel, up to what stage, or what happens to stock and to any payment already taken.

---

## Stage 11 — Invoicing and payment

### Purpose

To produce a proper commercial document, to deliver it to the customer, and to track whether it has been paid.

### The invoice

An invoice carries ANAID's company details, including the VAT registration and company number; the customer's details, including their customer number; the invoice number; the related order number; the invoice date; the due date; every line with its quantity and unit price; the VAT; the total; and the payment status.

The prices on the invoice are the prices recorded on the order at the moment it was placed. They are not recalculated. If ANAID raises its prices the following week, the invoice for last week's order is unaffected. This is why an order stores its own prices rather than pointing at the current ones.

### What staff can do

Generate the invoice, produce a PDF, send it by email, mark it paid, and mark it unpaid.

### What the customer can do

View their invoices, and download them.

### When it goes wrong

**Gap in the brief.** The brief does not say when an invoice is created. It says staff *can* generate one, which implies a manual action, but it does not exclude automatic generation on dispatch or on delivery. Manual generation risks invoices being forgotten; automatic generation risks invoicing goods that were never delivered.

**Gap in the brief.** Payments are listed as something the system holds, but no process is described for recording them. A payment by bank transfer arrives in ANAID's bank account, not in this system. Somebody must record it, and the brief does not say who or how.

**Gap in the brief.** Credit notes and returns are not mentioned anywhere in the brief. A distributor supplying perishable-adjacent goods will need to handle a rejected delivery, a damaged carton or a wrong item. Without credit notes, the only remedy is to edit an invoice, which is poor accounting practice.

---

## Stage 12 — Reordering

### Purpose

To make the second order, and the two-hundredth, dramatically faster than the first.

### Buy Again

A list of every product the customer has previously purchased. For each, it shows the product, the quantity last ordered, the date of that order, the current price, and a button to add it to the basket.

The current price is shown rather than the price previously paid, because the previous price may no longer be valid and showing it would mislead.

### Reorder a previous order

The customer opens an earlier order and, in one action, adds every still-available item to the basket at the same quantities.

**Gap in the brief.** The brief says this should add all *available* items, which correctly implies that discontinued or out-of-stock items are skipped. It does not say how prominently the customer should be told what was left out. Silently dropping a line from a reorder is how a restaurant runs out of chip boxes on a Friday night.

### Quick Order

A screen for customers who know exactly what they want. They type a product code, then a quantity, then the next product code, and so on, adding many lines quickly without browsing.

```
SKU: ANAID-HP10     Quantity: 10 cartons
SKU: ANAID-CUP12    Quantity:  4 cartons
SKU: ANAID-NAP200   Quantity:  2 cartons
                                  ───────────────
                                  Add all to basket
```

### Favourites

Customers may mark products as favourites and order from that list directly. Where Buy Again reflects what they have bought, favourites reflect what they have chosen to remember.

---

## The areas that sit outside the main flow

The following are described fully in Level 4. They are noted here so that the picture is complete.

**Inventory.** Stock is tracked per product, with a history of what was received, what was sold and what was adjusted. Administrators set a low-stock threshold per product, and are alerted when it is crossed.

**Promotions.** Time-limited campaigns such as a special price, a new-product highlight, a quantity offer or free delivery, targeted at particular products or particular groups of customers.

**Notifications.** Customers are told about approval, rejection, order progress, invoices and promotions. Staff are told about new registrations, new orders, payments, low stock and overdue invoices. Each may go by email, by text message, or within the application.

**Roles and permissions.** Five staff roles are defined: super administrator, sales, warehouse, accounts and delivery. Each is confined to its own functions.

**Reports.** Sales by day, week, month and year; sales by customer, product and category; best sellers; customer growth; repeat orders; outstanding invoices; payment history; inventory and low stock. Exportable where practical.

**Settings.** Company details, logo, VAT, delivery charges and thresholds, payment methods, approval settings, notification settings and pricing rules, all configurable without a developer.

**Audit logging.** Every significant administrative action is recorded with who did it, what they did, when, and to which record.

---

## How the central rule is actually enforced

It is worth stating plainly, because it is the difference between a system that works and one that merely appears to.

The rule is that an unapproved customer must never see a price or place an order. There are two ways to implement it.

**The wrong way.** The device receives the price and is instructed not to display it. This fails immediately, because anybody can inspect what their own device received.

**The right way.** The device never receives the price. Every request for data passes through a check on the server: who is asking, what is their account status, and what are they entitled to. If the account is not APPROVED, the response is constructed without any price in it. There is nothing to reveal, because nothing was sent.

The same check is applied at every point, without exception: the product list, the individual product page, the search results, the category listings, the basket, the checkout, and any other route by which data leaves the system. A single route that forgets the check defeats all the others.

The status is read fresh from the database each time. It is not remembered from when the customer logged in. A customer suspended at eleven o'clock is refused at one minute past.

---

*Continue to **Level 4 — Complete Reference** for every field, every message, every rule, every failure path, and every remaining area of the system.*
