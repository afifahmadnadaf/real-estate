## Analytics Service API Contract (`analytics-service`)

**Base URL (via API Gateway)**: `/v1`  
**Service base paths**:
- Public ingest: `/v1/events`
- Admin dashboards: `/v1/admin/analytics/*`

---

## 1. Event Ingestion (`/v1/events`)

These endpoints are intended for client-side tracking and can be called with or without authentication (if `userId` is present in body, it is trusted more than token-less IDs).

### 1.1 `POST /v1/events`
- **Description**: Ingest a single analytics/event payload.
- **Body** (`ingestEventSchema`):
  - `type` (string, required): event type name (e.g. `page_view`, `search`, `lead_created`).
  - `userId` (string, optional): user ID if known.
  - `sessionId` (string, optional).
  - `properties` (object, optional): event properties.
  - `timestamp` (date, optional): server will default to now if omitted.
- **Response**:
  - `202 { accepted: true }` or `200 { accepted: true }` (implementation-defined).

### 1.2 `POST /v1/events/batch`
- **Description**: Batch ingestion of analytics events.
- **Body** (`batchIngestSchema`):
  - `events` (array, required, length 1–100): each element must conform to `ingestEventSchema`.
- **Response**:
  - `202 { accepted: true, count: number }`.

---

## 2. Admin Analytics Dashboards (`/v1/admin/analytics/*`)

Exposed via API gateway and routed to `analytics-service` `admin.routes.js`.

All endpoints require authentication and admin role.

### 2.1 `GET /v1/admin/analytics/kpis`
- **Description**: High-level KPIs (listings, leads, conversions, etc.).
- **Query**:
  - Time window and filter parameters (e.g., `from`, `to`, `cityId`, etc.).
- **Response**:
  - `200 { metrics: { ... }, timeRange: { from, to } }`.

### 2.2 `GET /v1/admin/analytics/funnels`
- **Description**: Funnel metrics (search → view → lead → converted).
- **Response**:
  - `200 { funnels: [...], timeRange }`.

### 2.3 `GET /v1/admin/analytics/cohorts`
- **Description**: Cohort analysis endpoints.

### 2.4 `GET /v1/admin/analytics/attribution`
- **Description**: Attribution metrics (channel/source attribution).

---

## 3. Headers & Errors

- **Headers**:
  - Ingest endpoints: may include `Authorization: Bearer <accessToken>` but not required.
  - Admin endpoints: `Authorization: Bearer <accessToken>` with admin role.
  - `X-Request-Id` is used for tracing and attached as `traceId` on errors.
- **Error model**:
  - `{ error: { code: string, message: string, details?: any, traceId: string } }`.


