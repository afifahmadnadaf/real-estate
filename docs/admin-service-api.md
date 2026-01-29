## Admin Service API Contract (`admin-service`)

**Base URL (via API Gateway)**: `/v1`  
**Gateway admin prefix**: `/v1/admin/*`  
**This service backs**:
- Admin RBAC (roles/permissions)
- Meta/master data
- Content/CMS & SEO
- Feature flags & experiments
- Audit logs
- System status/dependencies

All `/v1/admin/*` routes require authentication with `ADMIN`/`SUPER_ADMIN` role at the gateway.

---

## 1. RBAC & Permissions (`/v1/admin/roles`, `/v1/admin/permissions`)

Backed by `admin.routes.js`.

### 1.1 `GET /v1/admin/roles`
- **Description**: List roles.

### 1.2 `GET /v1/admin/roles/{roleId}`
- **Description**: Get role detail.

### 1.3 `POST /v1/admin/roles`
- **Description**: Create role.
- **Body**:
  - Role payload (name, permissions set, metadata).

### 1.4 `PATCH /v1/admin/roles/{roleId}`
- **Description**: Update role.

### 1.5 `DELETE /v1/admin/roles/{roleId}`
- **Description**: Delete role.

### 1.6 `GET /v1/admin/permissions`
- **Description**: List defined permissions.

### 1.7 User-role management

- `POST /v1/admin/roles/assign`
- `POST /v1/admin/roles/revoke`
- `GET /v1/admin/users/{userId}/roles`
- `POST /v1/admin/users/{userId}/roles`
- `DELETE /v1/admin/users/{userId}/roles/{roleId}`

These endpoints assign/remove roles on users and fetch their roles.

### 1.8 `POST /v1/admin/internal/permissions/check`
- **Description**: Internal permission check used by API Gateway / services.
- **Headers**:
  - `Authorization: Bearer <accessToken>` (required)
  - `Content-Type: application/json`
- **Body**:
  - `userId` (string, required)
  - `permission` (string, required)
- **Responses**:
  - `200`: `{ success: true, allowed: boolean }`
  - `400`: `{ success: false, message: 'userId and permission required' }`

---

## 2. Metadata / Master Data

### 2.1 Public Metadata (`/v1/meta/*`)

Backed by `meta.routes.js`:

- `GET /v1/meta/property-types`
- `GET /v1/meta/amenities`
- `GET /v1/meta/furnishing`
- `GET /v1/meta/facing`
- `GET /v1/meta/ownership-types`
- `GET /v1/meta/availability`
- `GET /v1/meta/sort-options`

All return `{ items: MetaItem[], total }` for given category.

### 2.2 Admin Metadata (`/v1/admin/meta/*`)

Backed by `admin.meta.routes.js`:

- `GET /v1/admin/meta/{category}`
- `POST /v1/admin/meta/{category}`
- `PATCH /v1/admin/meta/{category}/{id}`
- `DELETE /v1/admin/meta/{category}/{id}`

Where `category` is one of `property-types`, `amenities`, etc.

Common categories used by admin UI:

- Property types
  - `GET /v1/admin/meta/property-types`
  - `POST /v1/admin/meta/property-types`
  - `PATCH /v1/admin/meta/property-types/{id}`
  - `DELETE /v1/admin/meta/property-types/{id}`
- Amenities
  - `GET /v1/admin/meta/amenities`
  - `POST /v1/admin/meta/amenities`
  - `PATCH /v1/admin/meta/amenities/{id}`
  - `DELETE /v1/admin/meta/amenities/{id}`

---

## 3. Content & CMS

### 3.1 Public Content (`/v1/content/*`)

Backed by `content.routes.js`:

- `GET /v1/content/home` – home page content blocks.
- `GET /v1/content/faq` – FAQ content.
- `GET /v1/content/blog` – blog list.
- `GET /v1/content/blog/{slug}` – blog detail.
- `GET /v1/content/banners` – active banners for web/app.

### 3.2 Admin Content (`/v1/admin/content/*`)

Backed by `admin.content.routes.js`:

- `GET /v1/admin/content/pages`
- `POST /v1/admin/content/pages`
- `GET /v1/admin/content/pages/{pageId}`
  - Implemented via controller methods.
- `PATCH /v1/admin/content/pages/{pageId}`
- `DELETE /v1/admin/content/pages/{pageId}`

- `GET /v1/admin/content/banners`
- `POST /v1/admin/content/banners`
- `PATCH /v1/admin/content/banners/{bannerId}`
- `DELETE /v1/admin/content/banners/{bannerId}`

- `GET /v1/admin/content/seo`
- `POST /v1/admin/content/seo`
- `DELETE /v1/admin/content/seo/{slug}`

---

## 4. SEO Landing Pages (`/v1/seo/*`)

Backed by `seo.routes.js`:

- `GET /v1/seo/landing/cities`
- `GET /v1/seo/landing/city/{citySlug}`
- `GET /v1/seo/landing/locality/{localitySlug}`

These return SEO-optimized page configs/content blocks for city/locality landings.

---

## 5. Experiments & Feature Flags

### 5.1 Public Experiments (`/v1/experiments/*`)

