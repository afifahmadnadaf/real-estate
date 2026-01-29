## What You Can (and Cannot) Prove Without Infra
- You **cannot** validate the true “full app flow” (DB writes, Kafka events, S3/MinIO uploads, search indexing, webhooks) without running services and dependencies.
- You **can** get **high confidence that starting services later won’t immediately break** by adding fast, deterministic unit tests that:
  - lock down pure business logic and validators
  - lock down auth/role behavior (401/403)
  - lock down API-gateway routing + admin dispatch + public/protected splits
  - statically ensure route contracts are discoverable and not shadowed

## Deliverable Structure (Clear Separation)
- **Unit tests**: pure utilities + pure service helpers + validators (no DB/network)
- **Auth tests**: middleware behavior with mocked JWT and mocked permission checks
- **Gateway tests**: routing/dispatch tests with mocked proxy handler (no HTTP forwarding)
- **Contract-safety tests**: static route discovery + gateway exposure checks (file traversal only)

## 1) Unit Tests (Pure Logic)
### Targets (high value, deterministic)
- Shared utilities in @real-estate/common:
  - Slug: [slug.js](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/packages/common/src/utils/slug.js)
  - Date: [date.js](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/packages/common/src/utils/date.js)
  - Phone: [phone.js](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/packages/common/src/utils/phone.js)
  - Pagination/cursors: [pagination.js](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/packages/common/src/utils/pagination.js)
  - Crypto primitives: [crypto.js](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/packages/common/src/utils/crypto.js) (mock randomness/time where needed)
- Service-local pure helpers:
  - Property project helpers: [project.service.js](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/services/property-service/src/services/project.service.js#L8-L25)
  - Search transformer: [search.service.js](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/services/search-service/src/services/search.service.js#L455-L486)
  - Media validations: [media.service.js](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/services/media-service/src/services/media.service.js#L27-L52)
- Validators (Joi schemas):
  - Example: [property.validator.js](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/services/property-service/src/validators/property.validator.js) and similar validators across services

### Assertions
- Slugs are stable, lowercase, hyphenated, max length respected, uniqueness logic behaves.
- Cursor encoding/decoding round-trips and rejects invalid inputs.
- Date helpers handle boundaries (past/future, start/end of day) consistently.
- Validators accept valid payloads and reject invalid payloads with expected error shapes.

## 2) Authentication & Authorization Tests (JWT mocked)
### Targets
- Shared middleware: [packages/common auth.js](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/packages/common/src/middleware/auth.js)
- Gateway middleware: [api-gateway auth.js](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/services/api-gateway/src/middleware/auth.js)

### Required test matrix
- Missing token → 401
- Invalid token → 401
- Valid token but insufficient role → 403
- Admin-only route rejects non-admin
- Optional auth does not fail request when token missing/invalid (sets `req.user = null`)

### Mocking rules
- Mock `jsonwebtoken.verify`/`sign` only.
- For gateway permission checks, mock `http.request`/`https.request` to simulate allow/deny/timeout/invalid JSON without network.

## 3) API Gateway Routing Tests (No proxying)
### Targets
- Route wiring and proxy wrapper: [services/api-gateway/src/routes/index.js](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/services/api-gateway/src/routes/index.js)

### Approach
- Build an Express app in-memory and mount the gateway router (no `listen()`).
- Mock `http-proxy-middleware`’s `createProxyMiddleware` to return a deterministic middleware that records:
  - selected `target`
  - chosen `pathRewrite`
  - whether expected headers would be set (via `onProxyReq`)
- Mock gateway `authMiddleware` / `optionalAuth` to simple stubs that:
  - set markers on `req` (e.g., `req._auth = 'required'`) and/or enforce 401/403 in tests

### Key routing risks to lock down
- Public vs protected splits:
  - `GET /v1/properties` public (optional auth)
  - `/v1/properties/*` protected (auth)
  - `GET /v1/media/:id` public (optional auth)
  - `/v1/media/*` protected (auth)
- Admin dispatch correctness:
  - `/v1/admin/search/*` routes to search-service with rewrite
  - `/v1/admin/geo/*` routes to geo-service with rewrite
  - `/v1/admin/media/*` routes to media-service with rewrite
  - `/v1/admin/users/*/roles` routes to admin-service
  - Unknown `/v1/admin/*` returns 404 JSON

## 4) Endpoint Contract Safety (Static Analysis Only)
### Targets
- Extraction/normalization helpers in [endpoint-audit.js](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/scripts/endpoint-audit.js)

### Tests
- Unit test `normalizePath`, `normalizeMethod`, path-joining behavior.
- Static “discoverability” test:
  - Traverse `services/*/src/routes/**/*.js` and assert every `router.<method>(...)` becomes discoverable by the extractor.
- Static “gateway exposure safety” test:
  - Parse gateway route definitions from [api-gateway routes/index.js](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/services/api-gateway/src/routes/index.js)
  - Assert that for each major public prefix, there is exactly one intended mapping (prevents accidental shadowing or missing mounts).

## Performance/Determinism Guarantees
- No DB, no Kafka, no Redis, no S3, no docker, no network.
- No servers started; supertest runs on in-memory Express.
- All randomness/time is mocked where needed.
- Suites should stay <1s by scoping static traversal to a small set of route directories and avoiding huge file reads.

## What I Will Do After You Confirm
1. Add the test files in the appropriate packages/services with clear folders:
   - unit (utils/validators)
   - auth
   - gateway
   - contract-safety
2. Add mocks for `jsonwebtoken`, `http-proxy-middleware`, `http/https`.
3. Ensure `pnpm -r test` (or targeted package tests) passes without any running infra.

If you confirm, I’ll implement these unit/auth/gateway/contract tests and keep them strictly in-memory with mocks only.