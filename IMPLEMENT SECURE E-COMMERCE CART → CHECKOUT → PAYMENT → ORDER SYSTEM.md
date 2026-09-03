# IMPLEMENT SECURE E-COMMERCE CART → CHECKOUT → PAYMENT → ORDER SYSTEM

You are working on an existing online clothing shop application.

Your task is to inspect the ENTIRE existing codebase first and then implement a complete, secure, simple e-commerce ordering system.

## IMPORTANT DEVELOPMENT RULES

1. DO NOT rebuild the application from scratch.
2. DO NOT unnecessarily change the existing UI, styling, layouts, branding, or working functionality.
3. Reuse the existing architecture, components, database setup, authentication, APIs, services, and coding conventions wherever possible.
4. Before making changes, inspect:
   - frontend structure
   - backend structure
   - database structure
   - existing product/catalogue functionality
   - existing authentication
   - existing cart functionality
   - existing checkout functionality
   - existing payment integration
   - existing email functionality
   - existing Google Sheets integration
5. If something already exists, improve/integrate it instead of creating a duplicate implementation.
6. Do not remove working functionality unless it is necessary for this implementation.
7. Do not expose secrets, API keys, payment credentials, database credentials, or Google credentials in frontend code.
8. Do not trust data coming from the browser for prices, totals, payment status, or other sensitive business information.
9. Keep the customer experience extremely simple.
10. The owner should have as little manual system interaction as possible.

---

# BUSINESS MODEL

This is a print-on-demand clothing store.

The store DOES NOT need inventory/stock quantity tracking at this stage.

For example:

Customer selects:

Product: Classic T-Shirt
Colour: Black
Size: M
Quantity: 1

The customer can purchase it even if there is no predefined stock quantity because the owner will print/make the shirt after the order is received.

Therefore:

DO NOT implement stock quantity management unless the existing system already depends on it.

The important product attributes are:

- Product
- Product variant
- Size
- Colour (if applicable)
- SKU/product identifier if appropriate
- Price
- Quantity

The owner should primarily need to manage/update PRODUCT PRICES for now.

Do not create unnecessary inventory-management screens.

---

# MAIN OBJECTIVE

Implement this complete flow:

CUSTOMER

Product → Add to Cart → Cart → Checkout → Payment Gateway → Payment Verification → Order Confirmation

while simultaneously:

PAYMENT CONFIRMED

→ Order stored securely in SQL database
→ Owner receives order by EMAIL
→ Order automatically added to GOOGLE SHEET
→ Order appears in the customer's order/confirmation view if applicable

The database must remain the system's source of truth.

Email and Google Sheets are notification/operational tools for the owner.

---

# 1. PRODUCT / VARIANT STRUCTURE

Inspect the existing product structure.

If necessary, use a structure similar to:

Products

- Id
- Name
- Description
- Image
- Category
- Active
- CreatedAt
- UpdatedAt

ProductVariants

- Id
- ProductId
- Size
- Colour
- SKU
- Price
- Active

Do NOT add StockQuantity unless the existing architecture requires it.

The price must be stored server-side.

For example:

Product:
Classic T-Shirt

Variant:
Black / M

SKU:
CTS-BLK-M

Price:
R499

The frontend may DISPLAY R499, but the backend must independently retrieve the actual price from the database during checkout.

---

# 2. CART

Implement/verify a secure cart.

The cart should contain references to product variants rather than trusting product names or prices from the browser.

Example:

CartItem:

- CartItemId
- CartId
- ProductVariantId
- Quantity

The frontend should send something like:

{
    "productVariantId": 102,
    "quantity": 1
}

DO NOT trust:

{
    "productVariantId": 102,
    "price": 1,
    "total": 1
}

The backend must retrieve the product/variant from SQL.

The frontend must NOT be able to manipulate the actual price used for payment.

---

# 3. CART VALIDATION BEFORE CHECKOUT

When the customer clicks CHECKOUT:

