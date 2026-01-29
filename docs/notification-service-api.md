## Notification Service API Contract (`notification-service`)

**Base URL (via API Gateway)**: `/v1`  
**Service base paths**:
- Public/user: `/v1/notifications`, `/v1/notification-preferences`
- Admin: `/v1/admin/notification-templates`, `/v1/admin/notifications/*`
- Internal: `/internal/v1/notifications/send`

---

## 1. User Notifications (`/v1/notifications`)

All `/v1/notifications/*` routes require authentication.

### 1.1 `GET /v1/notifications`
- **Description**: List notifications for current user.
- **Response**:
  - `200 { items: Notification[], total, unreadCount }`.

### 1.2 `GET /v1/notifications/{notificationId}`
- **Params**:
  - `notificationId` (string, required).
- **Response**:
  - `200 { id, type, channels, title?, body, data?, readAt?, createdAt, ... }`.

### 1.3 `PATCH /v1/notifications/{notificationId}`
- **Description**: Mark a single notification read/unread.
- **Params**:
  - `notificationId` (string, required).
- **Body**:
  - Implementation usually supports flags like `{ read: true|false }` (see controller).

### 1.4 `POST /v1/notifications/mark-all-read`
- **Description**: Mark all notifications as read for current user.
- **Body**: none.

---

## 2. Notification Preferences (`/v1/notification-preferences`)

Requires authentication.

### 2.1 `GET /v1/notification-preferences`
- **Description**: Get current notification preference settings.
- **Response**:
  - `200 { email?: bool, sms?: bool, push?: bool, whatsapp?: bool }`.

### 2.2 `PATCH /v1/notification-preferences`
- **Body** (`updatePreferencesSchema`):
  - `email`, `sms`, `push`, `whatsapp` (bool, all optional).
- **Response**:
  - `200 { ...updated preferences... }`.

---

## 3. Template Management (`/v1/admin/notification-templates`)

Admin-only (gateway enforces admin roles; service uses `authenticate`).

Underlying service exposes `/v1/templates` for templates; gateway rewrites `/v1/admin/notification-templates/*` here.

### 3.1 `GET /v1/admin/notification-templates`
- **Description**: List notification templates.

### 3.2 `GET /v1/admin/notification-templates/{templateId}`
- **Params**:
  - `templateId` (string, required).

### 3.3 `POST /v1/admin/notification-templates`
- **Body** (`createTemplateSchema`):
  - `code` (string, required).
  - `name` (string 2–100, required).
  - `category` (string, required).
  - `channels` (string[], required): items in `EMAIL | SMS | PUSH | WHATSAPP`.
  - `subject`, `smsBody`, `emailSubject`, `emailBody`, `pushTitle`, `pushBody` (strings, optional).
  - `whatsappTemplateId` (string, optional).
  - `variables` (object, optional).
  - `isActive` (bool, default `true`).

### 3.4 `PATCH /v1/admin/notification-templates/{templateId}`
- **Body** (`updateTemplateSchema`):
  - Any subset of template fields to update.

### 3.5 `DELETE /v1/admin/notification-templates/{templateId}`
- **Description**: Delete template.

---

## 4. Admin Notification Logs & Test (`/v1/admin/notifications/*`)

Exposed at gateway and routed to `notification-service`’s `admin.routes.js`.

### 4.1 `GET /v1/admin/notifications/logs`
- **Auth**: admin.
- **Description**: List notification delivery logs.
- **Response**:
  - `200 { items: NotificationLog[], total }`.

### 4.2 `POST /v1/admin/notifications/test`
- **Auth**: admin.
- **Body** (`sendTestSchema`):
  - `userId` (string, required).
  - `templateCode` (string, required).
  - `channels` (string[] optional): subset of `EMAIL | SMS | PUSH | WHATSAPP`.
  - `variables` (object, optional).
- **Response**:
  - `200 { enqueued: true, id }`.

---

## 5. Internal Notification API (`/internal/v1/notifications/send`)

Hosted at gateway and proxied to `notification-service` `internal.routes.js`.

### 5.1 `POST /internal/v1/notifications/send`
- **Auth**: internal-only (`internalAuth`).
- **Description**: Service-to-service notification request API.
- **Body**:
  - `to` (string, required): target `userId`.
  - `template` (string, required): template code.
  - `channel` (string, optional): single channel; if omitted, service chooses defaults.
  - `data` (object, optional): template variables.
- **Response**:
  - `200 { enqueued: true, id }`.

---

## 6. Headers & Errors

- **Headers**:
  - `Authorization: Bearer <accessToken>` for user/admin endpoints.
  - Internal APIs authenticated via `internalAuth` (secret/service tokens).
  - `X-Request-Id` for tracing.
- **Error model**:
  - `{ error: { code: string, message: string, details?: any, traceId: string } }`.


