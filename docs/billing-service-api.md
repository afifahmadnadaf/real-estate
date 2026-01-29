## Billing Service API Contract (`billing-service`)

**Base URL (via API Gateway)**: `/v1`  
**Service base paths**:
- `/v1/packages`
- `/v1/subscriptions`
- `/v1/payments`
- `/v1/refunds`
- `/v1/invoices`
- `/v1/coupons`
- `/v1/webhooks/*`

---

## 1. Packages (`/v1/packages`)

### 1.1 `GET /v1/packages`
- **Auth**: optional (public).
- **Description**: List active packages/plans for UI.
- **Response**:
  - `200 { items: Package[], total }`.

### 1.2 `GET /v1/packages/{id}`
- **Auth**: optional.
- **Params**:
  - `id` (string, required).

### 1.3 Admin Package Management

These are protected at gateway (`/v1/admin/packages/*`) but the underlying service exposes admin actions on the same `/v1/packages` path (plus backward-compatible `/v1/packages/admin/*`).

#### `POST /v1/packages`
- **Auth**: admin.
- **Body** (`createPackageSchema`):
  - `name` (string, 2–100, required).
  - `slug` (string, required).
  - `type` (string, required): `BASIC | PREMIUM | ENTERPRISE`.
  - `description` (string ≤1000, optional).
  - `features` (object, optional).
  - `price` (number ≥ 0, required).
  - `currency` (string, default `INR`).
  - `durationDays` (int ≥ 1, optional).
  - `listingLimit` (int ≥ 0, optional).
  - `boostTier` (string, optional).
  - `isActive` (bool, default `true`).
  - `sortOrder` (int, default 0).
  - `metadata` (object, optional).

#### `PATCH /v1/packages/{id}`
#### `DELETE /v1/packages/{id}`
- **Auth**: admin.
- **Params**:
  - `id` (string, required).
- **Description**:
  - Update or delete package.

#### Backward-compatible admin routes (`/v1/packages/admin/*`)

- **`POST /v1/packages/admin`**
  - **Auth**: admin.
  - **Body**: same as `POST /v1/packages`.
- **`PATCH /v1/packages/admin/{id}`**
  - **Auth**: admin.
  - **Params**: `id` (string, required).
- **`DELETE /v1/packages/admin/{id}`**
  - **Auth**: admin.
  - **Params**: `id` (string, required).

---

## 2. Subscriptions (`/v1/subscriptions`)

All require authentication.

### 2.1 `POST /v1/subscriptions`
- **Description**: Create a subscription for packages.
- **Body** (`createSubscriptionSchema`):
  - `packageId` (string, required).
  - `orgId` (string, optional).
  - `autoRenew` (bool, default `true`).
- **Response**:
  - `201 { id, packageId, orgId?, status, autoRenew, validFrom, validUntil, ... }`.

### 2.2 `GET /v1/subscriptions`
- **Description**: List subscriptions for current user/org.
- **Response**:
  - `200 { items: Subscription[], total }`.

### 2.3 `GET /v1/subscriptions/{id}`
- **Params**:
  - `id` (string, required).

### 2.4 `POST /v1/subscriptions/{id}/cancel`
- **Description**: Cancel a subscription.
- **Body** (`cancelSubscriptionSchema`):
  - `reason` (string ≤500, optional).

---

## 3. Payments (`/v1/payments`)

Authenticated user required.

### 3.1 `POST /v1/payments/initiate`
- **Description**: Initiate a payment for a subscription/order.
- **Body** (`initiatePaymentSchema`):
  - `amount` (number ≥ 0, required).
  - `currency` (string, default `INR`).
  - `subscriptionId` (string, optional).
  - `couponCode` (string, optional).
  - `idempotencyKey` (string, optional – used to dedupe retries).
- **Response**:
  - `201 { id, amount, currency, status: 'PENDING', providerOrderId, ... }`.

### 3.2 `GET /v1/payments`
- **Description**: List payments for current user/org.

### 3.3 `GET /v1/payments/{id}`
- **Params**:
  - `id` (string, required).

### 3.4 `POST /v1/payments/{id}/retry`
- **Description**: Retry a failed payment.
- **Params**:
  - `id` (string, required).

### 3.5 `POST /v1/payments/{id}/refund`
- **Description**: Request a refund for a payment.
- **Body** (`createRefundSchema`):
  - `amount` (number ≥ 0, required).
  - `reason` (string, 5–500, required).