The backend must retrieve every cart item from the database and validate:

- Product exists
- Product variant exists
- Variant is active
- Quantity is valid
- Product is available for purchase
- Price currently stored in database
- Any applicable discounts/coupons are valid
- Shipping information is valid
- Customer is authenticated if the existing application requires accounts

Then calculate the entire order total SERVER-SIDE.

Never trust:

- frontend price
- frontend subtotal
- frontend total
- frontend discount
- frontend delivery fee
- frontend payment status

The server is the source of truth.

---

# 4. ORDER CREATION

Create the order BEFORE sending the customer to the payment gateway.

Recommended SQL structure:

Orders

- Id
- OrderNumber
- CustomerId (nullable if guest checkout is supported)
- CustomerName
- CustomerEmail
- CustomerPhone
- ShippingAddress
- Subtotal
- DeliveryFee
- Discount
- Total
- Currency
- OrderStatus
- PaymentStatus
- CreatedAt
- UpdatedAt

OrderItems

- Id
- OrderId
- ProductVariantId
- ProductNameSnapshot
- SizeSnapshot
- ColourSnapshot
- SKUSnapshot
- UnitPrice
- Quantity
- LineTotal

Payments

- Id
- OrderId
- PaymentGateway
- GatewayPaymentId
- GatewayReference
- Amount
- Currency
- PaymentStatus
- PaidAt
- CreatedAt
- UpdatedAt

IMPORTANT:

OrderItems must store SNAPSHOTS of the product information at the time of purchase.

For example:

ProductNameSnapshot = Classic T-Shirt
SizeSnapshot = M
ColourSnapshot = Black
UnitPrice = R499

This means if the owner later changes the shirt price from R499 to R599, the historical order still correctly shows R499.

---

# 5. ORDER STATUS

Implement a clear order lifecycle.

For example:

PENDING_PAYMENT
PAID
PROCESSING
READY_FOR_FULFILLMENT
COMPLETED
CANCELLED
REFUNDED

Do not allow customers to arbitrarily change order status.

PaymentStatus should be separate from OrderStatus.

For example:

PaymentStatus:

PENDING
PAID
FAILED
REFUNDED

OrderStatus:

PENDING_PAYMENT
PROCESSING
COMPLETED
CANCELLED
etc.

Keep the implementation simple.

The owner should not need to manually mark an order as paid.

---

# 6. PAYMENT GATEWAY

Inspect the existing project and determine which payment gateway is already implemented.

If a payment gateway already exists, integrate with it instead of replacing it.

If payment integration does not exist, structure the system so a secure payment gateway can be integrated without changing the rest of the checkout architecture.

The backend should create the payment request.

The payment amount must come from the server-calculated order total.

For example:

Order subtotal = R499
Delivery = R80
Total = R579

The backend sends:

Amount = R579
Currency = ZAR
Reference = ORD-2026-00041

Never accept a payment amount directly from the frontend.

---

# 7. NEVER TRUST THE PAYMENT SUCCESS PAGE

DO NOT mark an order as PAID merely because the customer reaches:

/payment-success

or:

/checkout/success

A customer could potentially access that page without paying.

Instead, payment confirmation must come from the payment gateway's SERVER-TO-SERVER webhook/callback.

Implement:

Payment Gateway
        ↓
Secure Webhook
        ↓
Backend
        ↓
Verify payment
        ↓
Update Payment
        ↓
Update Order

The webhook must verify:

1. The webhook genuinely came from the payment provider.
2. The order/reference exists.
3. The payment belongs to that order.
4. The amount paid matches the order total.
5. The currency matches.
6. The payment has not already been processed.

Only after all checks pass:

PaymentStatus = PAID
OrderStatus = PAID / PROCESSING

---

# 8. WEBHOOK IDEMPOTENCY

The payment webhook must be idempotent.

Payment providers may send the same webhook more than once.

Therefore:

If payment PAY-123 has already been processed:

