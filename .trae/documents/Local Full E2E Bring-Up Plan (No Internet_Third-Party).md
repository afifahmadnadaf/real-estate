## Current Repo Reality (What I Found)
- Infra compose already includes **MongoDB, Postgres, Redis (with password), Kafka+Zookeeper, Elasticsearch, MinIO, Mailhog, Kibana**: [docker-compose.yml](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/docker/docker-compose.yml).
- Services compose exists but has **hard mismatches** that will break E2E:
  - Postgres creds/DB mismatch (services use `postgres:postgres` + per-service DBs; infra uses `admin` + `real_estate`) [docker-compose.services.yml](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/docker/docker-compose.services.yml).
  - Mongo hostname mismatch (`mongodb` vs `mongo`).
  - Redis auth mismatch (infra requires password; services often only set `REDIS_HOST`).
  - MinIO creds mismatch (infra uses `S3_ACCESS_KEY/S3_SECRET_KEY`; services hardcode `minioadmin`).
- There is **no Nginx “CDN” proxy** in compose today.
- Local-only toggles already exist for some outbound calls:
  - Geo: `GEOCODING_PROVIDER=mock` avoids outbound [geo.service.js](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/services/geo-service/src/services/geo.service.js).
  - SMS/notifications can simulate/log locally.
  - Billing **payment initiation is hardwired to Razorpay SDK** (no local-only provider switch yet), so we must add a local fake provider to satisfy your payment E2E constraint.

## Target Local Architecture (Deterministic, No Internet)
- **Docker network only** for service-to-service calls.
- **Real infra in Docker**: Postgres, Mongo, Redis, Kafka, Elasticsearch, MinIO, Mailhog.
- **Local simulations**:
  - **Storage/CDN**: MinIO (S3) + **Nginx CDN proxy** in front of MinIO.
  - **SMS/Email**: Mailhog for SMTP + “dummy/simulated” SMS provider (logs only).
  - **Payments**: add a **fake payment provider** container + billing-service provider switch to avoid Razorpay network.
  - **Webhooks**: triggered via curl/scripts against gateway endpoints; validate idempotency via existing webhook event persistence.

## Repo Changes I Will Implement (After You Confirm)
### 1) Compose: make a single repeatable E2E stack
- Add a new compose file (e.g. `docker/docker-compose.e2e.yml`) that:
  - includes/extends infra + services
  - adds **nginx-cdn** in front of MinIO
  - adds **minio-init** job to create required buckets (`real-estate-media`, `real-estate-invoices`) deterministically
  - adds **migrate** job to run Prisma migrations once Postgres is healthy
  - optionally adds **wait-for-services** job/script

### 2) Fix existing compose mismatches (so services actually start)
- Make service env consistent with infra:
  - **Postgres**: move all services to a single `DATABASE_URL` (recommended) pointing at `real_estate` so migrations run once and schema is consistent across the monorepo.
  - **Mongo**: use `mongodb` hostname (or add a `mongo` alias).
  - **Redis**: pass `REDIS_PASSWORD` and/or `REDIS_URL=redis://:password@redis:6379` to every service that uses Redis.
  - **MinIO**: pass `S3_ACCESS_KEY/S3_SECRET_KEY` everywhere; also set billing’s `AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY` to the same values.

### 3) Payments: implement local fake payment provider (no Razorpay/Stripe internet)
- Add `PAYMENT_PROVIDER=local` (or similar) to billing-service.
- Implement a provider interface in billing-service so `payment.service.js` can use:
  - **local provider**: creates local orders, simulates success/failure, and triggers webhook callbacks locally
  - **razorpay provider**: existing behavior for real environments
- Add a small **fake-payments** service container (Express) that:
  - provides endpoints to create payment intent/order, mark success/failure
  - sends webhook callbacks to `api-gateway /v1/webhooks/razorpay` (or a new local-payments webhook) with deterministic signatures

### 4) Local-only outbound enforcement
- Set defaults in E2E compose:
  - `GEOCODING_PROVIDER=mock`
  - `SMS_PROVIDER=dummy`
  - leave WhatsApp/Twilio creds unset so it simulates
  - ensure `CRM_WEBHOOK_URL` is unset (lead delivery simulates)
- Add a small guardrail: when `LOCAL_ONLY=true`, block known outbound base URLs (optional; prevents accidental internet calls).

### 5) Wait-for-services + health verification
- Add `scripts/wait-for-services.js` (currently referenced by root scripts but missing) to poll:
  - Postgres ready
  - Redis ready (auth)
  - Kafka ready
  - Elasticsearch ready
  - MinIO ready
- Wire it into the compose “migrate” job and/or a `pnpm run docker:wait` flow.

## Bring-Up Instructions I Will Provide (After Implementation)
- **Start infra**: `docker compose -f docker/docker-compose.yml up -d`
- **Start E2E services**: `docker compose -f docker/docker-compose.yml -f docker/docker-compose.services.yml -f docker/docker-compose.e2e.yml up -d`
- **Migrations**: run automatically via `migrate` job (or a single explicit command if you prefer)
- **Verify health**:
  - Gateway: `GET http://localhost:3000/health` and `/ready`
  - Elasticsearch: `http://localhost:9200/_cluster/health`
  - MinIO console: `http://localhost:9001`
  - Mailhog UI: `http://localhost:8025`
- **Run E2E checks**:
  - Auth flow
  - Create property/project
  - Upload media and confirm returned `CDN_BASE_URL` is nginx-hosted
  - Search/browse
  - Lead + notification emission
  - Payment success/failure simulation + webhook callback + idempotency
  - Admin/moderation flows

## Assumptions (Explicit)
- Postgres is the Prisma DB (`schema.prisma` uses `provider = "postgresql"`) [schema.prisma](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/packages/db-models/src/postgres/prisma/schema.prisma).
- It’s acceptable to change billing-service to add a local payment provider path, since payment initiation otherwise requires real Razorpay network.

If you confirm, I will implement the compose additions/fixes (nginx CDN + init jobs + migration runner + wait script) and the local fake payment provider, then verify the entire stack comes up locally without any internet calls.