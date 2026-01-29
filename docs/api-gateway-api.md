## API Gateway API Contract (`api-gateway`)

**Base URL**: `/`  
**Public API base prefix**: `/v1`  
**Internal base prefix**: `/internal/v1`  

---

## 1. Internal Cache Invalidation (`/internal/v1/cache/invalidate`)

Internal-only endpoint hosted by the gateway (used for cache busting).

### 1.1 `POST /internal/v1/cache/invalidate`
- **Auth**: internal (`internalAuth`).
- **Headers**:
  - `X-Internal-Token: <INTERNAL_API_TOKEN>` (required)
  - `Content-Type: application/json`
- **Body**:
  - `keys` (string[], optional): explicit cache keys to delete
  - `patterns` (string[], optional): glob-like patterns for `SCAN` + delete
- **Response**:
  - `200 { invalidated: number }`

