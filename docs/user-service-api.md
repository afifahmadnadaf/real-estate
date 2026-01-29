## User Service API Contract (`user-service`)

**Base URL (via API Gateway)**: `/v1`  
**Service base path**: `/v1/auth`, `/v1/users`  
**Auth**:  
- `/v1/auth/*`: no auth for login/OTP/password flows; authenticated for `/refresh`, `/logout`, `/sessions`, `/mfa/*`.  
- `/v1/users/me*`: authenticated user.  
- `/v1/users/*` (admin paths): authenticated admin, enforced at API Gateway (`ADMIN`/`SUPER_ADMIN`) and in authorization layer.

---

## 1. Authentication & Sessions

### 1.0 `GET /v1/auth`
- **Description**: Auth service index/discovery endpoint (useful for smoke tests).
- **Headers**: none required.
- **Responses**:
  - `200`: `{ success: true, data: { endpoints: string[] } }` (may be empty in local/dev).

### 1.1 `POST /v1/auth/otp/request`
- **Description**: Request OTP for login/registration/password reset.
- **Headers**: none required.
- **Body**:
  - `identifier` (string, required): phone number or email.
  - `identifierType` (string, required): `PHONE` | `EMAIL`.
  - `purpose` (string, optional, default `LOGIN`): `LOGIN` | `REGISTER` | `RESET_PASSWORD` | `VERIFY`.
- **Responses**:
  - `200`: `{ success: true }` (plus optional metadata like throttle status).
  - `400`: validation error (missing/invalid fields).

### 1.2 `POST /v1/auth/otp/verify`
- **Description**: Verify OTP and issue session + tokens.
- **Body**:
  - `identifier` (string, required).
  - `identifierType` (string, required): `PHONE` | `EMAIL`.
  - `otp` (string, 6 digits, required).
  - `purpose` (string, optional, default `LOGIN`): `LOGIN` | `REGISTER` | `VERIFY`.
  - `deviceInfo` (object, optional): `{ type?, os?, browser?, model? }`.
- **Responses**:
  - `200`: `{ accessToken, refreshToken, user, session }`.
  - `400` / `401`: invalid or expired OTP.

### 1.3 `POST /v1/auth/password/login`
- **Description**: Password-based login.
- **Body**:
  - `identifier` (string, required): email or phone.
  - `password` (string, min 6, required).
  - `deviceInfo` (object, optional): `{ type?, os?, browser? }`.
- **Responses**:
  - `200`: `{ accessToken, refreshToken, user, session }`.
  - `401`: invalid credentials.

### 1.4 `POST /v1/auth/password/reset/request`
- **Description**: Request password reset OTP/link.
- **Body**:
  - `identifier` (string, required).
  - `identifierType` (string, required): `PHONE` | `EMAIL`.
- **Responses**:
  - `200`: `{ success: true }`.

### 1.5 `POST /v1/auth/password/reset/confirm`
- **Description**: Confirm password reset using OTP.
- **Body**:
  - `identifier` (string, required).
  - `identifierType` (string, required): `PHONE` | `EMAIL`.
  - `otp` (string, 6 digits, required).
  - `newPassword` (string, min 6, required).
- **Responses**:
  - `200`: `{ success: true }`.

### 1.6 `POST /v1/auth/refresh`
- **Auth**: no bearer token required; uses refresh token.
- **Body**:
  - `refreshToken` (string, required).
- **Responses**:
  - `200`: `{ accessToken, refreshToken }`.
  - `401`: invalid/expired refresh token.

### 1.7 Session & MFA endpoints

- **`POST /v1/auth/logout`**
  - **Auth**: bearer required.
  - **Description**: Invalidate current session.
  - **Responses**: `200 { success: true }`.

- **`GET /v1/auth/sessions`**
  - **Auth**: bearer required.
  - **Description**: List active sessions for current user.
  - **Response**: `200 { sessions: [...] }`.

- **`DELETE /v1/auth/sessions/{sessionId}`**
  - **Auth**: bearer required.
  - **Params**: `sessionId` (string, required).
  - **Description**: Revoke a specific session.

- **`GET /v1/auth/public-keys`**
  - **Description**: JWKS/public keys for token verification.

- **`POST /v1/auth/mfa/enable`**
  - **Auth**: bearer required.
  - **Body**: `{}` (reserved for future).
  - **Description**: Enable MFA for account.

- **`POST /v1/auth/mfa/verify`**
  - **Auth**: bearer required.
  - **Body**:
    - `token` (string, 6-digit, required).

