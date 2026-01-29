## User Interactions Service API Contract (`user-interactions-service`)

**Base URL (via API Gateway)**: `/v1`  
**Service base paths**:
- `/v1/shortlists`
- `/v1/saved-searches`
- `/v1/alerts/price`

All routes require authentication.

---

## 1. Shortlists (`/v1/shortlists`)

### 1.1 `GET /v1/shortlists`
- **Description**: List shortlisted properties for current user.
- **Response**:
  - `200 { items: ShortlistEntry[], total }`.

### 1.2 `POST /v1/shortlists`
- **Description**: Add property to shortlist.
- **Body** (`addToShortlistSchema`):
  - `propertyId` (string, required).
- **Response**:
  - `201 { id, propertyId, createdAt }`.

### 1.3 `DELETE /v1/shortlists/{id}`
- **Description**: Remove a shortlist entry by ID.
- **Params**:
  - `id` (string, required).

### 1.4 `POST /v1/shortlists/bulk`
- **Description**: Bulk add/remove properties from shortlist.
- **Body** (`bulkUpdateShortlistSchema`):
  - `propertyIds` (string[], min 1, max 50, required).
  - `action` (string, required): `add | remove`.

---

## 2. Saved Searches (`/v1/saved-searches`)

### 2.1 `GET /v1/saved-searches`
- **Description**: List saved searches for current user.
- **Response**:
  - `200 { items: SavedSearch[], total }`.

### 2.2 `POST /v1/saved-searches`
- **Description**: Create a saved search (with optional alerts).
- **Body** (`createSavedSearchSchema`):
  - `name` (string, 1–200, required).
  - `filters` (object, required): serialized search query/filter set.
  - `alertEnabled` (bool, optional).
  - `alertFrequency` (string, optional): `DAILY | WEEKLY | MONTHLY`.

### 2.3 `GET /v1/saved-searches/{id}`
- **Params**:
  - `id` (string, required).

### 2.4 `PATCH /v1/saved-searches/{id}`
- **Description**: Update saved search.
- **Body** (`updateSavedSearchSchema`):
  - Any subset of: `name`, `filters`, `alertEnabled`, `alertFrequency`.

### 2.5 `DELETE /v1/saved-searches/{id}`
- **Description**: Delete a saved search.

---

## 3. Price Alerts (`/v1/alerts/price`)

### 3.1 `GET /v1/alerts/price`
- **Description**: List price alerts for current user.

### 3.2 `POST /v1/alerts/price`
- **Description**: Create a price alert on a property.
- **Body** (`createPriceAlertSchema`):
  - `propertyId` (string, required).
  - `targetPrice` (number ≥ 0, required).

### 3.3 `PATCH /v1/alerts/price/{id}`
- **Description**: Update price alert.
- **Body** (`updatePriceAlertSchema`):
  - `targetPrice` (number ≥ 0, optional).
  - `isActive` (bool, optional).

### 3.4 `DELETE /v1/alerts/price/{id}`
- **Description**: Delete a price alert.

---

## 4. Headers & Errors

- **Headers**:
  - `Authorization: Bearer <accessToken>` for all endpoints.
  - `X-Request-Id` for request tracing.
- **Error model**:
  - `{ error: { code: string, message: string, details?: any, traceId: string } }`.


