## Lead Service API Contract (`lead-service`)

**Base URL (via API Gateway)**: `/v1`  
**Service base path**: `/v1/leads`, `/v1/webhooks/partner/leads`  
**Auth**:
- `/v1/leads/*`: bearer token required (buyer/agent/admin; role-based filtering in service).
- `/v1/webhooks/partner/leads`: no auth; uses signature/token verification at controller level.

---

## 1. Lead Management (`/v1/leads`)

All `/v1/leads` routes require authentication (`authenticate` middleware).

### 1.1 `POST /v1/leads`
- **Description**: Create a new lead (contact seller/agent).
- **Body** (`createLeadSchema`):
  - `propertyId` (string, optional): listing ID.
  - `projectId` (string, optional).
  - `sellerId` (string, required): user/org representing seller/agent.
  - `orgId` (string, optional).
  - `source` (string, required): one of  
    `PROPERTY_PAGE | SEARCH | SHORTLIST | CONTACT_FORM | PHONE | WHATSAPP | CHAT | PARTNER`.
  - `message` (string, ≤1000, optional).
  - `contactPreference` (string, optional): `PHONE | EMAIL | WHATSAPP`.
  - `buyerName` (string, 2–100, required).
  - `buyerPhone` (string, required).
  - `buyerEmail` (string, email, optional).
  - `budgetMin`, `budgetMax` (number ≥ 0, optional).
  - `preferredLocalities` (string[] optional).
  - `metadata` (object, optional).
- **Response**:
  - `201 { id, status: 'NEW', propertyId?, projectId?, sellerId, buyerName, buyerPhone, ... }`.

### 1.2 `GET /v1/leads`
- **Description**: List leads, scoped by role:
  - Buyer: leads created by current user.
  - Agent/Org: leads assigned to them/their org.
  - Admin: filtered global view.
- **Query** (`listLeadsQuerySchema`):
  - `status` (optional): `NEW | CONTACTED | INTERESTED | SITE_VISIT_SCHEDULED | SITE_VISIT_DONE | NEGOTIATING | CONVERTED | LOST | SPAM`.
  - `source` (optional): same enum as create.
  - `assignedToId` (string, optional).
  - `limit` (int 1–100, default 20).
  - `offset` (int ≥ 0, default 0).
- **Response**:
  - `200 { items: LeadSummary[], total, limit, offset }`.

### 1.3 `GET /v1/leads/{id}`
- **Description**: Get a single lead detail.
- **Params**:
  - `id` (string, required).
- **Response**:
  - `200 { id, status, source, buyer*, seller*, property*, project*, notes?, appointments?, ... }`.

### 1.4 `PATCH /v1/leads/{id}`
- **Description**: Update lead status (e.g. pipeline stage).
- **Body** (`updateLeadStatusSchema`):
  - `status` (string, required): one of  
    `NEW | CONTACTED | INTERESTED | SITE_VISIT_SCHEDULED | SITE_VISIT_DONE | NEGOTIATING | CONVERTED | LOST | SPAM`.
- **Response**:
  - `200 { ...updated lead... }`.

---

## 2. Lead Operations

### 2.1 `POST /v1/leads/{id}/assign`
- **Description**: Assign lead to an agent/member.
- **Body** (`assignLeadSchema`):
  - `assignedToId` (string, required).
- **Response**:
  - `200 { ...updated lead with assignment... }`.

### 2.2 Spam control

- **`POST /v1/leads/{id}/spam`**
  - Mark a lead as spam.
- **`POST /v1/leads/{id}/unspam`**
  - Remove spam mark.

Both respond with `200 { ...updated lead... }` or `404` if lead not found.

---

## 3. Notes

### 3.1 `POST /v1/leads/{id}/notes`
- **Description**: Add an internal/external note to a lead.
- **Body** (`addNoteSchema`):
  - `content` (string, 1–1000, required).
  - `isInternal` (bool, default `true`): whether visible only to internal users.
- **Response**:
  - `201 { id, content, isInternal, createdBy, createdAt }`.

### 3.2 `GET /v1/leads/{id}/notes`
- **Description**: List notes on a lead.
- **Response**:
  - `200 { items: Note[], total }`.

---

## 4. Appointments

### 4.1 `POST /v1/leads/{id}/appointment`
- **Description**: Create a site-visit / appointment for the lead.
- **Body** (`createAppointmentSchema`):
  - `propertyId` (string, optional).
  - `scheduledAt` (date, required).
  - `durationMinutes` (int 15–480, default 60).
  - `location` (string ≤500, optional).
  - `notes` (string ≤1000, optional).
- **Response**:
  - `201 { id, leadId, propertyId?, scheduledAt, durationMinutes, status: 'SCHEDULED', ... }`.

### 4.2 `GET /v1/leads/{id}/appointment`
- **Description**: Get current appointment for the lead (if any).

### 4.3 `PATCH /v1/leads/{id}/appointment`
- **Description**: Update appointment details or status.
- **Body** (`updateAppointmentSchema`):
  - `appointmentId` (string, required).
  - `scheduledAt` (date, optional).
  - `durationMinutes` (int 15–480, optional).
  - `location` (string ≤500, optional).
  - `notes` (string ≤1000, optional).
  - `status` (string, optional): `SCHEDULED | CONFIRMED | COMPLETED | CANCELLED | NO_SHOW`.

### 4.4 `DELETE /v1/leads/{id}/appointment`
- **Description**: Cancel appointment.
- **Body** (`cancelAppointmentSchema`):
  - `appointmentId` (string, required).

---

## 5. Callback & Metrics

### 5.1 `POST /v1/leads/{id}/call/request`
- **Description**: Request callback from seller/agent.
- **Response**:
  - `202 { status: 'REQUESTED', leadId, ... }` (exact shape service-defined).

### 5.2 `GET /v1/leads/metrics/summary`
- **Description**: Aggregate metrics for agent/admin dashboards.
- **Response**:
  - `200 { countsByStatus, conversionRates, timeToFirstContact, ... }`.

---

## 6. Partner Webhook (`/v1/webhooks/partner/leads`)

### 6.1 `POST /v1/webhooks/partner/leads`
- **Auth**: no gateway auth; controller validates signature/token on raw body.
- **Headers**:
  - `Content-Type: application/json` (raw body is used).
  - `X-Signature` or similar (implementation-specific).
- **Body**:
  - Partner-specific payload mapped internally to the generic lead schema; typically includes buyer contact details, property/project reference, and metadata.
- **Responses**:
  - `200 { success: true }` on accepted lead.
  - `400` / `401` on invalid payload/signature.

---

## 7. Common Headers & Errors

- **Headers**:
  - `Authorization: Bearer <accessToken>` for `/v1/leads/*`.
  - `X-Request-Id` propagated from gateway as `traceId` in errors and logs.
- **Errors** (all endpoints):
  - `{ error: { code: string, message: string, details?: any, traceId: string } }`.


