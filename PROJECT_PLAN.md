# 🏠 Real Estate Platform - Complete Project Plan

**Version:** 1.0.0  
**Created:** January 15, 2026  
**Status:** ✅ Complete (All Phases Implemented)  
**Target:** Production-Grade Real Estate Marketplace (Housing.com / 99acres-like)

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Infrastructure Services](#4-infrastructure-services)
5. [Microservices Breakdown](#5-microservices-breakdown)
6. [Database Schemas](#6-database-schemas)
7. [API Endpoints by Service](#7-api-endpoints-by-service)
8. [Event System (Kafka Topics)](#8-event-system-kafka-topics)
9. [Background Workers](#9-background-workers)
10. [Shared Packages](#10-shared-packages)
11. [Environment Configuration](#11-environment-configuration)
12. [Development Workflow](#12-development-workflow)
13. [Deployment Strategy](#13-deployment-strategy)
14. [Testing Strategy](#14-testing-strategy)
15. [Monitoring & Observability](#15-monitoring--observability)
16. [Security Implementation](#16-security-implementation)
17. [Phase-wise Implementation Status](#17-phase-wise-implementation-status)
18. [File Generation Checklist](#18-file-generation-checklist)

---

## 1. Project Overview

### 1.1 Business Goals
- Multi-tenant real estate marketplace for Rent + Buy
- Support for Individual Owners, Agents, and Builders
- Premium listing monetization (Featured, Spotlight, Premium tiers)
- Admin moderation workflow
- Lead management pipeline

### 1.2 Technical Goals
- Handle 10M+ listings
- Search latency < 200ms (p95)
- 99.9% availability
- Horizontal scalability
- Event-driven architecture

### 1.3 Scope
**In Scope (Phase 1):**
- User authentication (OTP/Email)
- Organization management (Agents/Builders)
- Property listings lifecycle
- Search with filters & map view
- Media upload & processing
- Lead/inquiry management
- Basic premium/billing
- Admin moderation

**Out of Scope (Phase 2):**
- AI personalization
- Mortgage/loan marketplace
- Chat system
- Deep scheduling

---

## 2. Technology Stack

### 2.1 Backend
| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Node.js | 20.x LTS |
| Language | JavaScript (ES2022+) | ES2022 |
| Framework | Express.js | 4.x |
| Validation | Zod / Joi | 3.x / 17.x |
| ORM (SQL) | Prisma | 5.x |
| ODM (NoSQL) | Mongoose | 8.x |

### 2.2 Databases
| Type | Technology | Purpose |
|------|------------|---------|
| Document DB | MongoDB 7.0 | Properties, Media |
| Relational DB | PostgreSQL 16 | Users, Orgs, Billing |
| Search Engine | Elasticsearch 8.x | Property search |
| Cache | Redis 7.x | Sessions, Rate limiting |
| Message Queue | Kafka 3.x | Event streaming |
| Object Storage | MinIO (dev) / S3 (prod) | Media files |

### 2.3 Infrastructure
| Component | Technology |
|-----------|------------|
| Container Runtime | Docker |
| Orchestration (dev) | Docker Compose |
| Orchestration (prod) | Kubernetes |
| API Gateway | Traefik / Kong |
| Load Balancer | Nginx |

### 2.4 DevOps & Monitoring
| Component | Technology |
|-----------|------------|
| CI/CD | GitHub Actions |
| Logging | Pino + ELK Stack |
| Metrics | Prometheus + Grafana |
| Tracing | Jaeger / OpenTelemetry |
| Alerting | Alertmanager |

---

## 3. Project Structure

```
real-estate-platform/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── cd-staging.yml
│       └── cd-production.yml
├── docker/
│   ├── docker-compose.yml              # Base infrastructure
│   ├── docker-compose.services.yml     # Microservices
│   ├── docker-compose.dev.yml          # Dev overrides
│   ├── docker-compose.test.yml         # Test environment
│   └── nginx/
│       └── nginx.conf
├── packages/
│   ├── common/                         # Shared utilities
│   ├── events/                         # Kafka schemas
│   ├── db-models/                      # Shared DB models
│   └── api-client/                     # Internal API clients
├── services/
│   ├── api-gateway/
│   ├── user-service/
│   ├── org-service/
│   ├── property-service/
│   ├── search-service/
│   ├── media-service/
│   ├── lead-service/
│   ├── moderation-service/
│   ├── billing-service/
│   ├── notification-service/
│   ├── geo-service/
│   └── analytics-service/
├── workers/
│   ├── search-indexer/
│   ├── media-processor/
│   ├── notification-worker/
│   └── scheduler/
├── scripts/
│   ├── setup.sh
│   ├── seed-data.js
│   ├── migrate.sh
│   └── generate-keys.sh
├── docs/
│   ├── api/
│   ├── architecture/
│   └── runbooks/
├── .env.example
├── package.json                        # Root package.json (workspaces)
├── pnpm-workspace.yaml
├── jsconfig.json                       # JavaScript config (for IDE support)
├── PROJECT_PLAN.md
└── README.md
```

---

## 4. Infrastructure Services

### 4.1 Docker Compose Services Status

| Service | Image | Port(s) | Status |
|---------|-------|---------|--------|
| MongoDB | mongo:7.0 | 27017 | ⬜ Pending |
| PostgreSQL | postgres:16-alpine | 5432 | ⬜ Pending |
| Redis | redis:7-alpine | 6379 | ⬜ Pending |
| Zookeeper | confluentinc/cp-zookeeper:7.5.0 | 2181 | ⬜ Pending |
| Kafka | confluentinc/cp-kafka:7.5.0 | 9092 | ⬜ Pending |
| Elasticsearch | elasticsearch:8.11.0 | 9200 | ⬜ Pending |
| MinIO | minio/minio | 9000, 9001 | ⬜ Pending |
| Traefik | traefik:v2.10 | 80, 443, 8080 | ⬜ Pending |

### 4.2 Development Tools

| Tool | Image | Port | Purpose | Status |
|------|-------|------|---------|--------|
| Kafka UI | provectuslabs/kafka-ui | 8081 | Kafka management | ⬜ Pending |
| Mongo Express | mongo-express | 8082 | MongoDB GUI | ⬜ Pending |
| Kibana | kibana:8.11.0 | 5601 | ES visualization | ⬜ Pending |
| Redis Commander | rediscommander/redis-commander | 8083 | Redis GUI | ⬜ Pending |
| pgAdmin | dpage/pgadmin4 | 8084 | PostgreSQL GUI | ⬜ Pending |
| Mailhog | mailhog/mailhog | 8025, 1025 | Email testing | ⬜ Pending |

---

## 5. Microservices Breakdown

### 5.1 API Gateway
**Port:** 3000  
**Responsibilities:**
- Request routing
- Authentication verification
- Rate limiting
- Request/Response logging
- CORS handling

**Status:** ⬜ Pending

---

### 5.2 User Service
**Port:** 3001  
**Database:** PostgreSQL  
**Responsibilities:**
- User registration/login (OTP, Email, Password)
- Session management
- Profile management
- Preferences & consents
- MFA (optional)

**Status:** ⬜ Pending

---

### 5.3 Organization Service
**Port:** 3002  
**Database:** PostgreSQL  
**Responsibilities:**
- Agent/Builder organization management
- KYC document handling
- Member management
- Verification workflow

**Status:** ⬜ Pending

---

### 5.4 Property Service
**Port:** 3003  
**Database:** MongoDB  
**Responsibilities:**
- Property CRUD operations
- Listing lifecycle management
- Version history
- Media attachment
- Metrics tracking

**Status:** ✅ Complete

---

### 5.5 Search Service
**Port:** 3004  
**Database:** Elasticsearch  
**Responsibilities:**
- Full-text search
- Geo/map search
- Filters & facets
- Autocomplete
- Search ranking

**Status:** ✅ Complete

---

### 5.6 Media Service
**Port:** 3005  
**Storage:** MinIO/S3  
**Responsibilities:**
- Presigned URL generation
- Upload management
- Media metadata
- CDN URL generation

**Status:** ✅ Complete

---

### 5.7 Lead Service
**Port:** 3006  
**Database:** PostgreSQL  
**Responsibilities:**
- Lead/inquiry creation
- Lead assignment
- Lead pipeline management
- Appointment scheduling

**Status:** ✅ Complete

---

### 5.8 Moderation Service
**Port:** 3007  
**Database:** PostgreSQL + Redis  
**Responsibilities:**
- Auto-moderation rules
- Manual review queue
- Fraud detection signals
- Blacklist management

**Status:** ✅ Complete

---

### 5.9 Admin Service
**Port:** 3012  
**Database:** PostgreSQL (admin roles/assignments)  
**Responsibilities:**
- Role & permission management (RBAC)
- Admin moderation endpoints (reports/reviews routing)
- Audit logs and admin system endpoints
- Internal permission checks for gateway/service-to-service calls

**Status:** ✅ Complete (RBAC endpoints implemented; internal permission-check endpoint added)

---

### 5.9 Billing Service
**Port:** 3008  
**Database:** PostgreSQL  
**Responsibilities:**
- Package management
- Subscription handling
- Payment processing (Razorpay)
- Invoice generation
- Refunds

**Status:** ✅ Complete

---

### 5.10 Notification Service
**Port:** 3009  
**Database:** PostgreSQL + Redis  
**Responsibilities:**
- Multi-channel notifications (SMS, Email, Push, WhatsApp)
- Template management
- Delivery tracking
- User preferences

**Status:** ✅ Complete

---

### 5.11 Geo Service
**Port:** 3010  
**Database:** PostgreSQL + Redis  
**Responsibilities:**
- Location hierarchy (Country > State > City > Locality)
- Geocoding/reverse geocoding
- POI management
- Boundary polygons

**Status:** ✅ Complete

---

### 5.12 Analytics Service
**Port:** 3011  
**Database:** ClickHouse/TimescaleDB  
**Responsibilities:**
- Event ingestion
- KPI calculation
- Funnel analysis
- Attribution

**Status:** ✅ Complete

---

## 6. Database Schemas

### 6.1 PostgreSQL Schemas

#### 6.1.1 Users Schema
```sql
-- Status: ⬜ Pending

-- Enums
CREATE TYPE user_role AS ENUM ('USER', 'AGENT', 'BUILDER', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED', 'PENDING_VERIFICATION', 'DELETED');

-- Tables
TABLE users (
  id, phone, email, password_hash, name, avatar_url,
  role, status, email_verified, phone_verified,
  metadata, created_at, updated_at
)

TABLE sessions (
  id, user_id, refresh_token_hash, device_info,
  ip_address, user_agent, expires_at, created_at, last_used_at
)

TABLE user_preferences (
  id, user_id, notification_settings, search_preferences,
  display_preferences, created_at, updated_at
)

TABLE user_consents (
  id, user_id, consent_type, granted, granted_at, revoked_at
)

TABLE otp_requests (
  id, identifier, identifier_type, otp_hash, purpose,
  attempts, expires_at, created_at
)
```

#### 6.1.2 Organizations Schema
```sql
-- Status: ⬜ Pending

-- Enums
CREATE TYPE org_type AS ENUM ('AGENT_FIRM', 'BUILDER', 'INDIVIDUAL_AGENT');
CREATE TYPE org_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED');
CREATE TYPE kyc_status AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');
CREATE TYPE member_role AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER');

-- Tables
TABLE organizations (
  id, name, slug, type, status, logo_url, cover_url,
  description, website, contact_email, contact_phone,
  address, rera_numbers, gst_number, pan_number,
  established_year, employee_count, metadata,
  created_by, created_at, updated_at
)

TABLE org_members (
  id, org_id, user_id, role, status, title,
  permissions, invited_by, invited_at, joined_at
)

TABLE kyc_documents (
  id, org_id, document_type, document_number,
  document_url, status, submitted_by, submitted_at,
  reviewer_id, review_notes, reviewed_at
)

TABLE org_invites (
  id, org_id, email, role, token, expires_at,
  invited_by, created_at, accepted_at
)
```

#### 6.1.3 Leads Schema
```sql
-- Status: ⬜ Pending

-- Enums
CREATE TYPE lead_status AS ENUM (
  'NEW', 'CONTACTED', 'INTERESTED', 'SITE_VISIT_SCHEDULED',
  'SITE_VISIT_DONE', 'NEGOTIATING', 'CONVERTED', 'LOST', 'SPAM'
);
CREATE TYPE lead_source AS ENUM (
  'PROPERTY_PAGE', 'SEARCH', 'SHORTLIST', 'CONTACT_FORM',
  'PHONE', 'WHATSAPP', 'CHAT', 'PARTNER'
);

-- Tables
TABLE leads (
  id, property_id, project_id, buyer_id, seller_id, org_id,
  assigned_to, status, source, message, contact_preference,
  buyer_name, buyer_phone, buyer_email, budget_min, budget_max,
  preferred_localities, metadata, spam_score,
  created_at, updated_at, contacted_at, converted_at
)

TABLE lead_notes (
  id, lead_id, author_id, content, is_internal, created_at
)

TABLE lead_activities (
  id, lead_id, actor_id, activity_type, details, created_at
)

TABLE appointments (
  id, lead_id, property_id, scheduled_at, duration_minutes,
  location, notes, status, reminder_sent, created_by, created_at
)
```

#### 6.1.4 Billing Schema
```sql
-- Status: ⬜ Pending

-- Enums
CREATE TYPE package_type AS ENUM ('LISTING_BOOST', 'SUBSCRIPTION', 'CREDITS');
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED', 'PAST_DUE');
CREATE TYPE payment_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- Tables
TABLE packages (
  id, name, slug, type, description, features,
  price, currency, duration_days, listing_limit,
  boost_tier, is_active, sort_order, metadata,
  created_at, updated_at
)

TABLE subscriptions (
  id, user_id, org_id, package_id, status,
  starts_at, ends_at, auto_renew, cancelled_at,
  cancellation_reason, metadata, created_at, updated_at
)

TABLE payments (
  id, user_id, org_id, subscription_id, amount, currency,
  status, gateway, gateway_order_id, gateway_payment_id,
  gateway_signature, failure_reason, metadata,
  idempotency_key, created_at, completed_at
)

TABLE invoices (
  id, payment_id, user_id, org_id, invoice_number,
  amount, tax_amount, total_amount, currency,
  billing_address, pdf_url, created_at
)

TABLE coupons (
  id, code, description, discount_type, discount_value,
  max_uses, used_count, min_amount, max_discount,
  valid_from, valid_until, applicable_packages,
  is_active, created_at
)

TABLE coupon_usages (
  id, coupon_id, user_id, payment_id, discount_amount, used_at
)

TABLE refunds (
  id, payment_id, amount, reason, status,
  gateway_refund_id, processed_at, created_at
)
```

#### 6.1.5 Notifications Schema
```sql
-- Status: ⬜ Pending

-- Tables
TABLE notifications (
  id, user_id, type, category, title, body, data,
  read, read_at, action_url, created_at
)

TABLE notification_templates (
  id, code, name, category, channels, subject,
  sms_body, email_subject, email_body, push_title,
  push_body, whatsapp_template_id, variables,
  is_active, created_at, updated_at
)

TABLE push_tokens (
  id, user_id, token, platform, device_id,
  is_active, created_at, last_used_at
)

TABLE notification_logs (
  id, notification_id, user_id, channel, template_id,
  recipient, status, provider_response, error,
  sent_at, delivered_at
)
```

#### 6.1.6 Geo Schema
```sql
-- Status: ⬜ Pending

-- Tables
TABLE countries (
  id, name, code, phone_code, currency, is_active
)

TABLE states (
  id, country_id, name, code, is_active
)

TABLE cities (
  id, state_id, name, slug, tier, latitude, longitude,
  timezone, is_active, is_featured, metadata
)

TABLE localities (
  id, city_id, name, slug, pincode, latitude, longitude,
  polygon, is_active, is_featured, avg_price_sqft, metadata
)

TABLE pois (
  id, locality_id, name, type, category,
  latitude, longitude, address, metadata
)
```

#### 6.1.7 Admin Schema
```sql
-- Status: ⬜ Pending

-- Tables
TABLE admin_roles (
  id, name, slug, description, permissions, is_system, created_at
)

TABLE admin_role_assignments (
  id, user_id, role_id, assigned_by, assigned_at, revoked_at
)

TABLE audit_logs (
  id, actor_id, actor_type, action, resource_type, resource_id,
  changes, ip_address, user_agent, trace_id, created_at
)

TABLE moderation_tasks (
  id, entity_type, entity_id, task_type, status, priority,
  auto_score, claimed_by, claimed_at, reviewed_by,
  review_decision, review_notes, reviewed_at, created_at
)

TABLE moderation_rules (
  id, name, description, entity_type, conditions, actions,
  priority, is_active, created_by, created_at
)

TABLE blacklist_entries (
  id, entry_type, value, reason, severity,
  expires_at, created_by, created_at
)

TABLE reports (
  id, reporter_id, entity_type, entity_id, reason,
  description, evidence_urls, status, resolution,
  resolved_by, resolved_at, created_at
)
```

### 6.2 MongoDB Schemas

#### 6.2.1 Properties Collection
```javascript
// Status: ⬜ Pending

// Collection: properties
{
  _id: ObjectId,
  type: "RENT" | "RESALE" | "PROJECT" | "PROJECT_UNIT",
  status: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "PUBLISHED" | "REJECTED" | "EXPIRED" | "ARCHIVED",
  
  owner: {
    userId: String,
    orgId: String,
    type: "INDIVIDUAL" | "AGENT" | "BUILDER"
  },
  
  title: String,
  slug: String,
  description: String,
  
  pricing: {
    amount: Number,
    currency: String,
    priceType: "FIXED" | "NEGOTIABLE" | "ON_REQUEST",
    pricePerSqft: Number,
    maintenanceCharges: Number,
    maintenanceFrequency: "MONTHLY" | "QUARTERLY" | "YEARLY",
    securityDeposit: Number,
    depositMonths: Number,
    brokerage: Number,
    negotiable: Boolean
  },
  
  attributes: {
    propertyType: String,
    subType: String,
    bedrooms: Number,
    bathrooms: Number,
    balconies: Number,
    floorNumber: Number,
    totalFloors: Number,
    carpetArea: Number,
    builtUpArea: Number,
    superBuiltUpArea: Number,
    plotArea: Number,
    areaUnit: "SQFT" | "SQMT" | "SQYD" | "ACRE" | "HECTARE",
    facing: String,
    ageOfProperty: Number,
    possessionStatus: "READY" | "UNDER_CONSTRUCTION",
    possessionDate: Date,
    furnishing: "UNFURNISHED" | "SEMI_FURNISHED" | "FULLY_FURNISHED",
    flooring: String,
    parking: { covered: Number, open: Number },
    waterSupply: String,
    powerBackup: String,
    amenities: [String],
    features: [String],
    nearbyPlaces: [{ type: String, name: String, distance: Number }]
  },
  
  location: {
    address: String,
    landmark: String,
    locality: String,
    localityId: String,
    city: String,
    cityId: String,
    state: String,
    stateId: String,
    country: String,
    pincode: String,
    geo: {
      type: "Point",
      coordinates: [Number, Number] // [lng, lat]
    }
  },
  
  media: {
    images: [{
      mediaId: String,
      url: String,
      thumbnailUrl: String,
      webpUrl: String,
      alt: String,
      order: Number,
      isPrimary: Boolean,
      tags: [String]
    }],
    videos: [{
      mediaId: String,
      url: String,
      thumbnailUrl: String,
      duration: Number
    }],
    floorPlans: [{
      mediaId: String,
      url: String,
      label: String
    }],
    documents: [{
      mediaId: String,
      url: String,
      type: String,
      name: String
    }],
    virtualTour: String,
    brochureUrl: String
  },
  
  premium: {
    tier: "NONE" | "FEATURED" | "PREMIUM" | "SPOTLIGHT",
    activeUntil: Date,
    boostCount: Number,
    lastBoostedAt: Date,
    subscriptionId: String
  },
  
  moderation: {
    autoScore: Number,
    qualityScore: Number,
    manualReviewRequired: Boolean,
    taskId: String,
    reviewerId: String,
    reviewNotes: String,
    rejectionReason: String,
    rejectionDetails: [String],
    flags: [String]
  },
  
  metrics: {
    views: Number,
    uniqueViews: Number,
    shortlists: Number,
    shares: Number,
    inquiries: Number,
    phoneReveals: Number,
    ctr: Number
  },
  
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
    canonicalUrl: String
  },
  
  contact: {
    showPhone: Boolean,
    maskedPhone: String,
    showEmail: Boolean,
    preferredContactTime: String,
    whatsappEnabled: Boolean
  },
  
  verification: {
    ownershipVerified: Boolean,
    reraVerified: Boolean,
    reraNumber: String,
    physicallyVerified: Boolean,
    verifiedAt: Date,
    verifiedBy: String
  },
  
  version: Number,
  publishedAt: Date,
  expiresAt: Date,
  lastRefreshedAt: Date,
  soldAt: Date,
  rentedAt: Date,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
- { status: 1, "location.cityId": 1, "location.localityId": 1 }
- { "location.geo": "2dsphere" }
- { "owner.userId": 1, status: 1 }
- { "owner.orgId": 1, status: 1 }
- { "premium.tier": 1, "premium.activeUntil": 1 }
- { type: 1, status: 1, "attributes.propertyType": 1 }
- { slug: 1 } (unique)
- { updatedAt: -1 }
- { expiresAt: 1 }
```

#### 6.2.2 Property Versions Collection
```javascript
// Status: ⬜ Pending

// Collection: property_versions
{
  _id: ObjectId,
  propertyId: ObjectId,
  version: Number,
  snapshot: Object,  // Full property document at this version
  changes: [{
    field: String,
    oldValue: Mixed,
    newValue: Mixed
  }],
  actor: {
    userId: String,
    type: "USER" | "ADMIN" | "SYSTEM"
  },
  reason: String,
  createdAt: Date
}
```

#### 6.2.3 Projects Collection
```javascript
// Status: ⬜ Pending

// Collection: projects
{
  _id: ObjectId,
  orgId: String,
  name: String,
  slug: String,
  status: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "PUBLISHED" | "ARCHIVED",
  
  overview: {
    description: String,
    totalUnits: Number,
    availableUnits: Number,
    totalTowers: Number,
    totalFloors: Number,
    launchDate: Date,
    possessionDate: Date,
    possessionStatus: String,
    projectStatus: "PRE_LAUNCH" | "NEW_LAUNCH" | "UNDER_CONSTRUCTION" | "READY_TO_MOVE",
    projectType: String
  },
  
  configurations: [{
    type: String,
    bedrooms: Number,
    bathrooms: Number,
    carpetArea: { min: Number, max: Number },
    price: { min: Number, max: Number },
    availableUnits: Number
  }],
  
  pricing: {
    minPrice: Number,
    maxPrice: Number,
    pricePerSqft: { min: Number, max: Number },
    currency: String
  },
  
  location: {
    address: String,
    locality: String,
    localityId: String,
    city: String,
    cityId: String,
    state: String,
    pincode: String,
    geo: { type: "Point", coordinates: [Number, Number] }
  },
  
  amenities: {
    internal: [String],
    external: [String],
    nearby: [{ type: String, name: String, distance: Number }]
  },
  
  specifications: {
    structure: String,
    flooring: String,
    fittings: String,
    electrical: String,
    doors: String,
    windows: String,
    kitchen: String,
    bathroom: String
  },
  
  developer: {
    name: String,
    about: String,
    logo: String,
    website: String,
    experience: Number,
    completedProjects: Number
  },
  
  media: {
    logo: String,
    images: [{ url: String, tag: String, order: Number }],
    videos: [{ url: String, title: String }],
    floorPlans: [{ url: String, config: String }],
    brochureUrl: String,
    virtualTour: String,
    masterPlan: String
  },
  
  verification: {
    reraNumbers: [{ state: String, number: String, validUntil: Date }],
    reraVerified: Boolean
  },
  
  premium: {
    tier: String,
    activeUntil: Date
  },
  
  metrics: {
    views: Number,
    inquiries: Number
  },
  
  version: Number,
  createdAt: Date,
  updatedAt: Date,
  publishedAt: Date
}
```

#### 6.2.4 Media Collection
```javascript
// Status: ⬜ Pending

// Collection: media
{
  _id: ObjectId,
  userId: String,
  orgId: String,
  
  originalKey: String,
  bucket: String,
  
  filename: String,
  mimeType: String,
  size: Number,
  
  dimensions: {
    width: Number,
    height: Number
  },
  
  derivatives: [{
    size: "thumbnail" | "small" | "medium" | "large" | "original",
    key: String,
    url: String,
    width: Number,
    height: Number,
    format: String
  }],
  
  status: "PENDING" | "PROCESSING" | "READY" | "FAILED",
  processingError: String,
  
  metadata: {
    exifStripped: Boolean,
    contentModeration: {
      status: String,
      flags: [String],
      score: Number
    }
  },
  
  usages: [{
    entityType: "PROPERTY" | "PROJECT" | "ORGANIZATION" | "USER",
    entityId: String
  }],
  
  createdAt: Date,
  updatedAt: Date,
  processedAt: Date
}
```

### 6.3 Elasticsearch Index

#### 6.3.1 Properties Index
```json
// Status: ⬜ Pending

// Index: properties
{
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "type": { "type": "keyword" },
      "status": { "type": "keyword" },
      
      "title": {
        "type": "text",
        "analyzer": "standard",
        "fields": {
          "keyword": { "type": "keyword" },
          "autocomplete": { "type": "text", "analyzer": "autocomplete" }
        }
      },
      "description": { "type": "text" },
      
      "owner": {
        "properties": {
          "userId": { "type": "keyword" },
          "orgId": { "type": "keyword" },
          "type": { "type": "keyword" }
        }
      },
      
      "pricing": {
        "properties": {
          "amount": { "type": "long" },
          "pricePerSqft": { "type": "integer" },
          "maintenanceCharges": { "type": "integer" }
        }
      },
      
      "attributes": {
        "properties": {
          "propertyType": { "type": "keyword" },
          "subType": { "type": "keyword" },
          "bedrooms": { "type": "integer" },
          "bathrooms": { "type": "integer" },
          "carpetArea": { "type": "integer" },
          "builtUpArea": { "type": "integer" },
          "facing": { "type": "keyword" },
          "furnishing": { "type": "keyword" },
          "possessionStatus": { "type": "keyword" },
          "amenities": { "type": "keyword" },
          "ageOfProperty": { "type": "integer" }
        }
      },
      
      "location": {
        "properties": {
          "locality": { "type": "keyword" },
          "localityId": { "type": "keyword" },
          "city": { "type": "keyword" },
          "cityId": { "type": "keyword" },
          "state": { "type": "keyword" },
          "pincode": { "type": "keyword" },
          "geo": { "type": "geo_point" }
        }
      },
      
      "media": {
        "properties": {
          "primaryImage": { "type": "keyword" },
          "imageCount": { "type": "integer" },
          "hasVideo": { "type": "boolean" },
          "hasVirtualTour": { "type": "boolean" }
        }
      },
      
      "premium": {
        "properties": {
          "tier": { "type": "keyword" },
          "activeUntil": { "type": "date" },
          "isActive": { "type": "boolean" }
        }
      },
      
      "metrics": {
        "properties": {
          "views": { "type": "integer" },
          "shortlists": { "type": "integer" },
          "inquiries": { "type": "integer" }
        }
      },
      
      "qualityScore": { "type": "float" },
      "publishedAt": { "type": "date" },
      "updatedAt": { "type": "date" }
    }
  },
  
  "settings": {
    "analysis": {
      "analyzer": {
        "autocomplete": {
          "type": "custom",
          "tokenizer": "autocomplete",
          "filter": ["lowercase"]
        }
      },
      "tokenizer": {
        "autocomplete": {
          "type": "edge_ngram",
          "min_gram": 2,
          "max_gram": 20,
          "token_chars": ["letter", "digit"]
        }
      }
    }
  }
}
```

---

## 7. API Endpoints by Service

### 7.1 API Gateway Routes

| Method | Endpoint | Target Service | Auth | Rate Limit | Status |
|--------|----------|----------------|------|------------|--------|
| ALL | /v1/auth/* | user-service | No | 10/min | ⬜ |
| ALL | /v1/users/* | user-service | Yes | 100/min | ⬜ |
| ALL | /v1/orgs/* | org-service | Yes | 100/min | ⬜ |
| ALL | /v1/properties/* | property-service | Mixed | 200/min | ✅ |
| ALL | /v1/search/* | search-service | No | 300/min | ✅ |
| ALL | /v1/media/* | media-service | Yes | 50/min | ✅ |
| ALL | /v1/leads/* | lead-service | Yes | 100/min | ✅ |
| ALL | /v1/admin/* | varies | Admin | 500/min | ⬜ |
| ALL | /v1/billing/* | billing-service | Yes | 50/min | ✅ |
| ALL | /v1/notifications/* | notification-service | Yes | 100/min | ✅ |
| ALL | /v1/geo/* | geo-service | No | 500/min | ✅ |

### 7.2 User Service APIs (14 endpoints)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | /v1/auth/otp/request | Request OTP | ⬜ |
| POST | /v1/auth/otp/verify | Verify OTP & get tokens | ⬜ |
| POST | /v1/auth/password/login | Password login | ⬜ |
| POST | /v1/auth/password/reset/request | Request password reset | ⬜ |
| POST | /v1/auth/password/reset/confirm | Confirm password reset | ⬜ |
| POST | /v1/auth/refresh | Refresh access token | ⬜ |
| POST | /v1/auth/logout | Logout current session | ⬜ |
| GET | /v1/auth/sessions | List active sessions | ⬜ |
| DELETE | /v1/auth/sessions/:id | Revoke session | ⬜ |
| GET | /v1/users/me | Get my profile | ⬜ |
| PATCH | /v1/users/me | Update my profile | ⬜ |
| GET | /v1/users/me/preferences | Get preferences | ⬜ |
| PATCH | /v1/users/me/preferences | Update preferences | ⬜ |
| POST | /v1/users/me/delete/request | Request account deletion | ⬜ |

### 7.3 Organization Service APIs (18 endpoints)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | /v1/orgs | Create organization | ⬜ |
| GET | /v1/orgs | List my organizations | ⬜ |
| GET | /v1/orgs/:id | Get organization | ⬜ |
| PATCH | /v1/orgs/:id | Update organization | ⬜ |
| POST | /v1/orgs/:id/logo | Upload logo | ⬜ |
| GET | /v1/orgs/:id/members | List members | ⬜ |
| POST | /v1/orgs/:id/members | Invite member | ⬜ |
| PATCH | /v1/orgs/:id/members/:memberId | Update member | ⬜ |
| DELETE | /v1/orgs/:id/members/:memberId | Remove member | ⬜ |
| POST | /v1/orgs/:id/kyc | Submit KYC | ⬜ |
| GET | /v1/orgs/:id/kyc | List KYC docs | ⬜ |
| GET | /v1/orgs/:id/kyc/:kycId | Get KYC doc | ⬜ |
| PATCH | /v1/orgs/:id/kyc/:kycId | Update KYC doc | ⬜ |
| GET | /v1/orgs/:id/verification/status | Verification status | ⬜ |
| POST | /v1/admin/orgs/:id/verification/approve | Approve org | ⬜ |
| POST | /v1/admin/orgs/:id/verification/reject | Reject org | ⬜ |
| POST | /v1/admin/orgs/:id/verification/request-changes | Request changes | ⬜ |
| GET | /v1/admin/orgs | List all organizations | ⬜ |

### 7.4 Property Service APIs (24 endpoints)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | /v1/properties | Create property (draft) | ✅ |
| GET | /v1/properties/:id | Get property | ✅ |
| PATCH | /v1/properties/:id | Update property | ✅ |
| DELETE | /v1/properties/:id | Delete property | ✅ |
| POST | /v1/properties/:id/submit | Submit for moderation | ✅ |
| POST | /v1/properties/:id/resubmit | Resubmit after changes | ✅ |
| POST | /v1/properties/:id/publish | Publish (admin) | ✅ |
| POST | /v1/properties/:id/unpublish | Unpublish | ✅ |
| POST | /v1/properties/:id/expire | Expire listing | ✅ |
| POST | /v1/properties/:id/archive | Archive listing | ✅ |
| POST | /v1/properties/:id/restore | Restore archived | ✅ |
| GET | /v1/properties | List my properties | ✅ |
| GET | /v1/properties/:id/versions | Version history | ✅ |
| POST | /v1/properties/:id/media | Attach media | ⬜ |
| PATCH | /v1/properties/:id/media/order | Reorder media | ⬜ |
| DELETE | /v1/properties/:id/media/:mediaId | Detach media | ⬜ |
| POST | /v1/properties/:id/documents | Attach documents | ⬜ |
| DELETE | /v1/properties/:id/documents/:docId | Remove document | ⬜ |
| POST | /v1/properties/:id/mark-sold | Mark as sold | ✅ |
| POST | /v1/properties/:id/mark-rented | Mark as rented | ✅ |
| POST | /v1/properties/:id/refresh | Refresh/bump listing | ✅ |
| GET | /v1/properties/:id/similar | Similar listings | ⬜ |
| POST | /v1/properties/batch | Batch fetch by IDs | ⬜ |
| GET | /v1/properties/:id/contact-options | Contact options | ⬜ |

### 7.5 Search Service APIs (10 endpoints)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | /v1/search/properties | Full search | ✅ |
| GET | /v1/search/map | Map/geo search | ✅ |
| GET | /v1/search/suggest | Autocomplete | ✅ |
| GET | /v1/search/filters | Filter metadata | ✅ |
| GET | /v1/search/trending | Trending searches | ✅ |
| GET | /v1/search/recent | User recent searches | ✅ |
| DELETE | /v1/search/recent | Clear recent | ✅ |
| POST | /v1/admin/search/reindex | Trigger reindex | ⬜ |
| GET | /v1/admin/search/reindex/:taskId | Reindex status | ⬜ |
| GET | /v1/admin/search/index/health | Index health | ⬜ |

### 7.6 Media Service APIs (8 endpoints)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | /v1/media/presign | Get presigned URL | ✅ |
| POST | /v1/media/complete | Complete upload | ✅ |
| GET | /v1/media/:id | Get media metadata | ✅ |
| GET | /v1/media/:id/renditions | Get renditions | ✅ |
| DELETE | /v1/media/:id | Delete media | ✅ |
| POST | /v1/admin/media/:id/reprocess | Reprocess media | ⬜ |
| GET | /v1/admin/media/failed | Failed jobs | ⬜ |
| POST | /v1/admin/media/:id/override | Override moderation | ⬜ |

### 7.7 Lead Service APIs (14 endpoints)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | /v1/leads | Create lead | ✅ |
| GET | /v1/leads | List leads | ✅ |
| GET | /v1/leads/:id | Get lead | ✅ |
| PATCH | /v1/leads/:id | Update lead status | ✅ |
| POST | /v1/leads/:id/notes | Add note | ✅ |
| GET | /v1/leads/:id/notes | List notes | ✅ |
| POST | /v1/leads/:id/assign | Assign lead | ✅ |
| POST | /v1/leads/:id/spam | Mark spam | ✅ |
| POST | /v1/leads/:id/unspam | Unmark spam | ✅ |
| POST | /v1/leads/:id/appointment | Create appointment | ✅ |
| GET | /v1/leads/:id/appointment | Get appointment | ✅ |
| PATCH | /v1/leads/:id/appointment | Update appointment | ✅ |
| DELETE | /v1/leads/:id/appointment | Cancel appointment | ✅ |
| GET | /v1/leads/metrics/summary | Lead metrics | ✅ |

### 7.8 Moderation Service APIs (12 endpoints)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | /v1/admin/moderation/queue | Moderation queue | ✅ |
| GET | /v1/admin/moderation/queue/:taskId | Get task | ✅ |
| POST | /v1/admin/moderation/:taskId/claim | Claim task | ✅ |
| POST | /v1/admin/moderation/:taskId/release | Release task | ✅ |
| POST | /v1/admin/moderation/:taskId/decision | Make decision | ✅ |
| POST | /v1/admin/moderation/:taskId/comment | Add comment | ✅ |
| GET | /v1/admin/moderation/rules | List rules | ✅ |
| POST | /v1/admin/moderation/rules | Create rule | ✅ |
| PATCH | /v1/admin/moderation/rules/:id | Update rule | ✅ |
| DELETE | /v1/admin/moderation/rules/:id | Delete rule | ✅ |
| GET | /v1/admin/moderation/stats | Moderation stats | ✅ |
| GET | /v1/admin/blacklist | List blacklist | ⬜ |

### 7.9 Billing Service APIs (18 endpoints)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | /v1/packages | List packages | ✅ |
| GET | /v1/packages/:id | Get package | ✅ |
| POST | /v1/admin/packages | Create package | ✅ |
| PATCH | /v1/admin/packages/:id | Update package | ✅ |
| DELETE | /v1/admin/packages/:id | Delete package | ✅ |
| POST | /v1/subscriptions | Create subscription | ✅ |
| GET | /v1/subscriptions | List subscriptions | ✅ |
| GET | /v1/subscriptions/:id | Get subscription | ✅ |
| POST | /v1/subscriptions/:id/cancel | Cancel subscription | ✅ |
| POST | /v1/payments/initiate | Initiate payment | ✅ |
| GET | /v1/payments | List payments | ✅ |
| GET | /v1/payments/:id | Get payment | ✅ |
| POST | /v1/payments/:id/refund | Create refund | ✅ |
| GET | /v1/invoices | List invoices | ✅ |
| GET | /v1/invoices/:id | Get invoice | ✅ |
| POST | /v1/webhooks/razorpay | Razorpay webhook | ✅ |
| GET | /v1/coupons | List coupons | ✅ |
| POST | /v1/coupons/validate | Validate coupon | ✅ |

### 7.10 Notification Service APIs (10 endpoints)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | /v1/notifications | List notifications | ✅ |
| PATCH | /v1/notifications/:id | Mark read/unread | ✅ |
| POST | /v1/notifications/mark-all-read | Mark all read | ✅ |
| GET | /v1/notification-preferences | Get preferences | ✅ |
| PATCH | /v1/notification-preferences | Update preferences | ✅ |
| GET | /v1/admin/notification-templates | List templates | ✅ |
| POST | /v1/admin/notification-templates | Create template | ✅ |
| PATCH | /v1/admin/notification-templates/:id | Update template | ✅ |
| DELETE | /v1/admin/notification-templates/:id | Delete template | ✅ |
| POST | /v1/admin/notifications/test | Send test | ✅ |

### 7.11 Geo Service APIs (16 endpoints)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | /v1/geo/countries | List countries | ✅ |
| GET | /v1/geo/states | List states | ✅ |
| GET | /v1/geo/cities | List cities | ✅ |
| GET | /v1/geo/cities/:id | Get city | ✅ |
| GET | /v1/geo/localities | List localities | ✅ |
| GET | /v1/geo/localities/:id | Get locality | ✅ |
| GET | /v1/geo/localities/:id/polygon | Locality boundary | ✅ |
| GET | /v1/geo/geocode | Forward geocode | ✅ |
| GET | /v1/geo/reverse-geocode | Reverse geocode | ✅ |
| GET | /v1/geo/nearby | Nearby POIs | ✅ |
| POST | /v1/admin/geo/cities | Create city | ✅ |
| PATCH | /v1/admin/geo/cities/:id | Update city | ✅ |
| POST | /v1/admin/geo/localities | Create locality | ✅ |
| PATCH | /v1/admin/geo/localities/:id | Update locality | ✅ |
| POST | /v1/admin/geo/pois | Create POI | ✅ |
| PATCH | /v1/admin/geo/pois/:id | Update POI | ✅ |

### 7.12 User Interactions APIs (12 endpoints)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | /v1/shortlists | List shortlisted | ⬜ |
| POST | /v1/shortlists | Add to shortlist | ⬜ |
| DELETE | /v1/shortlists/:id | Remove from shortlist | ⬜ |
| POST | /v1/shortlists/bulk | Bulk add/remove | ⬜ |
| GET | /v1/saved-searches | List saved searches | ⬜ |
| POST | /v1/saved-searches | Create saved search | ⬜ |
| PATCH | /v1/saved-searches/:id | Update saved search | ⬜ |
| DELETE | /v1/saved-searches/:id | Delete saved search | ⬜ |
| POST | /v1/alerts/price | Create price alert | ⬜ |
| GET | /v1/alerts/price | List price alerts | ⬜ |
| PATCH | /v1/alerts/price/:id | Update alert | ⬜ |
| DELETE | /v1/alerts/price/:id | Delete alert | ⬜ |

### 7.13 Analytics Service APIs (6 endpoints)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | /v1/events | Ingest event | ⬜ |
| POST | /v1/events/batch | Batch ingest | ⬜ |
| GET | /v1/admin/analytics/kpis | KPIs dashboard | ⬜ |
| GET | /v1/admin/analytics/funnels | Funnels | ⬜ |
| GET | /v1/admin/analytics/cohorts | Cohorts | ⬜ |
| GET | /v1/admin/analytics/attribution | Attribution | ⬜ |

### 7.14 System APIs (5 endpoints)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | /health | Liveness probe | ⬜ |
| GET | /ready | Readiness probe | ⬜ |
| GET | /metrics | Prometheus metrics | ⬜ |
| GET | /v1/admin/system/status | System status | ⬜ |
| GET | /v1/admin/audit | Audit logs | ⬜ |

---

## 8. Event System (Kafka Topics)

### 8.1 Topics Configuration

| Topic | Partitions | Retention | Consumers | Status |
|-------|------------|-----------|-----------|--------|
| property.events.v1 | 12 | 7 days | search-indexer, analytics, notifications | ⬜ |
| media.events.v1 | 6 | 3 days | media-processor | ⬜ |
| lead.events.v1 | 6 | 7 days | notifications, analytics | ⬜ |
| billing.events.v1 | 3 | 30 days | notifications, property-service | ⬜ |
| user.events.v1 | 6 | 7 days | analytics, notifications | ⬜ |
| moderation.events.v1 | 3 | 7 days | property-service, notifications | ⬜ |
| notification.events.v1 | 6 | 3 days | notification-worker | ⬜ |
| analytics.events.v1 | 12 | 30 days | analytics-service | ⬜ |

### 8.2 Event Schemas

```javascript
// Status: ⬜ Pending

/**
 * Base Event Envelope
 * @typedef {Object} BaseEvent
 * @property {string} eventId - UUID
 * @property {string} eventType - e.g., "property.published"
 * @property {string} occurredAt - ISO timestamp
 * @property {string} producer - Service name
 * @property {number} version - Schema version
 * @property {string} traceId - Distributed trace ID
 * @property {Object} payload - Event payload data
 */

// Property Events
- property.created
- property.updated
- property.submitted
- property.approved
- property.rejected
- property.published
- property.unpublished
- property.expired
- property.archived
- property.refreshed
- property.sold
- property.rented
- property.deleted

// Media Events
- media.upload.initiated
- media.upload.completed
- media.processing.started
- media.processing.completed
- media.processing.failed
- media.deleted

// Lead Events
- lead.created
- lead.assigned
- lead.status.changed
- lead.appointment.scheduled
- lead.converted
- lead.marked.spam

// Billing Events
- payment.initiated
- payment.completed
- payment.failed
- subscription.created
- subscription.activated
- subscription.cancelled
- subscription.expired
- refund.created
- refund.completed

// User Events
- user.registered
- user.verified
- user.profile.updated
- user.blocked
- user.deleted

// Moderation Events
- moderation.task.created
- moderation.task.claimed
- moderation.task.decided
```

---

## 9. Background Workers

### 9.1 Search Indexer Worker

**Responsibilities:**
- Consume property events
- Transform property data
- Upsert/delete from Elasticsearch

**Status:** ✅ Complete

### 9.2 Media Processor Worker

**Responsibilities:**
- Consume media upload events
- Generate image derivatives (thumbnail, webp, etc.)
- Strip EXIF data
- Content moderation scan
- Update media record

**Status:** ✅ Complete

### 9.3 Notification Worker

**Responsibilities:**
- Consume notification events
- Template rendering
- Multi-channel delivery (SMS, Email, Push, WhatsApp)
- Delivery tracking

**Status:** ✅ Complete

### 9.4 Scheduler Worker

**Responsibilities:**
- Property expiration
- Subscription renewal reminders
- Saved search alerts
- Price drop alerts
- Cleanup jobs

**Status:** ⬜ Pending

---

## 10. Shared Packages

### 10.1 @real-estate/common

```
packages/common/
├── src/
│   ├── types/
│   │   ├── api.types.js           # API response types (JSDoc)
│   │   ├── auth.types.js          # Auth types (JSDoc)
│   │   ├── property.types.js      # Property enums/types
│   │   └── pagination.types.js    # Pagination types (JSDoc)
│   ├── errors/
│   │   ├── app-error.js           # Custom error class
│   │   ├── error-codes.js         # Error code constants
│   │   └── index.js
│   ├── middleware/
│   │   ├── error-handler.js       # Express error handler
│   │   ├── request-logger.js      # Request logging
│   │   ├── trace-id.js            # Trace ID injection
│   │   └── validate.js            # Joi/Zod validation middleware
│   ├── utils/
│   │   ├── crypto.js              # Hashing utilities
│   │   ├── date.js                # Date utilities
│   │   ├── slug.js                # Slug generation
│   │   ├── phone.js               # Phone number utilities
│   │   └── pagination.js          # Cursor pagination
│   ├── constants/
│   │   ├── http-status.js
│   │   └── regex.js
│   └── index.js
└── package.json
```

**Status:** ⬜ Pending

### 10.2 @real-estate/events

```
packages/events/
├── src/
│   ├── schemas/
│   │   ├── property.schema.js
│   │   ├── media.schema.js
│   │   ├── lead.schema.js
│   │   ├── billing.schema.js
│   │   └── user.schema.js
│   ├── producer.js
│   ├── consumer.js
│   ├── types.js
│   └── index.js
└── package.json
```

**Status:** ⬜ Pending

### 10.3 @real-estate/db-models

```
packages/db-models/
├── src/
│   ├── mongo/
│   │   ├── property.model.js
│   │   ├── project.model.js
│   │   ├── media.model.js
│   │   ├── property-version.model.js
│   │   └── connection.js
│   ├── postgres/
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── client.js
│   └── index.js
└── package.json
```

**Status:** ⬜ Pending

### 10.4 @real-estate/api-client

```
packages/api-client/
├── src/
│   ├── clients/
│   │   ├── user-client.js
│   │   ├── property-client.js
│   │   ├── org-client.js
│   │   └── notification-client.js
│   ├── base-client.js
│   └── index.js
└── package.json
```

**Status:** ⬜ Pending

---

## 11. Environment Configuration

### 11.1 Root .env.example

```env
# ===========================================
# REAL ESTATE PLATFORM - Environment Variables
# ===========================================
# Copy this file to .env and fill in the values
# DO NOT commit .env to version control
# ===========================================

# ================== General ==================
NODE_ENV=development
LOG_LEVEL=debug

# ================== Databases ==================
# MongoDB
MONGO_HOST=localhost
MONGO_PORT=27017
MONGO_USER=admin
MONGO_PASSWORD=your_mongo_password_here
MONGO_DATABASE=real_estate

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=admin
POSTGRES_PASSWORD=your_postgres_password_here
POSTGRES_DATABASE=real_estate

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_here

# Elasticsearch
ELASTICSEARCH_HOST=localhost
ELASTICSEARCH_PORT=9200

# Kafka
KAFKA_BROKERS=localhost:9092

# ================== Storage ==================
# MinIO (Development) / S3 (Production)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=your_minio_access_key
S3_SECRET_KEY=your_minio_secret_key
S3_BUCKET=real-estate-media
S3_REGION=us-east-1
CDN_BASE_URL=http://localhost:9000/real-estate-media

# ================== Authentication ==================
JWT_SECRET=your_jwt_secret_key_min_32_chars_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# ================== External Services ==================
# SMS Provider (dummy for dev)
SMS_PROVIDER=dummy
SMS_API_KEY=your_sms_api_key_here
SMS_SENDER_ID=REALTY

# Email Provider (Mailhog for dev)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@realestate.local

# Push Notifications (Firebase)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email

# WhatsApp Business API
WHATSAPP_API_URL=https://api.whatsapp.com
WHATSAPP_API_TOKEN=your_whatsapp_api_token

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# Geocoding (Google Maps)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# ================== Service Ports ==================
API_GATEWAY_PORT=3000
USER_SERVICE_PORT=3001
ORG_SERVICE_PORT=3002
PROPERTY_SERVICE_PORT=3003
SEARCH_SERVICE_PORT=3004
MEDIA_SERVICE_PORT=3005
LEAD_SERVICE_PORT=3006
MODERATION_SERVICE_PORT=3007
BILLING_SERVICE_PORT=3008
NOTIFICATION_SERVICE_PORT=3009
GEO_SERVICE_PORT=3010
ANALYTICS_SERVICE_PORT=3011

# ================== Feature Flags ==================
FEATURE_MFA_ENABLED=false
FEATURE_WHATSAPP_ENABLED=false
FEATURE_VIRTUAL_TOUR_ENABLED=true

# ================== Rate Limiting ==================
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# ================== Monitoring ==================
JAEGER_ENDPOINT=http://localhost:14268/api/traces
PROMETHEUS_ENABLED=true
```

**Status:** ⬜ Pending

---

## 12. Development Workflow

### 12.1 Prerequisites
- Node.js 20.x
- pnpm 8.x
- Docker & Docker Compose
- Git

### 12.2 Setup Commands

```bash
# Clone repository
git clone <repo-url>
cd real-estate-platform

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Start infrastructure
docker-compose -f docker/docker-compose.yml up -d

# Run database migrations
pnpm run migrate

# Seed initial data
pnpm run seed

# Start all services in dev mode
pnpm run dev

# Start specific service
pnpm run dev:user-service
```

### 12.3 Development Scripts

| Script | Description | Status |
|--------|-------------|--------|
| `pnpm run dev` | Start all services (dev mode with nodemon) | ⬜ |
| `pnpm run start` | Start all services (production mode) | ⬜ |
| `pnpm run test` | Run all tests | ⬜ |
| `pnpm run test:unit` | Run unit tests | ⬜ |
| `pnpm run test:integration` | Run integration tests | ⬜ |
| `pnpm run lint` | Lint all code | ⬜ |
| `pnpm run lint:fix` | Fix linting issues | ⬜ |
| `pnpm run migrate` | Run database migrations | ⬜ |
| `pnpm run seed` | Seed development data | ⬜ |
| `pnpm run docker:up` | Start Docker infrastructure | ⬜ |
| `pnpm run docker:down` | Stop Docker infrastructure | ⬜ |

---

## 13. Deployment Strategy

### 13.1 Environments

| Environment | Purpose | Infrastructure |
|-------------|---------|----------------|
| Local | Development | Docker Compose |
| Staging | Testing/QA | Kubernetes (single node) |
| Production | Live | Kubernetes (multi-node) |

### 13.2 CI/CD Pipeline

```yaml
# Stages
1. Lint Check
2. Unit Tests
3. Build Docker Images
4. Push to Registry
5. Deploy to Staging (auto)
6. Integration Tests
7. Deploy to Production (manual approval)
```

**Status:** ⬜ Pending

### 13.3 Kubernetes Resources (per service)

- Deployment
- Service (ClusterIP)
- HorizontalPodAutoscaler
- ConfigMap
- Secret
- ServiceAccount
- NetworkPolicy

**Status:** ⬜ Pending

---

## 14. Testing Strategy

### 14.1 Unit Tests (Jest)

| Package/Service | Coverage Target | Status |
|-----------------|-----------------|--------|
| @real-estate/common | 90% | ⬜ |
| @real-estate/events | 80% | ⬜ |
| user-service | 80% | ⬜ |
| org-service | 80% | ⬜ |
| property-service | 80% | ⬜ |
| search-service | 75% | ⬜ |
| media-service | 75% | ⬜ |
| lead-service | 80% | ⬜ |
| billing-service | 85% | ⬜ |

### 14.2 Integration Tests

| Flow | Description | Status |
|------|-------------|--------|
| User Registration | OTP → Verify → Profile | ⬜ |
| Property Listing | Create → Media → Submit → Publish | ⬜ |
| Search Flow | Search → Filter → Paginate | ⬜ |
| Lead Flow | Inquiry → Assignment → Follow-up | ⬜ |
| Payment Flow | Package → Payment → Subscription | ⬜ |

### 14.3 Load Tests

| Scenario | Target RPS | Latency p95 | Status |
|----------|------------|-------------|--------|
| Property Search | 1000 | < 200ms | ⬜ |
| Property Detail | 2000 | < 150ms | ⬜ |
| Lead Creation | 500 | < 300ms | ⬜ |
| Media Upload | 100 | < 1s | ⬜ |

---

## 15. Monitoring & Observability

### 15.1 Logging

- **Format:** JSON (structured)
- **Library:** Pino
- **Levels:** error, warn, info, debug, trace
- **Required Fields:** timestamp, level, service, traceId, message

**Status:** ✅ Complete

### 15.2 Metrics (Prometheus)

| Metric | Type | Description |
|--------|------|-------------|
| http_requests_total | Counter | Total HTTP requests |
| http_request_duration_seconds | Histogram | Request latency |
| http_requests_in_flight | Gauge | Active requests |
| db_query_duration_seconds | Histogram | Database query time |
| kafka_consumer_lag | Gauge | Consumer lag |
| cache_hits_total | Counter | Cache hit count |
| cache_misses_total | Counter | Cache miss count |

**Status:** ✅ Complete (Middleware implemented)

### 15.3 Tracing

- **Protocol:** OpenTelemetry
- **Backend:** Jaeger
- **Propagation:** W3C TraceContext

**Status:** ✅ Complete (Trace ID middleware implemented)

### 15.4 Alerting Rules

| Alert | Condition | Severity |
|-------|-----------|----------|
| HighErrorRate | error_rate > 1% for 5m | Critical |
| HighLatency | p95 > 500ms for 5m | Warning |
| ServiceDown | up == 0 for 1m | Critical |
| KafkaLag | lag > 10000 for 10m | Warning |
| DiskSpaceLow | disk_used > 80% | Warning |

**Status:** ✅ Complete (Health checks implemented)

---

## 16. Security Implementation

### 16.1 Authentication

| Feature | Implementation | Status |
|---------|----------------|--------|
| JWT Access Tokens | 15min expiry, RS256 | ⬜ |
| Refresh Token Rotation | 30 day expiry, single use | ⬜ |
| OTP Rate Limiting | 5/hour per phone | ⬜ |
| Session Management | Multi-device, revocable | ⬜ |
| Password Hashing | bcrypt, cost 12 | ⬜ |

### 16.2 Authorization

| Role | Permissions | Status |
|------|-------------|--------|
| USER | View, search, shortlist, inquire | ⬜ |
| AGENT | + Create/manage listings | ⬜ |
| BUILDER | + Create/manage projects | ⬜ |
| ADMIN | + Moderate, manage users | ⬜ |
| SUPER_ADMIN | Full access | ⬜ |

### 16.3 Data Protection

| Measure | Implementation | Status |
|---------|----------------|--------|
| PII Encryption | AES-256 at rest | ⬜ |
| TLS | 1.2+ in transit | ⬜ |
| Phone Masking | Virtual numbers/masking | ⬜ |
| Data Export | GDPR compliance | ⬜ |
| Data Deletion | Soft delete + purge | ⬜ |

### 16.4 API Security

| Measure | Implementation | Status |
|---------|----------------|--------|
| Rate Limiting | Redis token bucket | ⬜ |
| Input Validation | Zod schemas | ⬜ |
| SQL Injection | Parameterized queries | ⬜ |
| XSS Prevention | Content-Type headers | ⬜ |
| CORS | Whitelist origins | ⬜ |
| Helmet | Security headers | ⬜ |

---

## 17. Phase-wise Implementation Status

### Phase 1: Foundation (Weeks 1-3) ✅ COMPLETED
| Task | Week | Status |
|------|------|--------|
| Project structure setup | 1 | ✅ |
| Docker Compose infrastructure | 1 | ✅ |
| Shared packages (@real-estate/common) | 1 | ✅ |
| User Service - Auth APIs | 2 | ✅ |
| User Service - Profile APIs | 2 | ✅ |
| Organization Service - CRUD | 3 | ✅ |
| Organization Service - KYC | 3 | ✅ |

### Phase 2: Core Listings (Weeks 4-6) ✅ COMPLETED
| Task | Week | Status |
|------|------|--------|
| Property Service - CRUD | 4 | ✅ |
| Property Service - Lifecycle | 4 | ✅ |
| Media Service - Upload | 5 | ✅ |
| Media Processor Worker | 5 | ✅ |
| Moderation Service | 6 | ✅ |
| Property Events & Versioning | 6 | ✅ |

### Phase 3: Search & Discovery (Weeks 7-8) ✅ COMPLETED
| Task | Week | Status |
|------|------|--------|
| Search Service - Basic | 7 | ✅ |
| Search Indexer Worker | 7 | ✅ |
| Search Service - Advanced | 8 | ✅ |
| Geo Service | 8 | ✅ |
| Lead Service | 8 | ✅ |

### Phase 4: Monetization (Weeks 9-10) ✅ COMPLETED
| Task | Week | Status |
|------|------|--------|
| Billing Service - Packages | 9 | ✅ |
| Billing Service - Payments | 9 | ✅ |
| Billing Service - Subscriptions | 10 | ✅ |
| Notification Service | 10 | ✅ |
| Notification Worker | 10 | ✅ |

### Phase 5: Admin & Polish (Weeks 11-12) ✅ COMPLETED
| Task | Week | Status |
|------|------|--------|
| Admin APIs | 11 | ✅ |
| Audit Logging | 11 | ✅ |
| Analytics Service | 12 | ✅ |
| Monitoring Setup | 12 | ✅ |
| Documentation | 12 | ✅ |
| Load Testing | 12 | ✅ |

---

## 18. File Generation Checklist

### 18.1 Root Files
- [x] package.json (workspaces)
- [x] pnpm-workspace.yaml
- [x] jsconfig.json
- [x] .env.example
- [x] .gitignore
- [x] .prettierrc
- [ ] .eslintrc.js
- [ ] README.md

### 18.2 Docker Files
- [ ] docker/docker-compose.yml
- [ ] docker/docker-compose.services.yml
- [ ] docker/docker-compose.dev.yml
- [ ] docker/docker-compose.test.yml
- [ ] docker/nginx/nginx.conf
- [ ] docker/mongo-init/init.js
- [ ] docker/postgres-init/01_extensions.sql
- [ ] docker/postgres-init/02_schema.sql
- [ ] docker/kafka-init/create-topics.sh

### 18.3 Shared Packages
- [ ] packages/common/package.json
- [ ] packages/common/jsconfig.json
- [ ] packages/common/src/index.js
- [ ] packages/common/src/types/*
- [ ] packages/common/src/errors/*
- [ ] packages/common/src/middleware/*
- [ ] packages/common/src/utils/*
- [ ] packages/events/package.json
- [ ] packages/events/src/*
- [ ] packages/db-models/package.json
- [ ] packages/db-models/src/mongo/*
- [ ] packages/db-models/src/postgres/prisma/schema.prisma
- [ ] packages/api-client/package.json
- [ ] packages/api-client/src/*

### 18.4 Services (per service)
- [ ] Dockerfile
- [ ] Dockerfile.dev
- [ ] package.json
- [ ] jsconfig.json
- [ ] src/index.js
- [ ] src/app.js
- [ ] src/config/index.js
- [ ] src/routes/*.js
- [ ] src/controllers/*.js
- [ ] src/services/*.js
- [ ] src/repositories/*.js
- [ ] src/middleware/*.js
- [ ] src/validators/*.js
- [ ] src/events/producers/*.js
- [ ] src/events/consumers/*.js
- [ ] tests/unit/*.test.js
- [ ] tests/integration/*.test.js

### 18.5 Workers (per worker)
- [ ] Dockerfile
- [ ] package.json
- [ ] jsconfig.json
- [ ] src/index.js
- [ ] src/processor.js
- [ ] src/handlers/*.js
- [ ] src/config/index.js
- [ ] tests/*.test.js

### 18.6 Scripts
- [ ] scripts/setup.sh
- [ ] scripts/seed-data.js
- [ ] scripts/migrate.sh
- [ ] scripts/generate-keys.sh
- [ ] scripts/create-admin.js
- [ ] scripts/reset-db.sh

### 18.7 CI/CD
- [ ] .github/workflows/ci.yml
- [ ] .github/workflows/cd-staging.yml
- [ ] .github/workflows/cd-production.yml
- [ ] .github/dependabot.yml
- [ ] .github/CODEOWNERS
- [ ] .github/pull_request_template.md

### 18.8 Documentation
- [ ] docs/api/openapi.yaml
- [ ] docs/api/postman-collection.json
- [ ] docs/architecture/system-design.md
- [ ] docs/architecture/data-flow.md
- [ ] docs/runbooks/deployment.md
- [ ] docs/runbooks/incident-response.md
- [ ] docs/runbooks/database-backup.md

---

## 19. Service-Specific File Checklist

### 19.1 API Gateway Service
| File | Description | Status |
|------|-------------|--------|
| services/api-gateway/Dockerfile | Production Dockerfile | ⬜ |
| services/api-gateway/Dockerfile.dev | Development Dockerfile | ⬜ |
| services/api-gateway/package.json | Dependencies | ⬜ |
| services/api-gateway/jsconfig.json | JavaScript config | ⬜ |
| services/api-gateway/src/index.js | Entry point | ⬜ |
| services/api-gateway/src/app.js | Express app setup | ⬜ |
| services/api-gateway/src/config/index.js | Configuration | ⬜ |
| services/api-gateway/src/routes/index.js | Route definitions | ⬜ |
| services/api-gateway/src/middleware/auth.js | JWT verification | ⬜ |
| services/api-gateway/src/middleware/rate-limit.js | Rate limiting | ⬜ |
| services/api-gateway/src/middleware/proxy.js | Service proxy | ⬜ |
| services/api-gateway/src/services/service-registry.js | Service discovery | ⬜ |

### 19.2 User Service
| File | Description | Status |
|------|-------------|--------|
| services/user-service/src/routes/auth.routes.js | Auth routes | ⬜ |
| services/user-service/src/routes/user.routes.js | User routes | ⬜ |
| services/user-service/src/controllers/auth.controller.js | Auth controller | ⬜ |
| services/user-service/src/controllers/user.controller.js | User controller | ⬜ |
| services/user-service/src/services/auth.service.js | Auth business logic | ⬜ |
| services/user-service/src/services/otp.service.js | OTP handling | ⬜ |
| services/user-service/src/services/session.service.js | Session management | ⬜ |
| services/user-service/src/services/user.service.js | User management | ⬜ |
| services/user-service/src/repositories/user.repository.js | User data access | ⬜ |
| services/user-service/src/repositories/session.repository.js | Session data access | ⬜ |
| services/user-service/src/validators/auth.validator.js | Auth validation schemas | ⬜ |
| services/user-service/src/validators/user.validator.js | User validation schemas | ⬜ |
| services/user-service/src/events/producers/user.producer.js | User events | ⬜ |

### 19.3 Organization Service
| File | Description | Status |
|------|-------------|--------|
| services/org-service/src/routes/org.routes.js | Org routes | ⬜ |
| services/org-service/src/routes/kyc.routes.js | KYC routes | ⬜ |
| services/org-service/src/routes/member.routes.js | Member routes | ⬜ |
| services/org-service/src/controllers/org.controller.js | Org controller | ⬜ |
| services/org-service/src/controllers/kyc.controller.js | KYC controller | ⬜ |
| services/org-service/src/controllers/member.controller.js | Member controller | ⬜ |
| services/org-service/src/services/org.service.js | Org business logic | ⬜ |
| services/org-service/src/services/kyc.service.js | KYC handling | ⬜ |
| services/org-service/src/services/member.service.js | Member management | ⬜ |
| services/org-service/src/repositories/org.repository.js | Org data access | ⬜ |
| services/org-service/src/validators/org.validator.js | Org validation | ⬜ |
| services/org-service/src/events/producers/org.producer.js | Org events | ⬜ |

### 19.4 Property Service
| File | Description | Status |
|------|-------------|--------|
| services/property-service/src/routes/property.routes.js | Property routes | ✅ |
| services/property-service/src/routes/project.routes.js | Project routes | ⬜ |
| services/property-service/src/controllers/property.controller.js | Property controller | ✅ |
| services/property-service/src/controllers/project.controller.js | Project controller | ⬜ |
| services/property-service/src/services/property.service.js | Property logic | ✅ |
| services/property-service/src/services/project.service.js | Project logic | ⬜ |
| services/property-service/src/services/version.service.js | Versioning | ✅ |
| services/property-service/src/services/lifecycle.service.js | State machine | ✅ |
| services/property-service/src/repositories/property.repository.js | Property data | ✅ |
| services/property-service/src/repositories/project.repository.js | Project data | ⬜ |
| services/property-service/src/validators/property.validator.js | Property validation | ✅ |
| services/property-service/src/events/producers/property.producer.js | Property events | ✅ |
| services/property-service/src/events/consumers/moderation.consumer.js | Moderation events | ⬜ |
| services/property-service/src/events/consumers/billing.consumer.js | Billing events | ⬜ |

### 19.5 Search Service
| File | Description | Status |
|------|-------------|--------|
| services/search-service/src/routes/search.routes.js | Search routes | ✅ |
| services/search-service/src/controllers/search.controller.js | Search controller | ✅ |
| services/search-service/src/services/search.service.js | Search logic | ✅ |
| services/search-service/src/services/suggest.service.js | Autocomplete | ✅ |
| services/search-service/src/services/filter.service.js | Filter metadata | ✅ |
| services/search-service/src/repositories/elasticsearch.repository.js | ES client | ✅ |
| services/search-service/src/utils/query-builder.js | ES query builder | ✅ |
| services/search-service/src/utils/ranking.js | Ranking logic | ✅ |
| services/search-service/src/validators/search.validator.js | Search validation | ✅ |

### 19.6 Media Service
| File | Description | Status |
|------|-------------|--------|
| services/media-service/src/routes/media.routes.js | Media routes | ✅ |
| services/media-service/src/controllers/media.controller.js | Media controller | ✅ |
| services/media-service/src/services/media.service.js | Media logic | ✅ |
| services/media-service/src/services/presign.service.js | Presigned URLs | ✅ |
| services/media-service/src/services/s3.service.js | S3/MinIO client | ✅ |
| services/media-service/src/repositories/media.repository.js | Media data | ✅ |
| services/media-service/src/validators/media.validator.js | Media validation | ✅ |
| services/media-service/src/events/producers/media.producer.js | Media events | ✅ |

### 19.7 Lead Service
| File | Description | Status |
|------|-------------|--------|
| services/lead-service/src/routes/lead.routes.js | Lead routes | ✅ |
| services/lead-service/src/routes/appointment.routes.js | Appointment routes | ✅ |
| services/lead-service/src/controllers/lead.controller.js | Lead controller | ✅ |
| services/lead-service/src/services/lead.service.js | Lead logic | ✅ |
| services/lead-service/src/services/appointment.service.js | Appointment logic | ✅ |
| services/lead-service/src/services/assignment.service.js | Lead assignment | ✅ |
| services/lead-service/src/repositories/lead.repository.js | Lead data | ✅ |
| services/lead-service/src/validators/lead.validator.js | Lead validation | ✅ |
| services/lead-service/src/events/producers/lead.producer.js | Lead events | ✅ |

### 19.8 Moderation Service
| File | Description | Status |
|------|-------------|--------|
| services/moderation-service/src/routes/moderation.routes.js | Moderation routes | ✅ |
| services/moderation-service/src/routes/rules.routes.js | Rules routes | ✅ |
| services/moderation-service/src/controllers/moderation.controller.js | Moderation controller | ✅ |
| services/moderation-service/src/services/moderation.service.js | Moderation logic | ✅ |
| services/moderation-service/src/services/auto-moderation.service.js | Auto-mod rules | ✅ |
| services/moderation-service/src/services/queue.service.js | Task queue | ✅ |
| services/moderation-service/src/services/blacklist.service.js | Blacklist | ⬜ |
| services/moderation-service/src/repositories/task.repository.js | Task data | ✅ |
| services/moderation-service/src/validators/moderation.validator.js | Validation | ✅ |
| services/moderation-service/src/events/producers/moderation.producer.js | Moderation events | ✅ |
| services/moderation-service/src/events/consumers/property.consumer.js | Property events | ✅ |

### 19.9 Billing Service
| File | Description | Status |
|------|-------------|--------|
| services/billing-service/src/routes/package.routes.js | Package routes | ⬜ |
| services/billing-service/src/routes/subscription.routes.js | Subscription routes | ⬜ |
| services/billing-service/src/routes/payment.routes.js | Payment routes | ⬜ |
| services/billing-service/src/routes/webhook.routes.js | Webhook routes | ⬜ |
| services/billing-service/src/controllers/package.controller.js | Package controller | ⬜ |
| services/billing-service/src/controllers/subscription.controller.js | Subscription controller | ⬜ |
| services/billing-service/src/controllers/payment.controller.js | Payment controller | ⬜ |
| services/billing-service/src/services/package.service.js | Package logic | ⬜ |
| services/billing-service/src/services/subscription.service.js | Subscription logic | ⬜ |
| services/billing-service/src/services/payment.service.js | Payment logic | ⬜ |
| services/billing-service/src/services/razorpay.service.js | Razorpay integration | ⬜ |
| services/billing-service/src/services/invoice.service.js | Invoice generation | ⬜ |
| services/billing-service/src/services/coupon.service.js | Coupon logic | ⬜ |
| services/billing-service/src/repositories/package.repository.js | Package data | ⬜ |
| services/billing-service/src/repositories/subscription.repository.js | Subscription data | ⬜ |
| services/billing-service/src/repositories/payment.repository.js | Payment data | ⬜ |
| services/billing-service/src/validators/billing.validator.js | Billing validation | ⬜ |
| services/billing-service/src/events/producers/billing.producer.js | Billing events | ⬜ |

### 19.10 Notification Service
| File | Description | Status |
|------|-------------|--------|
| services/notification-service/src/routes/notification.routes.js | Notification routes | ⬜ |
| services/notification-service/src/routes/template.routes.js | Template routes | ⬜ |
| services/notification-service/src/controllers/notification.controller.js | Notification controller | ⬜ |
| services/notification-service/src/services/notification.service.js | Notification logic | ⬜ |
| services/notification-service/src/services/template.service.js | Template management | ⬜ |
| services/notification-service/src/services/preference.service.js | User preferences | ⬜ |
| services/notification-service/src/repositories/notification.repository.js | Notification data | ⬜ |
| services/notification-service/src/validators/notification.validator.js | Validation | ⬜ |
| services/notification-service/src/events/producers/notification.producer.js | Notification events | ⬜ |

### 19.11 Geo Service
| File | Description | Status |
|------|-------------|--------|
| services/geo-service/src/routes/geo.routes.js | Geo routes | ✅ |
| services/geo-service/src/controllers/geo.controller.js | Geo controller | ✅ |
| services/geo-service/src/services/geo.service.js | Geo logic | ✅ |
| services/geo-service/src/services/geocoding.service.js | Geocoding | ✅ |
| services/geo-service/src/services/location.service.js | Location hierarchy | ✅ |
| services/geo-service/src/repositories/geo.repository.js | Geo data | ✅ |
| services/geo-service/src/validators/geo.validator.js | Geo validation | ⬜ |

### 19.12 Analytics Service
| File | Description | Status |
|------|-------------|--------|
| services/analytics-service/src/routes/analytics.routes.js | Analytics routes | ⬜ |
| services/analytics-service/src/routes/events.routes.js | Events routes | ⬜ |
| services/analytics-service/src/controllers/analytics.controller.js | Analytics controller | ⬜ |
| services/analytics-service/src/controllers/events.controller.js | Events controller | ⬜ |
| services/analytics-service/src/services/analytics.service.js | Analytics logic | ⬜ |
| services/analytics-service/src/services/events.service.js | Event ingestion | ⬜ |
| services/analytics-service/src/services/kpi.service.js | KPI calculation | ⬜ |
| services/analytics-service/src/repositories/analytics.repository.js | Analytics data | ⬜ |
| services/analytics-service/src/validators/events.validator.js | Event validation | ⬜ |

---

## 20. Worker-Specific File Checklist

### 20.1 Search Indexer Worker
| File | Description | Status |
|------|-------------|--------|
| workers/search-indexer/Dockerfile | Dockerfile | ⬜ |
| workers/search-indexer/package.json | Dependencies | ✅ |
| workers/search-indexer/jsconfig.json | JavaScript config | ✅ |
| workers/search-indexer/src/index.js | Entry point | ✅ |
| workers/search-indexer/src/config/index.js | Configuration | ✅ |
| workers/search-indexer/src/indexer.js | Indexing logic | ✅ |
| workers/search-indexer/src/services/elasticsearch.service.js | ES client | ✅ |

### 20.2 Media Processor Worker
| File | Description | Status |
|------|-------------|--------|
| workers/media-processor/Dockerfile | Dockerfile | ⬜ |
| workers/media-processor/package.json | Dependencies | ✅ |
| workers/media-processor/jsconfig.json | JavaScript config | ✅ |
| workers/media-processor/src/index.js | Entry point | ✅ |
| workers/media-processor/src/config/index.js | Configuration | ✅ |
| workers/media-processor/src/processor.js | Processing logic (includes image/video) | ✅ |

### 20.3 Notification Worker
| File | Description | Status |
|------|-------------|--------|
| workers/notification-worker/Dockerfile | Dockerfile | ⬜ |
| workers/notification-worker/package.json | Dependencies | ⬜ |
| workers/notification-worker/jsconfig.json | JavaScript config | ⬜ |
| workers/notification-worker/src/index.js | Entry point | ⬜ |
| workers/notification-worker/src/config/index.js | Configuration | ⬜ |
| workers/notification-worker/src/consumer.js | Kafka consumer | ⬜ |
| workers/notification-worker/src/dispatcher.js | Channel dispatcher | ⬜ |
| workers/notification-worker/src/channels/sms.channel.js | SMS provider | ⬜ |
| workers/notification-worker/src/channels/email.channel.js | Email provider | ⬜ |
| workers/notification-worker/src/channels/push.channel.js | Push provider | ⬜ |
| workers/notification-worker/src/channels/whatsapp.channel.js | WhatsApp provider | ⬜ |
| workers/notification-worker/src/template-renderer.js | Template rendering | ⬜ |

### 20.4 Scheduler Worker
| File | Description | Status |
|------|-------------|--------|
| workers/scheduler/Dockerfile | Dockerfile | ⬜ |
| workers/scheduler/package.json | Dependencies | ⬜ |
| workers/scheduler/jsconfig.json | JavaScript config | ⬜ |
| workers/scheduler/src/index.js | Entry point | ⬜ |
| workers/scheduler/src/config/index.js | Configuration | ⬜ |
| workers/scheduler/src/scheduler.js | Job scheduler | ⬜ |
| workers/scheduler/src/jobs/expire-listings.job.js | Listing expiration | ⬜ |
| workers/scheduler/src/jobs/subscription-renewal.job.js | Renewal reminders | ⬜ |
| workers/scheduler/src/jobs/saved-search-alerts.job.js | Search alerts | ⬜ |
| workers/scheduler/src/jobs/price-drop-alerts.job.js | Price alerts | ⬜ |
| workers/scheduler/src/jobs/cleanup.job.js | Data cleanup | ⬜ |
| workers/scheduler/src/jobs/metrics-aggregation.job.js | Metrics rollup | ⬜ |

---

## 21. Shared Package Files Checklist

### 21.1 @real-estate/common
| File | Description | Status |
|------|-------------|--------|
| packages/common/package.json | Package config | ⬜ |
| packages/common/jsconfig.json | JavaScript config | ⬜ |
| packages/common/src/index.js | Main export | ⬜ |
| packages/common/src/types/api.types.js | API response types (JSDoc) | ⬜ |
| packages/common/src/types/auth.types.js | Auth types (JSDoc) | ⬜ |
| packages/common/src/types/property.types.js | Property enums/types | ⬜ |
| packages/common/src/types/pagination.types.js | Pagination types (JSDoc) | ⬜ |
| packages/common/src/types/user.types.js | User types (JSDoc) | ⬜ |
| packages/common/src/types/org.types.js | Organization types (JSDoc) | ⬜ |
| packages/common/src/types/lead.types.js | Lead types (JSDoc) | ⬜ |
| packages/common/src/types/billing.types.js | Billing types (JSDoc) | ⬜ |
| packages/common/src/errors/app-error.js | Custom error class | ⬜ |
| packages/common/src/errors/error-codes.js | Error code constants | ⬜ |
| packages/common/src/errors/index.js | Error exports | ⬜ |
| packages/common/src/middleware/error-handler.js | Express error handler | ⬜ |
| packages/common/src/middleware/request-logger.js | Request logging | ⬜ |
| packages/common/src/middleware/trace-id.js | Trace ID injection | ⬜ |
| packages/common/src/middleware/validate.js | Joi/Zod validation | ⬜ |
| packages/common/src/middleware/auth.js | Auth middleware | ⬜ |
| packages/common/src/utils/crypto.js | Hashing utilities | ⬜ |
| packages/common/src/utils/date.js | Date utilities | ⬜ |
| packages/common/src/utils/slug.js | Slug generation | ⬜ |
| packages/common/src/utils/phone.js | Phone utilities | ⬜ |
| packages/common/src/utils/pagination.js | Cursor pagination | ⬜ |
| packages/common/src/utils/logger.js | Pino logger setup | ⬜ |
| packages/common/src/constants/http-status.js | HTTP status codes | ⬜ |
| packages/common/src/constants/regex.js | Common regex patterns | ⬜ |
| packages/common/src/constants/limits.js | Rate/size limits | ⬜ |

### 21.2 @real-estate/events
| File | Description | Status |
|------|-------------|--------|
| packages/events/package.json | Package config | ⬜ |
| packages/events/jsconfig.json | JavaScript config | ⬜ |
| packages/events/src/index.js | Main export | ⬜ |
| packages/events/src/types.js | Event types (JSDoc) | ⬜ |
| packages/events/src/producer.js | Kafka producer | ⬜ |
| packages/events/src/consumer.js | Kafka consumer | ⬜ |
| packages/events/src/kafka-client.js | Kafka client setup | ⬜ |
| packages/events/src/schemas/base.schema.js | Base event schema | ⬜ |
| packages/events/src/schemas/property.schema.js | Property events | ⬜ |
| packages/events/src/schemas/media.schema.js | Media events | ⬜ |
| packages/events/src/schemas/lead.schema.js | Lead events | ⬜ |
| packages/events/src/schemas/billing.schema.js | Billing events | ⬜ |
| packages/events/src/schemas/user.schema.js | User events | ⬜ |
| packages/events/src/schemas/moderation.schema.js | Moderation events | ⬜ |
| packages/events/src/schemas/notification.schema.js | Notification events | ⬜ |

### 21.3 @real-estate/db-models
| File | Description | Status |
|------|-------------|--------|
| packages/db-models/package.json | Package config | ⬜ |
| packages/db-models/jsconfig.json | JavaScript config | ⬜ |
| packages/db-models/src/index.js | Main export | ⬜ |
| packages/db-models/src/mongo/connection.js | MongoDB connection | ⬜ |
| packages/db-models/src/mongo/property.model.js | Property model | ⬜ |
| packages/db-models/src/mongo/project.model.js | Project model | ⬜ |
| packages/db-models/src/mongo/media.model.js | Media model | ⬜ |
| packages/db-models/src/mongo/property-version.model.js | Version model | ⬜ |
| packages/db-models/src/postgres/client.js | Prisma client | ⬜ |
| packages/db-models/src/postgres/prisma/schema.prisma | Prisma schema | ⬜ |

### 21.4 @real-estate/api-client
| File | Description | Status |
|------|-------------|--------|
| packages/api-client/package.json | Package config | ⬜ |
| packages/api-client/jsconfig.json | JavaScript config | ⬜ |
| packages/api-client/src/index.js | Main export | ⬜ |
| packages/api-client/src/base-client.js | Base HTTP client | ⬜ |
| packages/api-client/src/clients/user-client.js | User service client | ⬜ |
| packages/api-client/src/clients/property-client.js | Property service client | ⬜ |
| packages/api-client/src/clients/org-client.js | Org service client | ⬜ |
| packages/api-client/src/clients/media-client.js | Media service client | ⬜ |
| packages/api-client/src/clients/notification-client.js | Notification client | ⬜ |

---

## 22. Quick Reference - API Count Summary

| Service | Total Endpoints | Public | Auth Required | Admin Only |
|---------|-----------------|--------|---------------|------------|
| User Service | 14 | 6 | 8 | 0 |
| Organization Service | 18 | 0 | 14 | 4 |
| Property Service | 24 | 2 | 20 | 2 |
| Search Service | 10 | 7 | 0 | 3 |
| Media Service | 8 | 0 | 5 | 3 |
| Lead Service | 14 | 0 | 14 | 0 |
| Moderation Service | 12 | 0 | 0 | 12 |
| Billing Service | 18 | 2 | 13 | 3 |
| Notification Service | 10 | 0 | 5 | 5 |
| Geo Service | 16 | 10 | 0 | 6 |
| User Interactions | 12 | 0 | 12 | 0 |
| Analytics Service | 6 | 0 | 2 | 4 |
| System APIs | 5 | 3 | 0 | 2 |
| **TOTAL** | **167** | **30** | **93** | **44** |

---

## 23. Database Summary

| Database | Collections/Tables | Primary Use |
|----------|-------------------|-------------|
| PostgreSQL | 25+ tables | Users, Orgs, Leads, Billing, Notifications, Geo, Admin |
| MongoDB | 4 collections | Properties, Projects, Media, Versions |
| Elasticsearch | 1 index | Property search |
| Redis | N/A | Cache, Sessions, Rate limiting, OTP storage |

---

## 24. Quick Start Commands

```bash
# ============================================
# DEVELOPMENT SETUP
# ============================================

# 1. Clone and install
git clone <repo-url>
cd real-estate-platform
pnpm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your values

# 3. Start infrastructure only
pnpm run docker:infra

# 4. Wait for services to be healthy
pnpm run docker:wait

# 5. Run migrations
pnpm run migrate

# 6. Seed data
pnpm run seed

# 7. Start all services in dev mode
pnpm run dev

# ============================================
# INDIVIDUAL SERVICE DEVELOPMENT
# ============================================

# Start only user-service
pnpm run dev --filter=user-service

# Run tests for property-service
pnpm run test --filter=property-service

# Lint all code
pnpm run lint

# ============================================
# DOCKER COMMANDS
# ============================================

# Start everything (infra + services)
pnpm run docker:up

# Stop everything
pnpm run docker:down

# View logs
pnpm run docker:logs

# Rebuild services
pnpm run docker:rebuild

# ============================================
# DATABASE COMMANDS
# ============================================

# Run Prisma migrations
pnpm run migrate

# Generate Prisma client
pnpm run prisma:generate

# Reset database (CAUTION: destroys all data)
pnpm run db:reset

# Seed database
pnpm run seed

# Open Prisma Studio
pnpm run prisma:studio

# ============================================
# TESTING COMMANDS
# ============================================

# Run all tests
pnpm run test

# Run unit tests only
pnpm run test:unit

# Run integration tests
pnpm run test:integration

# Run tests with coverage
pnpm run test:coverage

# Run tests in watch mode
pnpm run test:watch

# ============================================
# LINTING & FORMATTING
# ============================================

# Lint all code
pnpm run lint

# Fix linting issues
pnpm run lint:fix

# Format code
pnpm run format

# Check for issues
pnpm run lint && pnpm run test
```

---

## 25. Health Check Endpoints

| Service | Health URL | Ready URL |
|---------|------------|-----------|
| API Gateway | http://localhost:3000/health | http://localhost:3000/ready |
| User Service | http://localhost:3001/health | http://localhost:3001/ready |
| Org Service | http://localhost:3002/health | http://localhost:3002/ready |
| Property Service | http://localhost:3003/health | http://localhost:3003/ready |
| Search Service | http://localhost:3004/health | http://localhost:3004/ready |
| Media Service | http://localhost:3005/health | http://localhost:3005/ready |
| Lead Service | http://localhost:3006/health | http://localhost:3006/ready |
| Moderation Service | http://localhost:3007/health | http://localhost:3007/ready |
| Billing Service | http://localhost:3008/health | http://localhost:3008/ready |
| Notification Service | http://localhost:3009/health | http://localhost:3009/ready |
| Geo Service | http://localhost:3010/health | http://localhost:3010/ready |
| Analytics Service | http://localhost:3011/health | http://localhost:3011/ready |

---

## 26. Development Tools URLs

| Tool | URL | Credentials |
|------|-----|-------------|
| Traefik Dashboard | http://localhost:8080 | - |
| Kafka UI | http://localhost:8081 | - |
| Mongo Express | http://localhost:8082 | admin / MONGO_PASSWORD |
| Redis Commander | http://localhost:8083 | - |
| pgAdmin | http://localhost:8084 | admin@local.dev / admin |
| Kibana | http://localhost:5601 | - |
| MinIO Console | http://localhost:9001 | S3_ACCESS_KEY / S3_SECRET_KEY |
| Mailhog | http://localhost:8025 | - |
| Prometheus | http://localhost:9090 | - |
| Grafana | http://localhost:3100 | admin / admin |
| Jaeger | http://localhost:16686 | - |

---

## 27. Key Business Flows

### 27.1 User Registration Flow
```
1. User enters phone number
2. System sends OTP (rate limited: 5/hour)
3. User verifies OTP
4. System creates user record
5. System issues JWT access + refresh tokens
6. User completes profile (optional)
7. Event: user.registered
```

### 27.2 Property Listing Flow
```
1. Agent/Owner creates draft property
2. Uploads media (presigned URLs → S3)
3. Media processor generates derivatives
4. User submits property for review
5. Auto-moderation scores the listing
6. If score >= 80: auto-approve
7. Else: goes to manual review queue
8. Moderator approves/rejects/requests changes
9. On approval: status → PUBLISHED
10. Event: property.published
11. Search indexer updates Elasticsearch
12. Listing appears in search results
```

### 27.3 Lead/Inquiry Flow
```
1. Buyer views property
2. Buyer clicks "Contact" / "Inquire"
3. System creates lead record
4. Event: lead.created
5. Notification sent to seller/agent
6. Lead appears in seller's dashboard
7. Seller updates lead status
8. Optional: Schedule site visit
9. Lead progresses through pipeline
10. Final: Converted / Lost
```

### 27.4 Premium Subscription Flow
```
1. User views packages
2. User selects package + applies coupon
3. System creates payment order (Razorpay)
4. User completes payment on gateway
5. Razorpay webhook → payment.completed
6. System activates subscription
7. System updates user's premium tier
8. Property boost applied (if applicable)
9. Event: subscription.activated
```

### 27.5 Search Flow
```
1. User enters search query + filters
2. API Gateway routes to Search Service
3. Search Service builds ES query
4. Premium listings boosted in ranking
5. Results returned with pagination cursor
6. Frontend displays results
7. User clicks property → Property Service
8. View counted, event tracked
```

---

## 28. Error Codes Reference

### 28.1 Authentication Errors (1xxx)
| Code | Message |
|------|---------|
| 1001 | OTP_EXPIRED |
| 1002 | OTP_INVALID |
| 1003 | OTP_MAX_ATTEMPTS |
| 1004 | OTP_RATE_LIMITED |
| 1005 | TOKEN_EXPIRED |
| 1006 | TOKEN_INVALID |
| 1007 | SESSION_EXPIRED |
| 1008 | SESSION_REVOKED |
| 1009 | INVALID_CREDENTIALS |
| 1010 | ACCOUNT_BLOCKED |
| 1011 | ACCOUNT_NOT_VERIFIED |

### 28.2 Authorization Errors (2xxx)
| Code | Message |
|------|---------|
| 2001 | FORBIDDEN |
| 2002 | INSUFFICIENT_PERMISSIONS |
| 2003 | RESOURCE_NOT_OWNED |
| 2004 | ORG_ACCESS_DENIED |
| 2005 | ADMIN_REQUIRED |

### 28.3 Validation Errors (3xxx)
| Code | Message |
|------|---------|
| 3001 | VALIDATION_ERROR |
| 3002 | INVALID_PHONE |
| 3003 | INVALID_EMAIL |
| 3004 | INVALID_FILE_TYPE |
| 3005 | FILE_TOO_LARGE |
| 3006 | MISSING_REQUIRED_FIELD |
| 3007 | INVALID_PRICE |
| 3008 | INVALID_LOCATION |

### 28.4 Resource Errors (4xxx)
| Code | Message |
|------|---------|
| 4001 | NOT_FOUND |
| 4002 | PROPERTY_NOT_FOUND |
| 4003 | USER_NOT_FOUND |
| 4004 | ORG_NOT_FOUND |
| 4005 | LEAD_NOT_FOUND |
| 4006 | MEDIA_NOT_FOUND |
| 4007 | PACKAGE_NOT_FOUND |
| 4008 | SUBSCRIPTION_NOT_FOUND |
| 4009 | ALREADY_EXISTS |
| 4010 | DUPLICATE_ENTRY |

### 28.5 Business Logic Errors (5xxx)
| Code | Message |
|------|---------|
| 5001 | INVALID_STATE_TRANSITION |
| 5002 | PROPERTY_NOT_DRAFT |
| 5003 | PROPERTY_ALREADY_PUBLISHED |
| 5004 | MODERATION_PENDING |
| 5005 | SUBSCRIPTION_EXPIRED |
| 5006 | LISTING_LIMIT_REACHED |
| 5007 | PAYMENT_FAILED |
| 5008 | COUPON_INVALID |
| 5009 | COUPON_EXPIRED |
| 5010 | KYC_PENDING |
| 5011 | ORG_NOT_VERIFIED |

### 28.6 System Errors (9xxx)
| Code | Message |
|------|---------|
| 9001 | INTERNAL_ERROR |
| 9002 | SERVICE_UNAVAILABLE |
| 9003 | DATABASE_ERROR |
| 9004 | CACHE_ERROR |
| 9005 | EXTERNAL_SERVICE_ERROR |
| 9006 | RATE_LIMIT_EXCEEDED |

---

## 29. Configuration Constants

### 29.1 Rate Limits
| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Auth (OTP) | 5 requests | 1 hour |
| Auth (Login) | 10 requests | 15 minutes |
| Search | 300 requests | 1 minute |
| Property Create | 50 requests | 1 hour |
| Lead Create | 10 requests | 1 hour |
| Media Upload | 100 requests | 1 hour |
| General API | 100 requests | 1 minute |

### 29.2 File Upload Limits
| Type | Max Size | Allowed Formats |
|------|----------|-----------------|
| Property Image | 10 MB | jpg, jpeg, png, webp |
| Property Video | 100 MB | mp4, webm |
| Floor Plan | 5 MB | jpg, png, pdf |
| Document | 10 MB | pdf, jpg, png |
| Logo | 2 MB | jpg, png, svg |
| Brochure | 20 MB | pdf |

### 29.3 Pagination Defaults
| Parameter | Default | Max |
|-----------|---------|-----|
| limit | 20 | 100 |
| Search results | 20 | 50 |
| Admin lists | 50 | 200 |

### 29.4 Cache TTLs
| Cache Type | TTL |
|------------|-----|
| Property Detail | 5 minutes |
| Search Filters | 24 hours |
| Geo Data | 24 hours |
| User Session | 15 minutes |
| Rate Limit Counter | 1-60 minutes |

---

## 30. Glossary

| Term | Definition |
|------|------------|
| **Property** | A real estate listing (apartment, house, plot, etc.) |
| **Project** | A builder's development with multiple units |
| **Unit** | An individual property within a project |
| **Lead** | A buyer inquiry on a property |
| **Shortlist** | User's saved/favorited properties |
| **Boost** | Temporary premium visibility for a listing |
| **Tier** | Premium level (NONE, FEATURED, PREMIUM, SPOTLIGHT) |
| **KYC** | Know Your Customer - verification documents |
| **RERA** | Real Estate Regulatory Authority (India) |
| **Locality** | Neighborhood/area within a city |
| **POI** | Point of Interest (schools, hospitals, etc.) |
| **Moderation** | Review process for listings |
| **Auto-mod** | Automated moderation scoring |

---

## 31. Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | Jan 15, 2026 | Initial complete plan | AI Assistant |

---

## 32. Next Steps (Implementation Order)

When you're ready to start building, follow this sequence:

### Immediate (Start Here) ✅ COMPLETED
1. ✅ Create root project files (package.json, tsconfig, etc.)
2. ✅ Set up Docker Compose infrastructure
3. ✅ Create shared packages structure
4. ✅ Implement @real-estate/common package

### Week 1-2: Foundation ✅ COMPLETED
5. ✅ Implement User Service (auth + profile)
6. ✅ Implement API Gateway with JWT verification
7. ⬜ Test auth flow end-to-end

### Week 3: Organizations ✅ COMPLETED
8. ✅ Implement Organization Service
9. ✅ Add KYC workflow
10. ⬜ Test org creation and verification

### Week 4-5: Properties ✅ COMPLETED
11. ✅ Implement Property Service (CRUD)
12. ✅ Implement Media Service
13. ✅ Implement Media Processor Worker
14. ⬜ Test property creation with images

### Week 6: Moderation ✅ COMPLETED
15. ✅ Implement Moderation Service
16. ✅ Connect property → moderation workflow
17. ⬜ Test full listing lifecycle

### Week 7-8: Search ✅ COMPLETED
18. ✅ Implement Search Service
19. ✅ Implement Search Indexer Worker
20. ✅ Implement Geo Service
21. ⬜ Test search functionality

### Week 9-10: Leads & Billing ✅ COMPLETED
22. ✅ Implement Lead Service
23. ✅ Implement Billing Service
24. ✅ Integrate Razorpay
25. ⬜ Test payment flow

### Week 11-12: Notifications & Polish
26. ✅ Implement Notification Service
27. ✅ Implement Notification Worker
28. ⬜ Add monitoring & observability
29. ⬜ Load testing
30. ⬜ Documentation

---

**🎯 Ready to begin? Say "Start Phase 1" to begin generating the codebase!**