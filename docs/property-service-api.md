## Property Service API Contract (`property-service`)

**Base URL (via API Gateway)**: `/v1`  
**Service base path**: `/v1/properties` (public + authenticated + admin)

---

## 1. Public Property Endpoints

These endpoints do **not** require authentication and are reachable directly via the gateway.

### 1.1 `GET /v1/properties`
- **Description**: List properties (non-ES, primarily owner/admin views and backup to search).
- **Query params** (see `listPropertiesSchema`):
  - `status` (optional): one of  
    `DRAFT | SUBMITTED | UNDER_REVIEW | PUBLISHED | REJECTED | EXPIRED | ARCHIVED`.
  - `type` (optional): `RENT | RESALE | PROJECT | PROJECT_UNIT`.
  - `cityId`, `localityId` (string, optional).
  - `limit` (int, 1–100, default 20).
  - `offset` (int, ≥0, default 0).
  - `sortBy` (string, default `createdAt`): `createdAt | updatedAt | price | publishedAt`.
  - `sortOrder` (string, default `desc`): `asc | desc`.
- **Response**:
  - `200 { items: PropertySummary[], total: number, limit, offset }`.

### 1.2 `GET /v1/properties/{id}`
- **Description**: Get property detail by ID.
- **Params**:
  - `id` (string, required).
- **Response**:
  - `200 { id, type, status, pricing, attributes, location, contact, media[], documents[], ... }`.

---

## 2. Authenticated Property Management

These endpoints require bearer auth (gateway applies `authMiddleware` before proxying).

### 2.1 `POST /v1/properties`
- **Description**: Create a new property listing in `DRAFT` status.
- **Body** (`createPropertySchema`):
  - `type` (string, required): `RENT | RESALE | PROJECT | PROJECT_UNIT`.
  - `title` (string, 10–200, required).
  - `description` (string, ≤5000, optional, can be empty).
  - `pricing` (object, required):
    - `amount` (number ≥ 0, required).
    - `currency` (string, default `INR`).
    - `priceType` (string, default `FIXED`): `FIXED | NEGOTIABLE | ON_REQUEST`.
    - `pricePerSqft` (number ≥ 0, optional).
    - `maintenanceCharges` (number ≥ 0, optional).
    - `maintenanceFrequency` (string, optional): `MONTHLY|QUARTERLY|YEARLY`.
    - `securityDeposit`, `depositMonths`, `brokerage` (number ≥ 0, optional).
    - `negotiable` (boolean, default `false`).
  - `attributes` (object, required):
    - `propertyType` (string, required).
    - `subType` (string, optional).
    - `bedrooms`, `bathrooms`, `balconies` (int, ranges as per validator, optional).
    - `floorNumber`, `totalFloors` (int, optional).
    - `carpetArea`, `builtUpArea`, `superBuiltUpArea`, `plotArea` (number ≥ 0, optional).
    - `areaUnit` (string, default `SQFT`): `SQFT|SQMT|SQYD|ACRE|HECTARE`.
    - `facing`, `ageOfProperty`, `flooring`, `waterSupply`, `powerBackup` (optional).
    - `possessionStatus` (string, optional): `READY | UNDER_CONSTRUCTION`.
    - `possessionDate` (date, optional).
    - `furnishing` (string, optional): `UNFURNISHED|SEMI_FURNISHED|FULLY_FURNISHED`.
    - `parking` (object, optional): `{ covered?: int≥0, open?: int≥0 }`.
    - `amenities`, `features` (string[] optional).
    - `nearbyPlaces` (optional array of `{ type, name, distance? }`).
  - `location` (object, required):
    - `address`, `landmark`, `locality`, `localityId` (string, optional).
    - `city` (string, required), `cityId` (string, required).
    - `state`, `stateId` (string, optional).
    - `country` (string, default `India`).
    - `pincode` (string, optional).
    - `geo` (object, optional): `{ lat: number (-90..90) required, lng: number (-180..180) required }`.
  - `contact` (object, optional):
    - `showPhone` (bool, default true).
    - `showEmail` (bool, default false).
    - `preferredContactTime` (string, optional).
    - `whatsappEnabled` (bool, default false).
  - `orgId` (string, optional).
- **Response**:
  - `201 { id, status: 'DRAFT', ... }`.

### 2.2 `PATCH /v1/properties/{id}`
- **Description**: Update a property (allowed in editable states).
- **Body**: same shape as `createPropertySchema` but all fields optional (`updatePropertySchema`).
- **Response**: `200 { ...updated property... }`.

