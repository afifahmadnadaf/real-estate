# Deployment Guide - Real Estate Platform

## Environments
- Staging: Kubernetes single node
- Production: Kubernetes multi-node

## Artifacts
- Docker images per service: `registry.example.com/real-estate/<service>:<tag>`
- Required: api-gateway, user-service, org-service, property-service, search-service, media-service, lead-service, moderation-service, billing-service, notification-service, geo-service, analytics-service, user-interactions-service, workers (media-processor, search-indexer, notification-worker)

## Build & Push
```bash
pnpm install
pnpm run lint
pnpm run test
docker build -t registry.example.com/real-estate/property-service:$(git rev-parse --short HEAD) services/property-service
# repeat per service/worker
docker push registry.example.com/real-estate/property-service:$(git rev-parse --short HEAD)
```

## Kubernetes (Helm outline)
- Deploy shared dependencies: Postgres, Mongo, Redis, Kafka, Elasticsearch, MinIO, ClickHouse, Jaeger, Prometheus, Grafana, Nginx/Traefik.
- Values to set per chart:
  - `image.repository`, `image.tag`
  - `envFrom`: secrets/configmaps for DB URLs, Kafka brokers, S3 credentials, JWT secrets
  - `resources`: requests/limits per service
  - `hpa`: cpu/memory targets
  - `service`: ClusterIP, ports per service
  - `ingress`: TLS, hostnames, path-based routing via API Gateway

## Secrets (examples)
- `DATABASE_URL` (Postgres), `MONGO_URI`, `REDIS_URL`
- `KAFKA_BROKERS`
- `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`
- `JWT_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- `SMTP_HOST/PORT/USER/PASSWORD`, `SMS_API_KEY`

## Migrations & seeding
```bash
pnpm run migrate
pnpm run seed     # optional staging only
```

## Rollout
```bash
kubectl apply -f k8s/namespace.yaml
helm upgrade --install api-gateway charts/api-gateway -n real-estate
# repeat per service/worker
```

## Health & readiness
- `/health` and `/ready` implemented on every service.
- API Gateway exposes `/metrics`; enable Prometheus scrape.

## Observability
- Logging: JSON (Pino) shipped to ELK/CloudWatch.
- Tracing: OpenTelemetry -> Jaeger.
- Metrics: Prometheus scrape; Grafana dashboards (HTTP latency, Kafka lag, DB latency).

## Zero-downtime checklist
- Readiness/liveness probes set.
- RollingUpdate with surge/unavailable tuned.
- Run migrations before traffic shift.
- Feature flags off-by-default for risky changes.

