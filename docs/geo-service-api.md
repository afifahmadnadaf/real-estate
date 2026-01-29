## Geo Service API Contract (`geo-service`)

**Base URL (via API Gateway)**: `/v1`  
**Service base path**: `/v1/geo/*`  
**Auth**:
- Public: core geo lookups.
- Admin: `/v1/geo/admin/*` (exposed as `/v1/admin/geo/*` at gateway).

---

## 1. Public Geo APIs (`/v1/geo/*`)

### 1.1 `GET /v1/geo/countries`
- **Description**: List countries supported by the platform.
- **Response**:
  - `200 { items: Country[], total }`.

### 1.2 `GET /v1/geo/states`
- **Description**: List states (optionally filtered by country).

### 1.3 `GET /v1/geo/cities`
- **Description**: List cities (optionally filtered by state/country).

### 1.4 `GET /v1/geo/cities/{id}`
- **Description**: Get a city by ID.

### 1.5 `GET /v1/geo/localities`
- **Description**: List localities, optionally filtered by city/ids.

### 1.6 `GET /v1/geo/localities/{id}`
- **Description**: Get locality detail.

### 1.7 `GET /v1/geo/localities/{id}/polygon`
- **Description**: Get locality boundary polygon for map rendering.

### 1.8 `GET /v1/geo/geocode`
- **Description**: Forward geocoding (address → lat/lng).
- **Query**:
  - `q` or `address` (implementation-defined).

### 1.9 `GET /v1/geo/reverse-geocode`
- **Description**: Reverse geocoding (lat/lng → address/locality).
- **Query**:
  - `lat`, `lng` (numbers).

### 1.10 `GET /v1/geo/nearby`
- **Description**: Nearby POIs for a given point.
- **Query**:
  - `lat`, `lng`, `radius` (service-defined).

### 1.11 `GET /v1/geo/pois`
- **Description**: List points of interest.

### 1.12 `GET /v1/geo/pois/{poiId}`
- **Description**: Get POI details.

### 1.13 `GET /v1/geo/clusters`
- **Description**: Server-side clustering for map.
- **Query**:
  - Typically bounding box + zoom (see `geo.controller`).

---

## 2. Admin Geo APIs (`/v1/geo/admin/*`)

Mounted as `/v1/geo/admin` in the service; gateway rewrites `/v1/admin/geo/*` to these.

All require authentication and admin role.

### 2.1 `POST /v1/geo/admin/cities`
- **Description**: Create a city.
- **Body**:
  - City fields (name, slug, stateId, coordinates, metadata).

### 2.2 `PATCH /v1/geo/admin/cities/{id}`
- **Description**: Update city fields.

### 2.3 `POST /v1/geo/admin/localities`
- **Description**: Create locality.

### 2.4 `PATCH /v1/geo/admin/localities/{id}`
- **Description**: Update locality fields.

### 2.5 `POST /v1/geo/admin/pois`
- **Description**: Create point of interest.

### 2.6 `PATCH /v1/geo/admin/pois/{id}`
- **Description**: Update POI.

---

## 3. Headers & Errors

- **Headers**:
  - Public endpoints: no auth required.
  - Admin endpoints: `Authorization: Bearer <accessToken>` with admin role.
  - `X-Request-Id` for tracing.
- **Errors**:
  - `{ error: { code: string, message: string, details?: any, traceId: string } }`.


