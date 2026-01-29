## Scope

* Validate system behavior end-to-end **only through the API Gateway** for all service interactions.

* Cover flows A–I: health, auth, org, property/project, media, search, leads/notifications, billing, moderation/admin.

* Apply fixes only if a flow is blocked; keep fixes minimal and guarded by local/dev env flags.

## Bring-Up Prereqs (Adjusted to Repo State)

* Create `.env` from the repo’s actual example file: `env.example` (docs currently mention `.env.example`).

* Start infrastructure using the only compose file present: `docker/docker-compose.yml` (the repo does not include `docker-compose.services.yml` / `docker-compose.dev.yml`).

* Start gateway + services + workers via `pnpm run dev` (root script runs all workspaces in parallel).

* Run DB setup via existing scripts:

  * `pnpm run prisma:generate`

  * `pnpm run migrate` (or `pnpm run migrate:dev`)

* Note: root `seed`/`setup` scripts referenced in `package.json` point to a missing `scripts/` directory, so the validation will not assume seeded admin/users exist.

## Observability & Safety Checks

* Validate via gateway:

  * `GET /health`, `GET /ready`, `GET /metrics`.

* Ensure workers are running and consuming (search-indexer, media-processor, notification-worker) by watching their logs for steady-state (no crash loops / endless retries).

* Ensure no outbound internet calls occur during validation (especially billing). If any are observed, treat as a failure and implement an env-guarded local stub.

## Flow Validation (Concrete Gateway Endpoints)

### Flow A — Health & Readiness

* Through gateway base URL (typically `http://localhost:3000`):

  * `GET /health` → 200

  * `GET /ready` → 200 only when core deps are ready

  * `GET /metrics` → returns metrics payload

* For each downstream service, hit at least one proxied route via gateway (reachability + no unhandled errors).

### Flow B — Authentication & Authorization (Match Current user-service)

* **B1 OTP register/login**

  * `POST /v1/auth/otp/request` (email or phone)

  * Capture OTP from user-service logs (dummy provider prints OTP in dev/test)

  * `POST /v1/auth/otp/verify` → expect `{ accessToken, refreshToken, user, isNewUser }`

* **B2 Refresh**

  * `POST /v1/auth/refresh` → new access token

* **B3 Protected access**

  * `GET /v1/users/me`:

    * no token → 401/403

    * valid token → 200

* **B4 Role gating (at least negative path)**

  * Call a `/v1/admin/...` gateway route with a normal user token → expect 403.

  * If an admin user is available (via seed/other bootstrap), also verify admin → 200.

  * If no admin exists locally and admin-positive coverage is required, implement a minimal, env-guarded “dev bootstrap admin” path.

### Flow C — Org Setup

* Create org via `POST /v1/orgs` (as authenticated user).

* Validate retrieval via `GET /v1/orgs` and `GET /v1/orgs/:id`.

* Team operations via `POST /v1/orgs/:orgId/team` and `GET /v1/orgs/:orgId/team`.

### Flow D — Property / Project Lifecycle

* Create listing via `POST /v1/properties` (and optionally `POST /v1/projects`).

* Update via `PATCH /v1/properties/:id`; confirm via `GET /v1/properties/:id`.

* Exercise lifecycle transitions using the documented property endpoints; verify each state change persists.

### Flow E — Media Handling (MinIO)

* Request upload via gateway: `POST /v1/media/presign`.

* Upload file to the returned presigned URL (direct-to-MinIO step).

* Finalize via gateway: `POST /v1/media/complete`.

* Confirm via `GET /v1/media/:id` and property attachment endpoints.

### Flow F — Search & Browse

* Confirm listing appears in `GET /v1/search/properties`.

* Validate filters/pagination/sorting.

* Validate map search via `GET /v1/search/map`.

### Flow G — Leads & Notifications

* Create lead via `POST /v1/leads`.

* Validate lead reads/updates via `GET /v1/leads` and `PATCH /v1/leads/:id`.

* Validate notifications via `GET /v1/notifications` and Mailhog UI for emails (if configured).

### Flow H — Billing & Payments (No-Internet Requirement)

* Discover packages via gateway (e.g., `GET /v1/packages`).

* Initiate payment via `POST /v1/billing/payments/initiate`.

* Current code attempts real Razorpay API calls; since the repo includes no local fake-payments service, plan is:

  * First attempt with local env; if it tries outbound Razorpay, implement an env-guarded Razorpay mock in billing-service (e.g., `RAZORPAY_MOCK=true`), so initiate + webhook completion can run offline.

  * Validate webhook processing via `POST /v1/webhooks/razorpay` (signature handled consistently in mock mode).

  * Confirm payment transitions and invoice generation.

### Flow I — Moderation & Admin

* Create review/report via `/v1/reviews` and `/v1/reports` (as a normal user).

* Verify admin endpoints are blocked for non-admins.

* If admin bootstrap is available, validate approve/reject flows via `/v1/admin/...` routes.

## Failure Handling & Minimal Fix Strategy

* When a flow fails, pinpoint whether it’s gateway routing, env/config, service logic, or event pipeline.

* Apply the smallest safe fix (prefer config/env defaults and defensive guards). Keep all local-only behavior behind explicit flags.

* Re-run the failed flow end-to-end via gateway after each fix.

## Deliverable / Report

* Provide a flow-by-flow matrix (A–I): PASSED/FAILED.

* For any failures: exact request, observed error, root cause, and the minimal guarded change (if applied).

* Confirm explicitly whether the stack is integration-ready for staging/QA.