DO NOT:

- create another order
- send another order to Google Sheets
- send duplicate emails
- process the order twice

Instead, recognize that the payment has already been processed and safely return success.

Use the gateway payment ID/reference as an idempotency key where appropriate.

---

# 9. PAYMENT SECURITY

Follow secure payment integration practices.

Never store:

- card number
- CVV
- PIN
- raw payment credentials

in the application database.

Use the payment gateway's hosted checkout/tokenization/secure payment mechanism where appropriate.

Payment secrets must remain server-side in environment variables/configuration.

Never put:

PAYMENT_SECRET
API_SECRET
WEBHOOK_SECRET

inside frontend JavaScript.

---

# 10. CUSTOMER CHECKOUT EXPERIENCE

Keep checkout extremely simple.

Recommended flow:

CART

↓

Customer Information

Name
Email
Phone

↓

Delivery Information

Address
City
Postal Code
Country

↓

ORDER SUMMARY

Classic T-Shirt
Black
Size M
Qty 1

Subtotal: R499
Delivery: R80
Total: R579

↓

PAY NOW

↓

Payment Gateway

↓

Payment Successful

↓

ORDER CONFIRMED

Show:

Order #ORD-2026-00041

Payment successful.

Your order has been received.

We have sent your order confirmation to your email.

Do not make the customer interact with unnecessary admin functionality.

---

# 11. OWNER EMAIL NOTIFICATION

After the backend has VERIFIED that payment was successful, automatically send an email to the owner's configured business email.

The email should contain the COMPLETE order.

Example:

NEW PAID ORDER
Order #ORD-2026-00041

Customer:
John Smith

Email:
john@example.com

Phone:
0712345678

DELIVERY ADDRESS:
12 Example Street
Johannesburg
2001
South Africa

ORDER:

1 × Classic T-Shirt
Colour: Black
Size: M
SKU: CTS-BLK-M
Unit Price: R499
Total: R499

Delivery: R80

TOTAL PAID: R579

Payment Status: PAID

Payment Reference:
PAY-123456

Order Date:
2026-09-02

The email should only be sent AFTER successful payment verification.

Do not send "paid order" emails based only on frontend redirects.

---

# 12. GOOGLE SHEETS INTEGRATION

After successful payment verification, automatically add the order to the configured Google Sheet.

The owner will use this Google Sheet as a simple operational way to track orders.

Recommended columns:

Order Number
Order Date
Customer Name
Customer Email
Customer Phone
Product
Colour
Size
SKU
Quantity
Unit Price
Subtotal
Delivery Fee
Discount
Total
Payment Status
Payment Reference
Order Status
Shipping Address

If an order contains multiple products, handle this cleanly.

Prefer either:

OPTION A:

One row per order item.

OR

OPTION B:

One row per order with a structured order summary.

Choose the option that fits the existing Google Sheets implementation best.

For operational tracking, ONE ROW PER ORDER ITEM is preferred if it makes filtering and printing easier.

Example:

ORD-2026-00041 | John Smith | Classic T-Shirt | Black | M | 1 | R499 | R579 | PAID

If multiple items exist:

ORD-2026-00042 | Jane | T-Shirt | White | S | 1 | ...
ORD-2026-00042 | Jane | Hoodie | Black | M | 2 | ...

Use the same OrderNumber for all rows belonging to one order.

---

# 13. GOOGLE SHEETS SECURITY

Do not expose Google service-account credentials to the browser.

Google Sheets communication must happen SERVER-SIDE.

Credentials/secrets must be stored securely in environment variables or the application's secure configuration mechanism.

The customer must never have access to the owner's Google Sheet.

The customer should only interact with your website/backend.

---

# 14. EMAIL + GOOGLE SHEET FAILURE HANDLING

Very important:

Payment success must NOT depend on email or Google Sheets succeeding.

For example:

Payment = SUCCESS
Database = SUCCESS
Email = FAILED
Google Sheet = FAILED

