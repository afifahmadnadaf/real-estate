## Moderation Service API Contract (`moderation-service`)

**Base URL (via API Gateway)**: `/v1`  
**Service base paths**:
- Public/user: `/v1/reports`, `/v1/reviews`
- Admin: `/v1/admin/moderation/*`, `/v1/admin/reports/*`, `/v1/admin/reviews/*`, `/v1/admin/blacklist/*`

---

## 1. User-Facing Reports & Reviews

### 1.1 `POST /v1/reports`
- **Description**: Report a listing/user for spam/fraud/abuse.
- **Body** (`report.controller.createReport`):
  - Typically includes: `entityType` (`PROPERTY | USER | ORG | MEDIA`), `entityId`, `reasonCode`, `description?`, `metadata?`.
- **Response**:
  - `201 { id, status: 'OPEN', ... }`.

### 1.2 `GET /v1/reports`
- **Description**: List reports created by current user.

### 1.3 `GET /v1/reports/{reportId}`
- **Description**: Get a specific report details.

### 1.4 `POST /v1/reviews`
- **Description**: Create a review (for agent/builder/project).
- **Body**:
  - `targetType`, `targetId`, `rating`, `title?`, `comment`, `metadata?`.

### 1.5 `GET /v1/reviews`
- **Description**: List reviews for an entity or by user (query params).

### 1.6 `GET /v1/reviews/{reviewId}`
- **Description**: Get single review.

---

## 2. Admin Moderation Queue (`/v1/admin/moderation/*`)

Mounted in `moderation.routes.js`, protected by admin auth (gateway).

### 2.1 `GET /v1/admin/moderation/queue`
- **Description**: Unified moderation queue (properties, media, reviews, reports).
- **Query** (`validateQueueQuery`):
  - Filters for status, type, assignee, pagination, etc.

### 2.2 `GET /v1/admin/moderation/queue/{taskId}`
- **Description**: Get a specific moderation task.
- **Params**:
  - `taskId` (string, required).

### 2.3 `POST /v1/admin/moderation/{taskId}/claim`
- **Description**: Claim a moderation task.

### 2.4 `POST /v1/admin/moderation/{taskId}/release`
- **Description**: Release a claimed task.

### 2.5 `POST /v1/admin/moderation/{taskId}/decision`
- **Description**: Make moderation decision.
- **Body** (`validateDecision`):
  - e.g. `{ decision: 'APPROVE'|'REJECT'|'REQUEST_CHANGES', reasonCode?, comment? }`.

### 2.6 `POST /v1/admin/moderation/{taskId}/comment`
- **Description**: Add moderator comment.
- **Body** (`validateComment`):
  - `{ comment: string }`.

### 2.7 `GET /v1/admin/moderation/stats`
- **Description**: Moderation statistics (SLAs, queue sizes, decision split).

---

## 3. Admin Rules & Fraud/Blacklist

### 3.1 Moderation Rules (`/v1/admin/moderation/rules`)

Underlying `rules.routes.js` implements:

- `GET /v1/admin/moderation/rules`
  - **Query** (`validateListRulesQuery`): filters for type/status/pagination.
- `POST /v1/admin/moderation/rules`
  - **Body** (`validateCreateRule`): rule definition (conditions, actions).
- `PATCH /v1/admin/moderation/rules/{ruleId}`
  - **Body** (`validateUpdateRule`): partial update.
- `DELETE /v1/admin/moderation/rules/{ruleId}`

### 3.2 Blacklist (`/v1/admin/blacklist/*`)

Underlying `blacklist.routes.js` implements:

- `GET /v1/admin/blacklist`
  - List blacklist entries (e.g. phones, emails, IPs).
- `POST /v1/admin/blacklist`
  - Create blacklist entry.
- `PATCH /v1/admin/blacklist/{entryId}`
  - Update entry fields.
- `DELETE /v1/admin/blacklist/{entryId}`
  - Delete entry.

---

## 4. Admin Reports & Reviews Queues

### 4.1 `GET /v1/admin/reports/queue`
- **Description**: Reports moderation queue.

### 4.2 `POST /v1/admin/reports/{reportId}/decision`
- **Description**: Admin decision on a user-submitted report.

### 4.3 `GET /v1/admin/reviews/queue`
- **Description**: Reviews moderation queue.

### 4.4 `POST /v1/admin/reviews/{reviewId}/decision`
- **Description**: Approve/reject a review.

---

## 5. Headers & Errors

- **Headers**:
  - User-facing endpoints: `Authorization: Bearer <accessToken>` for create/list where required.
  - Admin endpoints: `Authorization: Bearer <accessToken>` with admin role.
  - `X-Request-Id` for tracing.
- **Errors**:
  - `{ error: { code: string, message: string, details?: any, traceId: string } }`.


