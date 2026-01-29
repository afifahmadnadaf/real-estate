# Local Setup - Real Estate Platform

## Prerequisites
- Node.js 20.x, pnpm 8.x
- Docker + Docker Compose
- Open ports: 3000-3012 (services), 5432, 27017, 6379, 9200, 9000/9001, 9092, 2181

## 1) Install dependencies
```bash
pnpm install
```

## 2) Environment
```bash
cp .env.example .env
# adjust DB/passwords/Kafka/MinIO keys as needed
```

## 3) Start infrastructure
```bash
docker-compose -f docker/docker-compose.yml up -d
docker-compose -f docker/docker-compose.services.yml up -d
```

## 4) Migrations & seed
```bash
pnpm run migrate
pnpm run seed   # optional sample data
```

## 5) Run services (dev)
```bash
pnpm run dev            # all services
# or individually, e.g.
pnpm run dev --filter=property-service
pnpm run dev --filter=user-interactions-service
```

## 6) Smoke checks
- `curl http://localhost:3000/health` (API Gateway)
- `curl http://localhost:3003/health` (Property Service)
- `curl http://localhost:3005/health` (Media Service)

## 7) Postman
- Import `collection.txt`
- Set `base_url=http://localhost:3000`, `access_token=<JWT>`

## 8) Useful URLs
- Kafka UI: http://localhost:8081
- Mongo Express: http://localhost:8082
- Redis Commander: http://localhost:8083
- pgAdmin: http://localhost:8084
- MinIO: http://localhost:9001
- Prometheus: http://localhost:9090
- Jaeger: http://localhost:16686

## 9) Logs
```bash
docker-compose -f docker/docker-compose.yml logs -f
pnpm run dev --filter=property-service --filter=media-service --filter=user-interactions-service
```

