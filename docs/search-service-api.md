## Search Service API Contract (`search-service`)

**Base URL (via API Gateway)**: `/v1`  
**Service base paths**:
- Public/search: `/v1/search/*`
- Internal: `/internal/v1/search/index` (gateway → search-service)

---

## 1. Public Search APIs (`/v1/search/*`)

### 1.1 `GET /v1/search/properties`
- **Description**: Full text + filtered property search (backed by Elasticsearch).
- **Query** (`searchQuerySchema`):
  - `q` (string ≤200, optional): search text.
  - `type` (optional): `RENT | RESALE | PROJECT | PROJECT_UNIT`.
  - `cityId`, `localityId` (string, optional).
  - `minPrice`, `maxPrice` (int ≥ 0, optional).
  - `bedrooms`, `bathrooms` (int, 0–20, optional).
  - `propertyType` (string, optional).
  - `furnishing` (string, optional): `UNFURNISHED | SEMI_FURNISHED | FULLY_FURNISHED`.
  - `possessionStatus` (string, optional): `READY | UNDER_CONSTRUCTION`.
  - `amenities` (string, optional; typically comma-separated).
  - `lat`, `lng` (number, optional): center for geo search.
  - `radius` (number, 0–100 km, optional).
  - `sortBy` (string, default `relevance`): `relevance | price | newest`.
  - `sortOrder` (string, default `desc`): `asc | desc`.
  - `limit` (int 1–100, optional).
  - `offset` (int ≥ 0, optional).
- **Response**:
  - `200 { items: PropertySearchResult[], total, limit, offset }`.

### 1.2 `GET /v1/search/map`
- **Description**: Map search for properties with bounding box and clustering.
- **Query** (`mapSearchQuerySchema`):
  - `bounds` (string, optional) – encoded bbox; or:
  - `north`, `south`, `east`, `west` (numbers, optional).
  - `zoom` (int 0–20, optional).
- **Response**:
  - `200 { clusters: [...], items?: PropertySearchResult[] }` (service-defined).

### 1.3 `GET /v1/search/suggest`
- **Description**: Autocomplete suggestions for locations/search phrases.
- **Query** (`autocompleteQuerySchema`):
  - `q` (string, 2–100, required).
  - `limit` (int 1–50, default 10).
- **Response**:
  - `200 { suggestions: [{ type, label, value, ... }] }`.

### 1.4 `GET /v1/search/filters`
- **Description**: Filter metadata for UI (price ranges, bedroom options, etc.).
- **Response**:
  - `200 { filters: { ... } }`.

### 1.5 `GET /v1/search/trending`
- **Description**: Trending searches for display.
- **Response**:
  - `200 { items: [{ query, count, cityId?, ... }] }`.

### 1.6 `GET /v1/search/recent`
- **Auth**: bearer required (`authenticate`).
- **Description**: Recently performed searches for current user.

### 1.7 `DELETE /v1/search/recent`
- **Auth**: bearer required.
- **Description**: Clear user’s recent searches.

---

## 2. Admin Search APIs (`/v1/admin/search/*`)

Exposed at gateway as `/v1/admin/search/*` and rewritten to `/v1/search/admin/*` in `search-service`.

### 2.1 `POST /v1/admin/search/reindex`
- **Auth**: admin.
- **Description**: Trigger (re)index of properties into ES.
- **Response**:
  - `202 { taskId }`.

### 2.2 `GET /v1/admin/search/reindex/{taskId}`
- **Auth**: admin.
- **Params**:
  - `taskId` (string, required).
- **Response**:
  - `200 { taskId, status, progress?, startedAt?, finishedAt?, ... }`.

### 2.3 `GET /v1/admin/search/index/health`
- **Auth**: admin.
- **Description**: ES index health (shards, replicas, lag).
- **Response**:
  - `200 { status, details }`.

---

## 3. Internal Indexing API (`/internal/v1/search/index`)

This is hosted by `api-gateway` and proxied to `search-service`’s `internal.routes.js`.

### 3.1 `POST /internal/v1/search/index`
- **Auth**: internal-only, enforced by `internalAuth` (service-to-service).
- **Description**: Upsert or delete index documents.
- **Body**:
  - `index` (string, optional, default `'properties'`).
  - `id` (string, required): document ID.
  - `doc` (object, required unless `op === 'delete'`): ES document body.
  - `op` (string, optional, default `'upsert'`): `'upsert' | 'delete'`.
- **Responses**:
  - `200 { accepted: true }` on success.
  - `400 { success: false, error: 'id required' | 'doc required' }` on validation failure.

---

## 4. Headers & Errors

- **Headers**:
  - Public search: no auth required (except `/recent`).
  - Authenticated endpoints: `Authorization: Bearer <accessToken>`.
  - Internal endpoint: authentication via internal service token headers (configured in `internalAuth`).
  - `X-Request-Id` (trace ID) is forwarded from gateway.
- **Errors**:
  - `{ error: { code: string, message: string, details?: any, traceId: string } }`.


