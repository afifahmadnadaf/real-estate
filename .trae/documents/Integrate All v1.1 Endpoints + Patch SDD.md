## Current Status (Verified Against Spec)
- The endpoint catalog already documents that multiple modules are not implemented yet: projects/inventory, reports/reviews, fraud/blacklist, SEO/CMS, metadata, feature flags/experiments, bulk import/export, support tickets, plus several gaps in auth/compliance/admin.
- A full route scan confirms these are **actually missing or mismatched in code** (not just undocumented).

## What “Fully Integrated” Means (Acceptance Criteria)
- Every endpoint in [Real_Estate_All_API_Endpoints_v1_1.md](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/Real_Estate_All_API_Endpoints_v1_1.md) returns a non-404 response through the API Gateway.
- Each endpoint is owned by exactly one service (no duplicate/circular routing).
- Admin endpoints follow the external contract `/v1/admin/...` even if services use service-local admin paths internally.
- The SDD [Real_Estate_Platform_SDD_v1_1.md](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/Real_Estate_Platform_SDD_v1_1.md) is updated so its module/service catalog and eventing assumptions match what’s implemented.

## Work Plan (Implementation)
### 1) Close Gaps in Existing Services (Low-risk, direct patches)
- **user-service**
  - Add missing auth endpoints: `/v1/auth/public-keys`, `/v1/auth/mfa/*`.
  - Add missing “me” endpoints: consents, security, activity, deactivate, delete confirm, export, verify email/phone.
- **admin-service**
  - Add missing RBAC endpoints per spec: `/v1/admin/permissions`, `POST /v1/admin/users/{userId}/roles`, `DELETE /v1/admin/users/{userId}/roles/{roleId}` (keep existing assign/revoke as compat).
  - Add missing audit export: `POST /v1/admin/audit/export`.
  - Add spec alias for system dependencies: `GET /v1/admin/system/dependencies` (map to existing stats/deps check).
- **org-service**
  - Add resend invite: `/v1/orgs/{orgId}/members/{memberId}/resend-invite`.
  - Add KYC withdraw: `/v1/orgs/{orgId}/kyc/{kycId}/withdraw`.
  - Implement optional teams CRUD if required by spec section.
- **geo-service**
  - Add POI endpoints: `/v1/geo/pois`, `/v1/geo/pois/{poiId}`.
  - Add optional `/v1/geo/clusters`.
- **user-interactions-service**
  - Add missing `GET /v1/saved-searches/{savedSearchId}`.
- **lead-service**
  - Add `POST /v1/leads/{leadId}/call/request`.
- **billing-service**
  - Align admin contracts to spec: support admin create/update/delete packages at `/v1/packages` (admin-protected) rather than `/v1/packages/admin*`.
  - Add coupon admin CRUD: `POST/PATCH/DELETE /v1/coupons/{couponId}` (admin-protected) and keep `POST /v1/coupons/validate` as optional extra.
- **notification-service**
  - Add `GET /v1/admin/notifications/logs`.

### 2) Implement Missing Modules (New routers + DB models where needed)
To satisfy “all endpoints are integrated”, the missing sections need real handlers. To keep architecture changes minimal while meeting the contract:
- **Projects & Inventory (`/v1/projects/*`)**
  - Implement under **property-service** (fits SDD’s listing types PROJECT/PROJECT_UNIT and existing `project.model.js`).
  - Add inventory unit storage (Mongo or Postgres via Prisma) + import job tracking.
- **Reports & Reviews (`/v1/reports`, `/v1/reviews`, admin queues/decisions)**
  - Implement under **moderation-service** (trust/moderation domain) using Postgres models.
- **Fraud/Abuse/Blacklists (`/v1/admin/fraud/*`, `/v1/admin/blacklist/*`, rate limits config)**
  - Implement under **moderation-service** (extend current blacklist list-only to full CRUD + fraud endpoints).
- **SEO/CMS Content (`/v1/seo/*`, `/v1/content/*`, `/v1/admin/content/*`)**
  - Implement under **admin-service** (ops-owned content), exposing public read routes and admin CRUD routes.
- **Metadata Master Data (`/v1/meta/*`, `/v1/admin/meta/*`)**
  - Implement under **admin-service** with Postgres tables (seeded) and admin CRUD.
- **Feature Flags & Experiments (`/v1/experiments/*`, `/v1/admin/feature-flags/*`, `/v1/admin/experiments/*`)**
  - Implement under **admin-service** backed by the existing runtime config store (extend schema as needed).
- **Bulk Import/Export (`/v1/admin/bulk/*`)**
  - Implement under **admin-service** with job table + placeholder runner; later can be offloaded to a worker.
- **Support/Tickets (`/v1/support/tickets/*`, `/v1/admin/support/tickets/*`)**
  - Implement under **admin-service** (or notification-service if you prefer) with Postgres models.

### 3) API Gateway Integration (No 404s, spec-stable)
- Add proxy routes for every new endpoint group: `/v1/projects`, `/v1/reports`, `/v1/reviews`, `/v1/seo`, `/v1/content`, `/v1/meta`, `/v1/experiments`, `/v1/support`, `/v1/admin/content`, `/v1/admin/meta`, `/v1/admin/feature-flags`, `/v1/admin/experiments`, `/v1/admin/bulk`, `/v1/admin/reports`, `/v1/admin/reviews`, `/v1/admin/fraud`, `/v1/admin/blacklist`.
- Normalize admin rewrites so external contract remains `/v1/admin/...` even if service-local paths differ.

### 4) Patch SDD v1.1 (No Contradictions)
- Update Service Catalog and “Key Flows” to reflect where the newly-added modules live (property-service vs admin-service vs moderation-service).
- Update Eventing section to include actual topic set and the enforced envelope/versioning rules once implemented.
- Update Observability/Deployment sections to match what exists (and what will be added) so the doc is not aspirational-only.

## Verification Plan (No Regressions)
- Add a generated endpoint contract test that asserts: for every endpoint in the spec file, the gateway routes it and the owning service responds (200/4xx/501 allowed, but not 404/502).
- Add service boot smoke tests (module import + app instantiation).
- Run `pnpm lint` and `pnpm test` workspace-wide.

## Output Deliverables
- A per-endpoint mapping table: `METHOD path → gateway route → owning service → handler`.
- Code changes implementing all missing endpoints.
- Patched SDD matching the implemented architecture.
- A final readiness verdict (Go / No-Go / Conditional Go) after tests pass.

## Next Step
- Once you confirm, I will begin implementing starting with the “existing-service gaps” (fast wins), then add the missing modules, then patch the gateway + SDD, and finally add the automated endpoint contract test to prevent drift.