---

## 4. Refunds (`/v1/refunds`)

### 4.1 `GET /v1/refunds`
- **Description**: List refunds for current user/org.

### 4.2 `GET /v1/refunds/{id}`
- **Params**:
  - `id` (string, required).

---

## 5. Invoices (`/v1/invoices`)

### 5.1 `GET /v1/invoices`
- **Description**: List invoices for current user/org.

### 5.2 `GET /v1/invoices/{id}`
- **Params**:
  - `id` (string, required).

---

## 6. Coupons (`/v1/coupons`)

Public list for discovery + admin management.

### 6.1 `GET /v1/coupons`
- **Auth**: optional.
- **Description**: List active coupons.

### 6.2 `POST /v1/coupons/validate`
- **Auth**: optional.
- **Description**: Validate a coupon against an amount (and optionally package).
- **Headers**:
  - `Content-Type: application/json`
- **Body**:
  - `code` (string, required)
  - `amount` (number ≥ 0, required)
  - `packageId` (string, optional)
- **Response**:
  - `200 { success: boolean, data: { valid: boolean, ... } }` (service-defined details)

### 6.3 Admin Coupon Management

#### `POST /v1/coupons`
- **Auth**: admin.
- **Body** (`createCouponSchema`):
  - `code` (string, 2–50, required).
  - `description` (string ≤1000, optional).
  - `discountType` (string, required): `PERCENTAGE | FIXED`.
  - `discountValue` (number ≥ 0, required).
  - `maxUses` (int ≥ 1, optional).
  - `minAmount` (number ≥ 0, optional).
  - `maxDiscount` (number ≥ 0, optional).
  - `validFrom`, `validUntil` (date, required).
  - `applicablePackages` (string[] default `[]`).
  - `isActive` (bool, default `true`).

#### `PATCH /v1/coupons/{couponId}`
#### `DELETE /v1/coupons/{couponId}`
- **Auth**: admin.
- **Body (PATCH)** (`updateCouponSchema`): any subset of coupon fields.

---

## 7. Webhooks (`/v1/webhooks/*`)

These routes accept **raw JSON** (`express.raw({ type: 'application/json' })`) and perform signature verification.

### 7.1 `POST /v1/webhooks/razorpay`
- **Description**: Razorpay payment gateway webhook.
- **Headers**:
  - `X-Razorpay-Signature` or equivalent (implementation-specific).
- **Body**:
  - Raw Razorpay event; internally mapped to update payments/subscriptions and emit billing events.
- **Responses**:
  - `200 { success: true }` on valid event.
  - `400` / `401` on invalid signature/payload.

### 7.2 `POST /v1/webhooks/stripe`
- **Description**: Stripe webhook for payment events.
- **Headers**:
  - `Stripe-Signature`, etc.
- **Body**:
  - Raw Stripe event; used to reconcile payment, update subscriptions/invoices, emit Kafka events.

### 7.3 `POST /v1/webhooks/shiprocket`
- **Description**: Shiprocket webhook (logistics/shipping events).
- **Headers**:
  - Provider signature header(s) (implementation-specific).
- **Body**:
  - Raw Shiprocket event payload; used to reconcile shipment/delivery status (service-defined).
- **Responses**:
  - `200 { success: true }` on accepted event.
  - `400` / `401` on invalid signature/payload.

---

## 8. Admin Webhook Operations (`/v1/admin/webhooks/*`)

These are admin-only and used for debugging/replaying webhook deliveries.

### 8.1 `GET /v1/admin/webhooks/logs`
- **Auth**: admin.
- **Description**: List webhook delivery logs (filters/pagination service-defined).

### 8.2 `POST /v1/admin/webhooks/replay`
- **Auth**: admin.
- **Description**: Replay a webhook delivery.
- **Body**:
  - Service-defined (typically includes a log/event id).

---

## 9. Common Headers & Errors

- **Headers**:
  - `Authorization: Bearer <accessToken>` required for `/subscriptions`, `/payments`, `/invoices`, `/refunds` (and for admin actions).
  - `X-Request-Id` propagated as `traceId`.
  - `Idempotency-Key` (recommended) for payment initiation (also present as `idempotencyKey` in body).
- **Error model**:
  - `{ error: { code: string, message: string, details?: any, traceId: string } }`.