The order must STILL be:

PAID.

Do not tell the payment gateway that the payment failed simply because email or Google Sheets failed.

Instead:

1. Save the order/payment successfully.
2. Mark it PAID.
3. Attempt email notification.
4. Attempt Google Sheets notification.
5. Log failures.
6. Retry failed notifications where appropriate.

The database is the source of truth.

Email and Google Sheets are notification/operational integrations.

If possible, create a simple notification status/log structure:

OrderNotifications

- Id
- OrderId
- Type (EMAIL / GOOGLE_SHEET)
- Status
- Attempts
- LastAttemptAt
- ErrorMessage
- CreatedAt
- UpdatedAt

This allows failed notifications to be retried without affecting the actual order/payment.

---

# 15. DUPLICATE ORDER PROTECTION

Make sure the customer cannot accidentally create multiple orders by:

- double-clicking PAY
- refreshing the checkout page
- clicking back and forward
- reopening the payment page
- receiving duplicate gateway callbacks

Use:

- unique OrderNumber
- unique payment reference where appropriate
- idempotency keys
- database constraints
- backend validation

The same payment must never produce two paid orders.

---

# 16. DATABASE TRANSACTIONS

Where appropriate, use SQL transactions for critical operations.

For example, when payment is confirmed:

BEGIN TRANSACTION

1. Find payment/order.
2. Verify it has not already been processed.
3. Verify amount.
4. Update PaymentStatus = PAID.
5. Update OrderStatus = PAID/PROCESSING.
6. Commit.

Then perform email/Google Sheet notification processing separately.

Do not keep a database transaction open while waiting for external services such as email or Google Sheets.

---

# 17. OWNER ADMIN FUNCTIONALITY

Keep the owner's required interaction minimal.

The owner should NOT need to:

- manually enter orders
- manually mark payments as paid
- manually copy customer details
- manually create Google Sheet entries
- manually send order emails
- manually calculate totals

The owner mainly needs to:

1. Update product prices.
2. View/manage products.
3. Work from the automatically populated Google Sheet.
4. Fulfill/print orders.

If an admin dashboard already exists, preserve it and add only the necessary functionality.

Do NOT build a complicated ERP/inventory system.

---

# 18. PRICE MANAGEMENT

The owner must be able to update product/variant prices.

For example:

Classic T-Shirt
Black / M
Current price: R499

Owner changes it to:

R549

Future orders use R549.

Existing orders remain R499 because OrderItems contain price snapshots.

Only authorized admin users can change prices.

Never allow normal customers to change prices.

Log important price changes if the existing architecture supports auditing.

---

# 19. CUSTOMER ORDER CONFIRMATION

After payment is successfully verified, the customer should see:

PAYMENT SUCCESSFUL

Order #ORD-2026-00041

Your order has been received.

Total paid: R579

A confirmation email has been sent to:

john@example.com

Do not display sensitive payment information.

If the application already has customer accounts, allow the customer to see their order history.

---

# 20. ORDER DETAILS MUST BE CONSISTENT EVERYWHERE

The following should all represent the SAME database order:

DATABASE:

ORD-2026-00041

EMAIL:

ORD-2026-00041

GOOGLE SHEET:

ORD-2026-00041

CUSTOMER:

ORD-2026-00041

PAYMENT:

Reference = ORD-2026-00041

This single order number/reference should make it easy to trace a transaction from payment → database → email → Google Sheet → customer.

---

# 21. SECURITY CHECKLIST

Before finishing, test for:

[ ] User cannot manipulate product price from browser.

[ ] User cannot manipulate order total.

[ ] User cannot mark order as PAID.

[ ] User cannot fake payment success.

[ ] Payment webhook is authenticated/verified.

[ ] Payment amount is checked server-side.

[ ] Payment currency is checked.

[ ] Payment cannot be processed twice.

[ ] Duplicate webhook does not create duplicate order.

[ ] Duplicate payment cannot create duplicate Google Sheet row.