### 2.3 `DELETE /v1/properties/{id}`
- **Description**: Delete property (owner/admin only).
- **Response**: `204` on success.

### 2.4 `GET /v1/properties/me/list`
- **Description**: List properties for current user/org.
- **Query**: same as `/v1/properties` (but scoped to owner).

---

## 3. Lifecycle Operations

All require auth; admin vs owner permissions enforced in service.

- **`POST /v1/properties/{id}/submit`**
  - Move from `DRAFT` → `SUBMITTED` and create moderation task.

- **`POST /v1/properties/{id}/resubmit`**
  - Resubmit after `REJECTED`/changes requested.

- **`POST /v1/properties/{id}/unpublish`**
  - Unpublish a property (admin/owner).

- **`POST /v1/properties/{id}/archive`**
- **`POST /v1/properties/{id}/restore`**
  - Archive and restore listings.

- **`POST /v1/properties/{id}/mark-sold`**
- **`POST /v1/properties/{id}/mark-rented`**
  - Mark outcome for resale/rent properties.

- **`POST /v1/properties/{id}/refresh`**
  - Bump listing (e.g. refresh timestamp / ranking).

**Admin-only (gateway enforces role)**:

- **`POST /v1/properties/{id}/publish`**
  - Approve + publish listing.

- **`POST /v1/properties/{id}/expire`**
  - Force expire listing (`PUBLISHED` → `EXPIRED`).

**Responses**:
- Success: `200 { property: ... }` (or `{ status: 'OK' }` depending on action).
- Errors: standard `{ error: { code, message, traceId, details? } }`.

---

## 4. Versioning & Audit

### 4.1 `GET /v1/properties/{id}/versions`
- **Description**: List immutable change history for a property.
- **Response**:
  - `200 { items: Version[], total: number }`  
    where `Version` includes fields like `version`, `diff`, `actor`, `createdAt`.

### 4.2 `GET /v1/properties/{id}/audit`
- **Description**: Get audit details (important changes, moderation actions, publishing events).

---

## 5. Media & Documents

### 5.1 `POST /v1/properties/{id}/media`
- **Description**: Attach a media item (image/video/doc) to property.
- **Body** (`attachMediaSchema`):
  - `mediaId` (string, required).
  - `type` (string, required): `image | video | floorPlan | document`.
  - `order` (int ≥ 0, optional).
  - `isPrimary` (bool, optional).
  - `alt`, `label`, `name` (string, optional).
  - `tags` (string[] optional).
- **Response**: `200 { property: { media: [...] } }`.

### 5.2 `PATCH /v1/properties/{id}/media/order`
- **Description**: Reorder media items.
- **Body** (`reorderMediaSchema`):
  - `mediaIds` (string[], min 1, required).

### 5.3 `DELETE /v1/properties/{id}/media/{mediaId}`
- **Description**: Detach media from property.

### 5.4 `POST /v1/properties/{id}/documents`
- **Description**: Attach document (RERA, ownership proof, etc.).
- **Body** (`attachDocumentSchema`):
  - `mediaId` (string, required).
  - `type` (string, required): `RERA | OWNERSHIP | MAP | OTHER`.
  - `name` (string, ≤200, required).

### 5.5 `DELETE /v1/properties/{id}/documents/{docId}`
- **Description**: Remove document from property.

---

## 6. Utility Endpoints

### 6.1 `GET /v1/properties/{id}/similar`
- **Description**: Fetch similar properties (used on detail page).
- **Response**: `200 { items: PropertySummary[] }`.

### 6.2 `POST /v1/properties/{id}/duplicate/check`
- **Description**: Run duplicate check for property (spam/fraud control).
- **Response**: `200 { isDuplicate: boolean, matches?: PropertySummary[] }`.

### 6.3 `POST /v1/properties/batch`
- **Description**: Batch-fetch multiple properties by ID.
- **Body** (`batchFetchSchema`):
  - `ids` (string[], min 1, max 50, required).
- **Response**: `200 { properties: Property[] }`.

### 6.4 `GET /v1/properties/{id}/contact-options`
- **Description**: Get contact options for listing (e.g., masked phone numbers, call/WhatsApp options).
- **Response**: `200 { phoneMasked?, whatsappEnabled?, contactWindow?, ... }`.

---

## 7. Common Headers & Errors

- **Request headers**:
  - `Authorization: Bearer <accessToken>` (required for non-public routes).
  - `X-Request-Id` (optional, trace ID; set by gateway if absent).
- **Errors**:
  - All endpoints return errors as  
    `{ error: { code: string, message: string, details?: any, traceId: string } }`.


