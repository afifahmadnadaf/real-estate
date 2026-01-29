## Go-Live Checklist — Real Estate Platform

This checklist is intended for **the final staging run** before promoting to production.

---

## 1. Infrastructure & Services

- **Core services up & healthy**
  - All services (`api-gateway`, `user-service`, `org-service`, `property-service`, `moderation-service`, `search-service`, `media-service`, `lead-service`, `billing-service`, `notification-service`, `geo-service`, `user-interactions-service`, `analytics-service`, `admin-service`) are running.
  - `/health` and `/ready` for each service return success.
- **Datastores**
  - MongoDB, PostgreSQL, Elasticsearch, Redis are reachable and report healthy.
  - Required DB migrations and indexes are applied.
- **Kafka**
  - Kafka brokers are up and topics created (see `docker/kafka-init/create-topics.sh`).
  - Consumers (`search-indexer`, `media-processor`, `notification-worker`, `property-service` billing consumer) are running with **low/zero lag**.

---

## 2. Kafka & Events

- **Kafka health**
  - Kafka `healthCheck` passes (or equivalent admin tooling shows cluster healthy).
  - `admin-service` system/dependencies endpoint correctly reports Kafka status (or documented workaround).
- **Event flows**
  - **Property events**: creating/updating/publishing a property emits `property.*` events; `search-indexer` updates ES accordingly.
  - **Media events**: media upload completion emits `media.upload.completed`; `media-processor` consumes and processes derivatives.
  - **Billing events**: payment/subscription flows emit `billing.*` events; `property-service` billing consumer updates property premium tiers.
  - **Notification events**: notification requests emit `notification.requested`; `notification-worker` consumes and sends via configured channels.

---

## 3. Webhooks

- **Payment gateways (Razorpay/Stripe)**
  - Webhook endpoints `/v1/webhooks/razorpay` and `/v1/webhooks/stripe` reachable from gateway IP(s).
  - Signature verification configured with correct secrets/keys.
  - Idempotency: same webhook event ID processed once (replays do not create duplicates).
  - End-to-end test:
    - Create test payment → webhook received → payment record updated → subscription created/updated → `billing.*` events emitted → property premium updated where applicable.
- **Partner leads**
  - `/v1/webhooks/partner/leads` reachable from partner/loader.
  - Auth/signature/token configured and validated.
  - Idempotency confirmed for repeated partner events.

---

## 4. End-to-End Functional Flows

Run these on staging with realistic data:

- **Auth & Users**
  - OTP login and password login both work.
  - Password reset flow completes successfully.
  - Session listing/revocation behave correctly.
- **Org & KYC**
  - Create org; submit KYC; admin approves/rejects; status updates visible on client.
- **Properties & Media**
  - Create property draft → upload media (`/v1/media/presign` + `/complete`) → attach to property.
  - Submit → approve via moderation → publish.
  - Property appears in `/v1/properties/{id}`, has expected media/docs.
- **Search**
  - Published property appears in `/v1/search/properties` and `/v1/search/map` with appropriate filters.
  - Autocomplete, filters, trending, and recent search endpoints work.
- **Leads**
  - From property detail UI, create lead → lead visible in `/v1/leads` for buyer and assigned agent/org.
  - Notes, assignments, status updates, appointments function as expected.
- **Billing & Premium**
  - Purchase package (subscription + payment) → subscription active.
  - Billing events emitted → property premium tier applied (boosted listings visible with expected ranking).
- **Notifications**
  - Trigger a few key email/SMS/push/WhatsApp flows (e.g., password reset, new lead, subscription activated).
  - Verify notifications appear in `/v1/notifications` and actual channels (sandbox) receive them.

---

## 5. Security & Access Control

- **Auth & roles**
  - JWT validation and expiry honoured across all services.
  - Gateway enforces:
    - User-only endpoints (`/v1/users/me/*`, `/v1/shortlists/*`, etc.).
    - Admin-only endpoints (`/v1/admin/*`) with `ADMIN`/`SUPER_ADMIN` roles.
  - Service-local admin checks (e.g., billing packages, notification templates) respect `X-User-Role` propagated from gateway.
- **Webhooks & internal APIs**
  - Webhooks reject invalid signatures and malformed payloads.
  - Internal APIs under `/internal/v1/*` are accessible only from trusted services (`internalAuth`).

---

## 6. Observability & Ops

- **Logging**
  - Logs include `traceId`/`X-Request-Id` from gateway for all services.
  - Sensitive data (PII, secrets) is not logged in plaintext.
- **Metrics & dashboards**
  - Basic dashboards in place for:
    - Request rate, latency, error rate per service.
    - Kafka consumer lag for each consumer group.
    - ES index health and query latency.
  - Alerts configured for:
    - High error rate or 5xx spikes.
    - Kafka consumer lag growing beyond threshold.
    - Search index lag (properties not indexed in expected time window).

---

## 7. Rate Limiting, Caching, and Idempotency

- **Rate limits**
  - Auth endpoints (`/v1/auth/*`) and webhooks have reasonable rate limits configured.
  - 429 responses include `Retry-After` header.
- **Caching**
  - Property detail and filter metadata caches work and invalidate correctly on property publish/update.
- **Idempotency**
  - `Idempotency-Key` (or equivalent) enforced for payment-related POSTs to prevent double-charges.

---

## 8. Rollout & Recovery

- **Deployment strategy**
  - Canary or blue/green deployment path defined for API gateway and services.
  - Database migrations are backward-compatible (rolling) for initial launch.
- **Rollback**
  - Clear rollback procedure documented (how to revert app versions and, if necessary, schema changes).
  - Recent backups verified and restore procedure tested for MongoDB and PostgreSQL.


