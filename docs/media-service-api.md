## Media Service API Contract (`media-service`)

**Base URL (via API Gateway)**: `/v1`  
**Service base path**: `/v1/media`  
**Auth**:
- Public: `GET /v1/media/{id}`, `GET /v1/media/{id}/renditions`.
- Authenticated: all other `/v1/media/*`.
- Admin-only: `/v1/media/admin/*` (exposed via `/v1/admin/media/*` at gateway).

---

## 1. Public Media Endpoints

### 1.1 `GET /v1/media/{id}`
- **Description**: Get media metadata (used by property/media consumers and sometimes directly by clients).
- **Params**:
  - `id` (string, required).
- **Response**:
  - `200 { id, type, url, status, size, contentType, createdAt, ... }`.

### 1.2 `GET /v1/media/{id}/renditions`
- **Description**: Get available renditions (thumb, webp, etc.).
- **Response**:
  - `200 { renditions: [{ type, url, width?, height? }...] }`.

---

## 2. Upload Flow

All require authentication.

### 2.1 `POST /v1/media/presign`
- **Description**: Generate a pre-signed upload URL for S3/object storage.
- **Body** (`validatePresign` – see `media.validator.js`):
  - Typically: `fileName`, `contentType`, `size`, `purpose` (`PROPERTY_MEDIA` | etc.).
- **Response**:
  - `200 { uploadUrl, mediaId, headers? }`.

### 2.2 `POST /v1/media/complete`
- **Description**: Mark upload as complete and create a media record; emits media events for processing.
- **Body** (`validateCompleteUpload`):
  - Likely includes: `mediaId`, `etag` or checksum, `dimensions?`, `duration?`, `metadata?`.
- **Response**:
  - `200 { id: mediaId, status: 'UPLOADED'|'PROCESSING', ... }`.

---

## 3. Media Management

### 3.1 `GET /v1/media`
- **Description**: List media records for current user/org with filters.
- **Query** (`validateListMedia`):
  - Filters for type, owner, createdAt range, pagination, etc.

### 3.2 `DELETE /v1/media/{id}`
- **Description**: Soft-delete or mark media as deleted.
- **Params**:
  - `id` (string, required).

---

## 4. Usage Tracking

### 4.1 `POST /v1/media/{id}/usage`
- **Description**: Register a usage of media (e.g. attached to property/project).
- **Body** (`validateUsage`):
  - Typically `{ entityType, entityId, role? }` (e.g., `PROPERTY`, `PROJECT`, `PRIMARY_IMAGE`).

### 4.2 `DELETE /v1/media/{id}/usage`
- **Description**: Remove a usage mapping.

---

## 5. Admin Media Operations (`/v1/media/admin/*`)

Underlying service mounts admin endpoints under `/v1/media/admin/*`, and the gateway rewrites `/v1/admin/media/*` to these paths.

### 5.1 `POST /v1/media/admin/{id}/reprocess`
- **Description**: Re-run media processing (thumbnails/transcodes) for a specific media.

### 5.1b `POST /v1/media/{id}/reprocess`
- **Description**: Backward-compatible admin reprocess endpoint (admin role required).
- **Auth**: bearer required + `ADMIN` role (service also checks role).

### 5.2 `GET /v1/media/admin/failed`
- **Description**: List failed media processing jobs for troubleshooting/retry.

### 5.3 `POST /v1/media/admin/{id}/override`
- **Description**: Override moderation decision for media (e.g., marking safe/unsafe).
- **Body** (`validateOverrideModeration`):
  - Contains flags to override moderation status and reason.

---

## 6. Headers & Errors

- **Headers**:
  - `Authorization: Bearer <accessToken>` required for all non-public media endpoints.
  - `X-Request-Id` for tracing.
- **Errors**:
  - `{ error: { code: string, message: string, details?: any, traceId: string } }`.


