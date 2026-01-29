## Project Context
- Monorepo with pnpm workspaces: shared packages (common, db-models, events), microservices (gateway, billing, lead, property, search, media, moderation, notification, org, user, analytics), and workers (search-indexer, notification-worker, media-processor).
- Datastores and infra via Docker: Postgres, MongoDB, Redis, Kafka, Elasticsearch, MinIO, dev tools; see docker-compose infra [docker-compose.yml](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/docker/docker-compose.yml).
- API Gateway proxies public routes to services and exposes /v1/webhooks to billing; see [index.js](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/services/api-gateway/src/routes/index.js).
- Billing currently implements Razorpay webhook only; see [webhook.routes.js](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/services/billing-service/src/routes/webhook.routes.js) and [webhook.controller.js](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/services/billing-service/src/controllers/webhook.controller.js).
- Events are published to Kafka via @real-estate/events; see [types.js](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/packages/events/src/types.js) and [billing.schema.js](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/packages/events/src/schemas/billing.schema.js).

## Readiness Check
- Core services, schemas, routing, and workers exist; local dev can run with pnpm, DB migrations via Prisma; see root [package.json](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/package.json) and [env.example](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/env.example).
- Infra compose works; however root scripts reference compose files that are not present: docker-compose.services.yml, docker-compose.dev.yml; see [package.json scripts](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/package.json#L42-L49). This blocks docker:services/docker:up scripts.
- Webhook endpoints: only Razorpay implemented; Stripe and partner webhooks are missing. Internal /internal/v1/* endpoints are not present. Internal auth middleware is not present in common.
- Conclusion: Ready to start via pnpm dev with .env configured; blockers exist for docker orchestration and the remaining webhook/internal endpoints.

## Blockers
- Missing docker-compose files referenced by scripts: add docker/docker-compose.services.yml and docker/docker-compose.dev.yml or adjust scripts.
- No Stripe webhook support; env has Razorpay keys only.
- No partner lead webhook; no leads-delivery worker.
- No /internal/v1/* endpoints and no internal auth token middleware.

## Remain Plan Gaps
- Payment provider alignment: plan mentions Stripe; code and env use Razorpay. Decide to support Razorpay first and add Stripe optional.
- Webhook idempotency store and replay logs: add a table for processed event IDs and raw payload storage (e.g., postgres table webhook_events with provider, event_id, signature, raw_body, processed_at). Not present in schema.
- Internal auth: add INTERNAL_API_TOKEN in env and common middleware to validate X-Internal-Token.
- Rate limiting on public webhook endpoints via gateway or billing; add per-IP throttles.
- Monitoring: add Prometheus counters and error metrics for webhook/internal endpoints; current metrics middleware is placeholder; wire real metrics.
- Tests: unit for signature verification, controller flows; integration using Razorpay test payloads; token auth tests for internal router.
- Admin replay endpoint: implement /v1/admin/webhooks/replay and backing storage.

## Patch Starting Points
- Billing: extend /v1/webhooks to include /stripe and ensure express.raw for signature verification. Keep existing Razorpay flow.
- Partner Webhooks: add /v1/webhooks/partner/leads in billing or lead-service (prefer lead-service), verify HMAC or bearer per partner, persist lead, publish event, trigger delivery.
- Internal APIs: add an internal-router in each service or a shared router that mounts:
  - POST /internal/v1/search/index in search-service
  - POST /internal/v1/cache/invalidate in gateway or a cache-service (if Redis centralized, implement in a small internal service)
  - POST /internal/v1/notifications/send in notification-service
  - POST /internal/v1/leads/deliver in lead-service
  - GET/POST /internal/v1/config in admin-service
- Internal Auth: add @real-estate/common middleware validating X-Internal-Token; reject if missing/invalid.

## Implementation Plan
### 1) Docker Scripts Fix
- Create docker-compose.services.yml for building/running service containers; create docker-compose.dev.yml for dev overrides. Update scripts or docs accordingly.

### 2) Internal Auth Middleware
- Add packages/common/src/middleware/internal-auth.js to validate X-Internal-Token against INTERNAL_API_TOKEN; export helper to mount easily.

### 3) Webhook Idempotency & Replay
- Extend Prisma schema with webhook_events table for dedup and storage; add DAO and service in billing-service.
- On webhook handling, check event.id; skip if seen; store raw payload and status.
- Implement /v1/admin/webhooks/logs and /v1/admin/webhooks/replay in billing-service.

### 4) Stripe Webhook
- Add /v1/webhooks/stripe route using express.raw; verify with STRIPE_WEBHOOK_SECRET; handle events: payment_intent.succeeded, charge.refunded, invoice.payment_failed; map into existing payment/subscription flows and publish events.
- Add STRIPE_* envs to env.example.

### 5) Partner Lead Webhook & Delivery
- Add /v1/webhooks/partner/leads in lead-service; verify signature/token per partner; persist lead (source=PARTNER), return {accepted,id}; publish lead.partner.received; call /internal/v1/leads/deliver.
- Implement leads-delivery worker to handle retries and success/failure publish.

### 6) Internal APIs
- search-service: POST /internal/v1/search/index → upsert/delete in ES via worker; return {accepted,taskId}.
- notification-service: POST /internal/v1/notifications/send → enqueue notification; return {enqueued,id}.
- lead-service: POST /internal/v1/leads/deliver → attempt partner CRM delivery; persist attempt; retry schedule.
- gateway or a small internal-cache service: POST /internal/v1/cache/invalidate → Redis key/pattern invalidation.
- admin-service: GET/POST /internal/v1/config → runtime config fetch/update.
- Protect all with internal-auth; audit via common audit middleware.

### 7) Monitoring & Tests
- Add Prometheus metrics for webhook counts, failures, latencies; Jaeger spans around handlers.
- Unit tests: signature verification (Razorpay+Stripe); controller idempotency; internal-auth middleware.
- Integration tests: simulate webhook payloads; call internal APIs with valid/invalid token.

## Updated remain_plan.md — Proposed Edits
- Replace "Stripe webhook" section to "Payments webhooks (Razorpay existing, add Stripe)"; keep actions and idempotency using event.id.
- Add "Webhook Events Storage" with schema outline and replay endpoints.
- Add "Internal Auth" section with X-Internal-Token and INTERNAL_API_TOKEN env.
- Add "Internal APIs Implementation" section mapping each service to its internal route.
- Add "Docker Scripts" note to add missing compose files or update scripts.
- Add explicit "Tests & Monitoring" section with metrics and test coverage goals.

## Next Actions
- If approved, I will:
  1) Add env vars and internal-auth middleware in common.
  2) Implement Stripe webhook in billing-service alongside Razorpay.
  3) Add partner leads webhook in lead-service and stub leads-delivery worker.
  4) Scaffold /internal/v1/* routes in respective services with token protection.
  5) Add webhook_events storage and admin replay endpoints.
  6) Provide initial unit/integration tests and metrics wiring.