[ ] Duplicate payment cannot send duplicate paid-order email.

[ ] Payment secrets are not exposed to frontend.

[ ] Google credentials are not exposed to frontend.

[ ] Customer cannot access owner's Google Sheet.

[ ] SQL queries are parameterized / ORM-safe.

[ ] Input validation exists.

[ ] Authorization exists for admin price changes.

[ ] Existing authentication/authorization is respected.

[ ] Sensitive information is not unnecessarily logged.

[ ] Failed email does not make payment fail.

[ ] Failed Google Sheet integration does not make payment fail.

[ ] Database remains the source of truth.

---

# 22. TEST THE COMPLETE SCENARIO

After implementation, perform an end-to-end test.

Scenario:

Product:
Classic T-Shirt

Colour:
Black

Size:
M

Quantity:
1

Price:
R499

Delivery:
R80

Expected total:
R579

Test:

1. Customer opens product.
2. Selects Black / M.
3. Adds to cart.
4. Opens cart.
5. Proceeds to checkout.
6. Backend retrieves actual price.
7. Backend calculates R579.
8. Backend creates PENDING_PAYMENT order.
9. Customer is sent to payment gateway.
10. Customer successfully pays.
11. Gateway sends webhook.
12. Backend verifies webhook.
13. Backend verifies R579.
14. Backend marks payment PAID.
15. Backend marks order PAID/PROCESSING.
16. Owner receives email.
17. Order appears in Google Sheet.
18. Customer receives confirmation.
19. Database contains complete order.
20. Refreshing/repeating webhook does NOT duplicate anything.

Then test:

- payment failure
- cancelled payment
- duplicate webhook
- manipulated frontend price
- manipulated frontend total
- double-clicking checkout
- refreshing checkout
- invalid variant ID
- invalid quantity
- email failure
- Google Sheets failure

Fix any issues discovered.

---

# 23. LOGGING AND ERROR HANDLING

Implement useful server-side logging for:

- checkout creation
- order creation
- payment initiation
- payment webhook received
- payment verification
- payment failure
- email notification failure
- Google Sheets failure
- duplicate webhook
- invalid payment amount
- security/authorization failures

DO NOT log:

- card numbers
- CVV
- passwords
- payment secrets
- Google credentials
- API secrets

Use appropriate production-safe error messages.

Do not expose internal exceptions to customers.

---

# 24. FINAL IMPLEMENTATION PRINCIPLE

The architecture should follow:

FRONTEND
↓
Request checkout

BACKEND
↓
Retrieve products/prices from SQL
↓
Validate cart
↓
Calculate total
↓
Create PENDING_PAYMENT order
↓
Create payment

CUSTOMER
↓
Payment Gateway

PAYMENT GATEWAY
↓
Secure Webhook

BACKEND
↓
Verify payment
↓
Mark Payment = PAID
↓
Mark Order = PAID
↓
Database becomes authoritative order record

BACKGROUND/NOTIFICATION PROCESS
↓
Send email
↓
Write to Google Sheet

OWNER
↓
Receives email
↓
Works from Google Sheet
↓
Prints/makes the clothing
↓
Fulfills order

---

# IMPORTANT

Before modifying anything, inspect the current implementation and explain briefly:

1. What cart functionality already exists.
2. What checkout functionality already exists.
3. What payment gateway is currently used.
4. What database/entities already exist.
5. What email service already exists.
6. What Google Sheets integration already exists.
7. What needs to be added.
8. What can be reused.

Then implement the solution.

Do not create unnecessary duplicate services, controllers, database tables, or components.

Keep the system SIMPLE for the customer and SIMPLE for the owner, while making payment, order, pricing, and notification processing secure and reliable.

After implementation, run/build/test the project and fix compilation errors, runtime errors, broken API calls, database issues, and integration issues you encounter.

Do not stop at creating placeholder code. Implement the actual working functionality using the project's existing architecture and configuration.