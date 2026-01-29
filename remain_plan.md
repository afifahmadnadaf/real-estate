Goal: Implement missing payment and partner webhooks plus internal service APIs used across services so cross-service flows (payments, partner lead ingestion, indexing, cache invalidation, notifications, lead delivery, runtime config) work end-to-end.

Scope

Billing: add Stripe webhook + partner lead webhook handlers (signature verification, idempotency, events → internal events/kafka).
Internal APIs (internal-only, protected by internal auth/header):
Indexer upsert: /internal/v1/search/index (POST)
Cache invalidate: /internal/v1/cache/invalidate (POST)
Notifications send: /internal/v1/notifications/send (POST)
Leads deliver: /internal/v1/leads/deliver (POST)
Runtime config: /internal/v1/config (GET), /internal/v1/config (POST) for updates (admin)
Non-functional: security (internal token/mTLS), idempotency, retries, monitoring, schema/versioning.
API Contracts (minimal)

POST /v1/webhooks/stripe
Headers: Stripe-Signature
Body: raw JSON
Verify signature with STRIPE_WEBHOOK_SECRET
Validate event types (payment_intent.succeeded, charge.refunded, invoice.payment_failed)
Actions: reconcile payment, create/update subscription, publish kafka event billing.payment.*, create invoice record, notify user
Respond: 200 on success, 400/401 on failure
Idempotency: use event.id; store processed event ids
POST /v1/webhooks/partner/leads
Headers: X-Partner-Signature or token
Body: { partnerId, externalLeadId, payload }
Verify signature/token, validate payload, create lead record (or translate + forward), ack with { accepted: true, id }
On success: call /internal/v1/leads/deliver or publish topic lead.partner.received
POST /internal/v1/search/index
Body: { index: 'properties', id: string, doc: object, op: 'upsert'|'delete' }
Internal auth: X-Internal-Token
Action: enqueue or directly upsert into Elasticsearch (or forward to search-indexer)
Return: { accepted: true, taskId? }
POST /internal/v1/cache/invalidate
Body: { keys?: string[], patterns?: string[] }
Action: invalidate redis keys; return { invalidated: N }
POST /internal/v1/notifications/send
Body: { to: userId | contact, channel: 'EMAIL'|'SMS'|'PUSH', template: 'TEMPLATE_CODE', data: {} }
Action: validate, enqueue, return { enqueued: true, id }
POST /internal/v1/leads/deliver
Body: { leadId, partnerId, attempt: number, metadata }
Action: attempt delivery to partner CRM, record status, schedule retry on failure; return { delivered: true/false, attempt }
GET /internal/v1/config
Query: ?key=...
Return runtime config object (for feature flags/minor runtime toggles)
Security

Webhooks (public endpoints): verify provider signatures (Stripe/Razorpay) using secrets in env; require raw body parsing.
Partner webhooks: HMAC signature or bearer token per partner.
Internal endpoints: require X-Internal-Token (rotateable secret) or mTLS. Reject requests without valid token.
Audit: log webhook events and internal calls with trace id; store webhook delivery logs for replay.
Idempotency & Reliability

Store processed webhook event ids (unique provider event id) to avoid double-processing.
Use idempotency-key header or event id for partner webhooks.
On external delivery to partner CRMs, persist attempt metadata and use exponential backoff retry schedule (max attempts configurable).
Emit domain events to Kafka for downstream consumers rather than synchronous cross-service coupling where possible.
Data Flow Examples

Stripe webhook -> verify -> update payment record -> publish billing.payment.succeeded -> billing service enqueues invoice generation + notifies user + gateway updates subscription -> publish event consumed by analytics/search-indexer if needed.
Partner webhook lead -> verify -> create local lead -> call /internal/v1/leads/deliver -> if delivered publish lead.delivered else schedule retry + alert.
Implementation Phases & Tasks

Phase A — Design & Contracts (1-2 days)
Finalize event JSON schemas and Postman collection entries.
Define internal auth token rotation plan.
Phase B — Billing: Stripe webhook (2-3 days)
Add env STRIPE_WEBHOOK_SECRET, parse raw body, verify signature, idempotency storage, reconcile payment + subscription.
Tests: unit verify signature, integration with test Stripe events.
Phase C — Partner webhooks (2 days)
Add partner config (partner id → secret), add partner webhook route, validation + idempotency, mapping to internal lead model.
Phase D — Internal APIs scaffold (3-5 days)
Implement routes under /internal/v1/* in lightweight internal-router middleware that verifies X-Internal-Token.
Implement handlers for indexer upsert (publish to property.events topic), cache invalidation, notifications enqueue, leads deliver (with retry).
Add unit + integration tests (including token auth).
Phase E — Consumers & Workers (3-5 days)
Search-indexer worker: accept internal events or consume kafka topics produced by webhooks/internal APIs.
Notification worker: pick up notifications and send via channels.
Leads-delivery worker: handles retries and partner delivery.
Phase F — E2E Tests & Staging (2-3 days)
Simulate Stripe test events, partner lead delivery, verify events flow end-to-end (DB, Kafka, workers, notifications).
Phase G — Monitoring & Runbooks (1-2 days)
Add metrics (count webhook events, failures), alerting for repeated failures and retry exhaustion, add webhook replay admin tools.
Acceptance Criteria

Stripe webhook: test payment events result in subscription/invoice update and emitted kafka event.
Partner webhook: partner sends lead → local lead created → partner delivery attempted → status recorded.
Internal APIs: other services can call /internal/v1/* with valid token, responses conform to contract, and workers react to published events.
Idempotency: re-delivered same webhook event does not duplicate records.
Observability: webhook failures visible in logs/metrics; ability to replay webhook events from admin.
Operational Concerns

Secrets: add STRIPE_WEBHOOK_SECRET, PARTNER_{ID}_SECRET, INTERNAL_API_TOKEN into env/secret store.
Kafka topics: define/ensure topics for billing.payment., lead.partner., property.events.
Rate limiting & throttling on public webhook endpoints to mitigate flood.
Retention and replay: store raw webhook payloads for 30 days with replay admin endpoint (POST /v1/admin/webhooks/replay).
Estimations (boarding order priority)

Stripe webhook (billing-service): high priority — 2–3 dev days.
Internal API auth + basic endpoints (indexer, cache, notifications, leads deliver): high priority — 3–5 days.
Partner webhook + partner delivery worker: high priority — 2–3 days.
E2E tests + staging: 2–3 days.
Immediate Next Steps (I can start now)

A: Add STRIPE_WEBHOOK_SECRET to env.example and billing-service config.
B: Scaffold services/billing-service/src/routes/stripe.routes.js, controllers/stripe.controller.js, and service to verify signature and process events.
C: Add services/billing-service/src/routes/partner.routes.js for partner lead webhook.
D: Add services/common/internal-auth-middleware to verify X-Internal-Token.
E: Scaffold services/*/internal/* routes or a central internal-router and add tests.
If you want I can start with: (choose one)