Backed by `experiments.routes.js`:

- `GET /v1/experiments`
  - **Auth**: optional (`optionalAuth`).
  - **Description**: List experiment definitions needed by clients (service-defined shape).
- `POST /v1/experiments/exposure`
  - **Auth**: optional (`optionalAuth`).
  - **Description**: Unified exposure logging endpoint (preferred by newer clients).
- `GET /v1/experiments/{key}/assignment`
  - **Auth**: optional (`optionalAuth`); uses user/session to compute assignment.
- `POST /v1/experiments/{key}/exposures`
  - **Description**: Log experiment exposure for analytics.

### 5.2 Admin Feature Flags (`/v1/admin/feature-flags/*`)

Backed by `admin.feature-flags.routes.js`:

- `GET /v1/admin/feature-flags`
- `GET /v1/admin/feature-flags/{key}`
- `POST /v1/admin/feature-flags`
- `PATCH /v1/admin/feature-flags/{key}`
- `DELETE /v1/admin/feature-flags/{key}`

Payloads contain flag definition (key, description, enabled, rules/targets).

### 5.3 Admin Experiments (`/v1/admin/experiments`)

Backed by `admin.experiments.routes.js`:

- `GET /v1/admin/experiments`
- `POST /v1/admin/experiments`
- `PATCH /v1/admin/experiments/{key}`
- `DELETE /v1/admin/experiments/{expId}`

---

## 6. Audit Logs (`/v1/admin/audit/*`)

Backed by `audit.routes.js`:

- `GET /v1/admin/audit`
  - **Query**: filters for actor, entityType, date range, action.
- `GET /v1/admin/audit/{auditId}`
  - Get a single audit record.
- `POST /v1/admin/audit/export`
  - Trigger export of audit logs (e.g. CSV).

---

## 7. System Status (`/v1/admin/system/*`)

Backed by `system.routes.js`:

- `GET /v1/admin/system/status`
  - High-level system status (overall OK/degraded).
- `GET /v1/admin/system/stats`
  - System stats (traffic, error rate, etc.).
- `GET /v1/admin/system/dependencies`
  - Dependencies health (databases, Kafka, external APIs).

### 7.4 Rate Limits (`/v1/admin/rate-limits`)

- `GET /v1/admin/rate-limits`
  - **Description**: View current rate limit configuration and counters (service-defined shape).
- `PATCH /v1/admin/rate-limits`
  - **Description**: Update rate limit configuration (service-defined payload).

### 7.5 Bot / Abuse Controls (`/v1/admin/bot/*`)

- `GET /v1/admin/bot/blocked`
  - **Description**: List blocked identifiers (IPs/devices/users) used by bot protection.

### 7.6 Bulk Import/Export (`/v1/admin/bulk/*`)

- `GET /v1/admin/bulk/jobs`
  - **Description**: List bulk jobs (imports/exports).
- `GET /v1/admin/bulk/jobs/{jobId}`
  - **Description**: Get a bulk job.
- `GET /v1/admin/bulk/jobs/{jobId}/errors`
  - **Description**: Fetch job errors (row-level failures, validation issues).
- `POST /v1/admin/bulk/export/properties`
  - **Description**: Export properties (CSV/JSON; service-defined response).
- `GET /v1/admin/bulk/export/{exportId}`
  - **Description**: Download/export status endpoint.
- `POST /v1/admin/bulk/import/properties`
  - **Description**: Start properties import (payload depends on importer; typically file/media reference).
- `POST /v1/admin/bulk/import/projects`
  - **Description**: Start projects import.

### 7.7 Support Tickets (`/v1/support/*`, `/v1/admin/support/*`)

User/agent support (auth required):

- `GET /v1/support/tickets`
- `POST /v1/support/tickets`
- `GET /v1/support/tickets/{ticketId}`
- `PATCH /v1/support/tickets/{ticketId}`

Admin support tooling (admin role):

- `GET /v1/admin/support/tickets`
- `PATCH /v1/admin/support/tickets/{ticketId}`

---

## 8. Headers & Errors

- **Headers**:
  - `Authorization: Bearer <accessToken>` with admin role for all `/v1/admin/*` paths.
  - `X-Request-Id` for tracing.
- **Error model**:
  - `{ error: { code: string, message: string, details?: any, traceId: string } }`.

---

## 9. Internal Runtime Config (`/internal/v1/config`)

These endpoints are **internal-only** and protected by `internalAuth` middleware.

### 9.1 `GET /internal/v1/config`
- **Headers**:
  - `X-Internal-Token: <INTERNAL_API_TOKEN>` (required)
- **Query**:
  - `key` (string, optional): if provided, returns a single key/value.
- **Responses**:
  - `200`: if `key` provided → `{ key: string, value: any }`
  - `200`: if `key` omitted → `{ [key: string]: any }`

### 9.2 `POST /internal/v1/config`
- **Headers**:
  - `X-Internal-Token: <INTERNAL_API_TOKEN>` (required)
  - `Content-Type: application/json`
- **Body**:
  - JSON object of config entries: `{ [key: string]: any }`
- **Response**:
  - `200`: `{ success: true, updatedKeys: string[] }`


