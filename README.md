# 🏠 Real Estate Platform

A production-grade real estate marketplace platform similar to Housing.com / 99acres, built with Node.js microservices architecture.

## 🚀 Features

- **Multi-tenant marketplace** for Rent + Buy properties
- **User types**: Individual Owners, Agents, and Builders
- **Premium listing monetization** with Featured, Spotlight, and Premium tiers
- **Admin moderation workflow** for quality control
- **Lead management pipeline** for inquiries
- **Full-text search** with Elasticsearch
- **Media processing** with image optimization
- **Event-driven architecture** with Kafka

## 📋 Prerequisites

- Node.js 20.x LTS
- pnpm 8.x
- Docker & Docker Compose
- Git

## 🛠️ Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20.x |
| Language | JavaScript (ES2022+) |
| Framework | Express.js 4.x |
| Validation | Zod / Joi |
| ORM (SQL) | Prisma 5.x |
| ODM (NoSQL) | Mongoose 8.x |
| Document DB | MongoDB 7.0 |
| Relational DB | PostgreSQL 16 |
| Search Engine | Elasticsearch 8.x |
| Cache | Redis 7.x |
| Message Queue | Kafka 3.x |
| Object Storage | MinIO (dev) / S3 (prod) |

## 🏗️ Project Structure

```
real-estate-platform/
├── docker/                 # Docker configurations
├── packages/               # Shared packages
│   ├── common/            # Shared utilities
│   ├── events/            # Kafka event schemas
│   ├── db-models/         # Database models
│   └── api-client/        # Internal API clients
├── services/              # Microservices
│   ├── api-gateway/       # API Gateway (port 3000)
│   ├── user-service/      # User auth & profile (port 3001)
│   ├── org-service/       # Organizations (port 3002)
│   ├── property-service/  # Properties (port 3003)
│   ├── search-service/    # Search (port 3004)
│   ├── media-service/     # Media handling (port 3005)
│   ├── lead-service/      # Leads/inquiries (port 3006)
│   ├── moderation-service/# Moderation (port 3007)
│   ├── billing-service/   # Billing (port 3008)
│   ├── notification-service/ # Notifications (port 3009)
│   ├── geo-service/       # Geo/location (port 3010)
│   └── analytics-service/ # Analytics (port 3011)
├── workers/               # Background workers
│   ├── search-indexer/
│   ├── media-processor/
│   ├── notification-worker/
│   └── scheduler/
├── scripts/               # Setup & utility scripts
└── docs/                  # Documentation
```

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repo-url>
cd real-estate-platform
pnpm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Infrastructure

```bash
# Start all infrastructure services (MongoDB, PostgreSQL, Redis, Kafka, etc.)
pnpm run docker:infra

# Wait for services to be ready
pnpm run docker:wait
```

### 4. Database Setup

```bash
# Generate Prisma client
pnpm run prisma:generate

# Run migrations
pnpm run migrate:dev

# Seed initial data
pnpm run seed
```

### 5. Start Development

```bash
# Start all services in development mode
pnpm run dev

# Or start specific services
pnpm run dev:gateway
pnpm run dev:user
```

## 📝 Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm run dev` | Start all services in dev mode |
| `pnpm run start` | Start all services in production mode |
| `pnpm run test` | Run all tests |
| `pnpm run lint` | Lint all code |
| `pnpm run docker:infra` | Start infrastructure containers |
| `pnpm run docker:down` | Stop all containers |
| `pnpm run migrate` | Run database migrations |
| `pnpm run seed` | Seed development data |

## 🔗 Service URLs

| Service | URL |
|---------|-----|
| API Gateway | http://localhost:3000 |
| User Service | http://localhost:3001 |
| Org Service | http://localhost:3002 |
| Property Service | http://localhost:3003 |
| Search Service | http://localhost:3004 |
| Media Service | http://localhost:3005 |

## 🛠️ Development Tools

| Tool | URL |
|------|-----|
| Kafka UI | http://localhost:8081 |
| Mongo Express | http://localhost:8082 |
| Redis Commander | http://localhost:8083 |
| pgAdmin | http://localhost:8084 |
| MinIO Console | http://localhost:9001 |
| Mailhog | http://localhost:8025 |

## 📖 API Documentation

API documentation is available at `/v1/docs` when running the API Gateway.

See [PROJECT_PLAN.md](./PROJECT_PLAN.md) for detailed API endpoints documentation.

## 🧪 Testing

```bash
# Run all tests
pnpm run test

# Run unit tests only
pnpm run test:unit

# Run integration tests
pnpm run test:integration

# Run with coverage
pnpm run test:coverage
```

## 📄 License

This project is proprietary and confidential.

## 📞 Support

For support, please contact the development team.