- **`POST /v1/auth/mfa/disable`**
  - **Auth**: bearer required.
  - **Body**:
    - `token` (string, 6-digit, required).

All error responses follow:  
`{ error: { code: string, message: string, details?: any, traceId: string } }`.

---

## 2. Current User (`/v1/users/me*`)

### 2.1 `GET /v1/users/me`
- **Auth**: bearer required.
- **Description**: Get current user profile.
- **Response**:
  - `200 { id, name, email?, phone?, role, status, avatarUrl?, metadata? }`.

### 2.2 `PATCH /v1/users/me`
- **Auth**: bearer required.
- **Body**:
  - `name` (string, 2–100, optional).
  - `avatarUrl` (string, URI, optional, nullable).
  - `email` (string, email, optional).
  - `metadata` (object, optional).
- **Response**: `200 { user: ...updated... }`.

### 2.3 Preferences & Consents

- **`GET /v1/users/me/preferences`**
  - **Response**: `200 { notificationSettings?, searchPreferences?, displayPreferences? }`.

- **`PATCH /v1/users/me/preferences`**
  - **Body** (all fields optional):
    - `notificationSettings`: `{ email?: bool, sms?: bool, push?: bool, whatsapp?: bool }`.
    - `searchPreferences`:  
      `{ propertyTypes?: string[], cities?: string[], budgetMin?: number, budgetMax?: number, bedrooms?: number[] }`.
    - `displayPreferences`:  
      `{ currency?: 'INR'|'USD', areaUnit?: 'SQFT'|'SQMT', language?: 'en'|'hi' }`.

- **`GET /v1/users/me/consents` / `PATCH /v1/users/me/consents`**
  - **Description**: Get/update consent state (marketing, tracking, etc.).
  - **Body** (PATCH): service-defined consent flags.

### 2.4 Security & account lifecycle

- **`GET /v1/users/me/security`**
  - **Description**: Security settings (MFA enabled, last password change, etc.).

- **`PATCH /v1/users/me/security`**
  - **Body**: security configuration fields (e.g. password change, security questions) – see backend implementation.

- **`GET /v1/users/me/activity`**
  - **Description**: Recent activity log for current user.

- **`POST /v1/users/me/deactivate`**
  - **Description**: Soft-deactivate account.

- **`POST /v1/users/me/delete/request`** / **`POST /v1/users/me/delete/confirm`**
  - **Description**: GDPR-style delete request & confirmation.
  - **Body (confirm)**: confirmation token/OTP depending on implementation.

- **`GET /v1/users/me/export`**
  - **Description**: Export user data (link or generated file).

- **`POST /v1/users/me/verify-email`** / **`POST /v1/users/me/verify-phone`**
  - **Description**: Trigger and confirm email/phone verification flows.

---

## 3. Admin User APIs (`/v1/users/*` via Admin)

These are mounted under `/v1/admin/users` at the gateway, but the underlying service exposes `/v1/users` admin endpoints.

### 3.1 `GET /v1/users/{userId}`
- **Auth**: admin.
- **Params**:
  - `userId` (string, required).
- **Response**: `200 { id, name, email, phone, role, status, metadata }`.

### 3.2 `GET /v1/users`
- **Auth**: admin.
- **Query**: filters for search (name, email, role, status, pagination).
- **Response**: `200 { items: User[], total: number, limit, offset }`.

### 3.3 `PATCH /v1/users/{userId}`
- **Auth**: admin.
- **Body** (all optional; see `adminUpdateUserSchema`):
  - `name` (string, 2–100).
  - `email` (string, email).
  - `phone` (string).
  - `role` (`USER` | `AGENT` | `BUILDER` | `ADMIN`).
  - `status` (`ACTIVE` | `INACTIVE` | `BLOCKED` | `PENDING_VERIFICATION`).
  - `metadata` (object).

### 3.4 Block / unblock

- **`POST /v1/users/{userId}/block`**
- **`POST /v1/users/{userId}/unblock`**
  - **Auth**: admin.
  - **Description**: Block/unblock users from accessing the platform.

---

## 4. Common headers & error model

- **Common request headers**:
  - `Authorization: Bearer <accessToken>` (where required).
  - `X-Request-Id` (optional; generated at gateway if absent).
  - `X-Client-Version`, `X-Device-Id` (optional, for analytics).
- **Standard error response** (all endpoints):
  - `4xx/5xx`:
    - `{ error: { code: string, message: string, details?: any, traceId: string } }`.


