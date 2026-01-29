## Org Service API Contract (`org-service`)

**Base URL (via API Gateway)**: `/v1`  
**Service base paths**: `/v1/orgs/*`  
**Auth**:
- All `/v1/orgs/*` routes require authentication at the gateway (user/agent/builder/admin), with admin-only actions gated by role.

---

## 1. Organizations (`/v1/orgs`)

### 1.1 `POST /v1/orgs`
- **Description**: Create an organization (Agent firm/Builder).
- **Body** (`createOrgSchema` – see `org.validator.js`):
  - Typical fields: `name`, `type` (AGENT/BUILDER), `contact` info, `address`, `metadata` (exact fields as per validator).
- **Response**:
  - `201 { id, name, type, ownerId, ... }`.

### 1.2 `GET /v1/orgs`
- **Description**:
  - For non-admins: list orgs linked to current user.
  - For admins: list organizations with filters.
- **Query**: pagination and filter params (as implemented in `org.controller.listOrgs`).

### 1.3 `GET /v1/orgs/{orgId}`
- **Description**: Get detailed org profile.
- **Params**:
  - `orgId` (string, required).

### 1.4 `PATCH /v1/orgs/{orgId}`
- **Description**: Update organization profile.
- **Body** (`updateOrgSchema`):
  - Allowed fields: display name, contact info, address, metadata, etc.

### 1.5 `POST /v1/orgs/{orgId}/logo`
- **Description**: Attach/update organization logo (after media upload).
- **Body** (`uploadLogoSchema`):
  - Likely `{ mediaId, crop?, ... }` – see validator for shape.

---

## 2. KYC & Verification (`/v1/orgs/{orgId}/kyc*`)

### 2.1 `POST /v1/orgs/{orgId}/kyc`
- **Description**: Submit a new KYC document.
- **Body** (`submitKycSchema`):
  - Document metadata fields (e.g., `documentType`, `mediaId`, `number`, `issuedBy`, `expiresAt`, etc.).

### 2.2 `GET /v1/orgs/{orgId}/kyc`
- **Description**: List KYC documents for org.

### 2.3 `GET /v1/orgs/{orgId}/kyc/{kycId}`
- **Description**: Get a specific KYC document.

### 2.4 `PATCH /v1/orgs/{orgId}/kyc/{kycId}`
- **Description**: Update/replace KYC document fields.
- **Body** (`updateKycSchema`): partial update of KYC doc.

### 2.5 `POST /v1/orgs/{orgId}/kyc/{kycId}/withdraw`
- **Description**: Withdraw a pending KYC document (before review).

### 2.6 `GET /v1/orgs/{orgId}/verification/status`
- **Description**: Aggregated verification status for org.
- **Response**:
  - `200 { status: 'PENDING'|'VERIFIED'|'REJECTED'|'CHANGES_REQUESTED', details? }`.

### 2.7 Verification Actions (`/v1/orgs/{orgId}/verification/*`)

These are invoked by admin tooling but are mounted on the org router, so they exist under the user path as well:

- **`POST /v1/orgs/{orgId}/verification/approve`**
- **`POST /v1/orgs/{orgId}/verification/reject`**
- **`POST /v1/orgs/{orgId}/verification/request-changes`**
  - **Body**:
    - `changes` (array, required, min 1):
      - `{ field: string, message: string }`

---

## 3. Members (`/v1/orgs/{orgId}/members*`)

### 3.1 `GET /v1/orgs/{orgId}/members`
- **Description**: List members for an organization.

### 3.2 `POST /v1/orgs/{orgId}/members`
- **Description**: Invite/add a member.
- **Body** (`inviteMemberSchema`):
  - Likely `{ email | phone, role, name?, metadata? }`.

### 3.3 `GET /v1/orgs/{orgId}/members/{memberId}`
- **Description**: Get single member details.

### 3.4 `PATCH /v1/orgs/{orgId}/members/{memberId}`
- **Description**: Update member role/status.
- **Body** (`updateMemberSchema`):
  - e.g. `{ role?, status? }` as defined in validator.

### 3.5 `DELETE /v1/orgs/{orgId}/members/{memberId}`
- **Description**: Remove a member from org.

### 3.6 `POST /v1/orgs/{orgId}/members/{memberId}/resend-invite`
- **Description**: Resend invitation email/SMS.

---

## 4. Teams (`/v1/orgs/{orgId}/teams*`)

### 4.1 `GET /v1/orgs/{orgId}/teams`
- **Description**: List teams for org.

### 4.2 `POST /v1/orgs/{orgId}/teams`
- **Description**: Create a team.
- **Body**:
  - Typical fields: `name`, `description?`, `memberIds?` (see `team.controller` for implementation).

### 4.3 `GET /v1/orgs/{orgId}/teams/{teamId}`
- **Description**: Get a team.

### 4.4 `PATCH /v1/orgs/{orgId}/teams/{teamId}`
- **Description**: Update team (name, membership, etc.).

### 4.5 `DELETE /v1/orgs/{orgId}/teams/{teamId}`
- **Description**: Delete a team.

---

## 5. Admin Org Verification (via `/v1/admin/orgs/*`)

The service mounts the same org router under both `/v1/orgs/*` and `/v1/admin/orgs/*` (admin UI paths).

### 5.1 Admin Org Management (`/v1/admin/orgs`)

#### `GET /v1/admin/orgs`
- **Auth**: admin.
- **Description**: List organizations with admin filters/pagination (implementation-defined).

#### `GET /v1/admin/orgs/{orgId}`
- **Auth**: admin.
- **Params**:
  - `orgId` (string, required)

#### `POST /v1/admin/orgs`
- **Auth**: admin.
- **Headers**:
  - `Content-Type: application/json`
- **Body** (same as `POST /v1/orgs`):
  - `name` (string, 2–200, required)
  - `type` (string, required): `AGENT_FIRM | BUILDER | INDIVIDUAL_AGENT`
  - `description` (string ≤2000, optional)
  - `website` (string uri, optional, nullable/empty allowed)
  - `contactEmail` (string email, optional)
  - `contactPhone` (string, optional)
  - `address` (object, optional): `{ line1?, line2?, city?, state?, pincode?, country? }`
  - `reraNumbers` (string[], optional)
  - `gstNumber`, `panNumber` (string, optional, nullable/empty allowed)
  - `establishedYear` (number, 1900–currentYear, optional)
  - `employeeCount` (number ≥ 1, optional)

#### `PATCH /v1/admin/orgs/{orgId}`
- **Auth**: admin.
- **Body**: any subset of the create fields (same constraints; nullable/empty allowed where supported).

#### `POST /v1/admin/orgs/{orgId}/logo`
- **Auth**: admin.
- **Body**:
  - `mediaId` (string, required)

### 5.2 Admin Verification Actions

These are available both under user path `/v1/orgs/{orgId}/verification/*` and admin UI path `/v1/admin/orgs/{orgId}/verification/*`.

- **`POST /v1/admin/orgs/{orgId}/verification/approve`**
- **`POST /v1/admin/orgs/{orgId}/verification/reject`**
- **`POST /v1/admin/orgs/{orgId}/verification/request-changes`**
  - **Body**:
    - `changes` (array, required, min 1):
      - `{ field: string, message: string }`

---

## 6. Headers & Errors

- **Headers**:
  - `Authorization: Bearer <accessToken>` (all org endpoints).
  - `X-Request-Id` for tracing.
- **Error model** (all endpoints):
  - `{ error: { code: string, message: string, details?: any, traceId: string } }`.


