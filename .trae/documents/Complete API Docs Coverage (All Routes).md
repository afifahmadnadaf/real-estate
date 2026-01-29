## Goal
Produce a complete, authoritative list of **every API route that exists in code but is missing from `docs/*.md`**, including:
- HTTP method
- Full gateway path
- Owning service
- Purpose/short description
- Auth requirement (public / optional / required / admin)

## Scope
- All backend services under `services/*` (including internal routes)
- API gateway (`services/api-gateway`) as the source of “full gateway path” + rewrite rules
- Workers under `workers/*` (confirm whether they expose any HTTP routes; include if they do)

## How I’ll Build the Route Inventory (from code)
1. **Discover mount points per service**
   - Read each `services/*/src/app.js` and collect `app.use('/prefix', router)` mounts.
   - Also collect operational routes: `app.get('/health')`, `/ready`, `/metrics`.
2. **Extract routes from routers**
   - For every `services/*/src/routes/**/*.js`, extract `router.get/post/patch/delete` paths.
   - Combine with the mount prefix to form service-local paths (e.g., `/v1/projects/:id`).
3. **Map to gateway paths**
   - Parse `services/api-gateway/src/routes/index.js` for every `router.use('/X', proxy(...))`.
   - Apply `pathRewrite` rules to compute the **actual gateway-exposed path** (e.g., `/v1/admin/search/*` vs `/v1/search/admin/*`).
   - Mark any route not exposed by gateway (should be none, but verify).
4. **Determine auth requirement**
   - Gateway: detect `authMiddleware`, `optionalAuth`, `adminOnly` (or similar) applied per route.
   - Service routers: detect `router.use(authenticate)` or route-level `authenticate`.
   - Internal: detect `internalAuth` and mark as internal-only.

## How I’ll Find “Missing From Docs”
5. **Scan `docs/*.md`**
   - Build a normalized matcher that treats `{param}` and `:param` as the same concept.
   - Consider both gateway-facing paths and service-facing aliases where the docs explain rewrites.
6. **Diff: Code routes vs Docs mentions**
   - Anything in code that is not mentioned in any doc becomes “missing from docs”.

## Deliverables
7. **A single authoritative report file**
   - Create `docs/ENDPOINTS_MISSING_FROM_DOCS.md` with a table:
     - Method | Gateway Path | Service | Purpose | Auth
   - Grouped by service (User/Auth, Org, Property/Projects, Media, Search, Leads, Billing, Notifications, Moderation, Admin, Internal).
8. **(Optional but recommended) Update the service API docs**
   - For each missing endpoint, add it to the correct `docs/<service>-api.md` in the existing format (headers, params, body, responses).
   - Re-run the diff so the missing list becomes empty (except endpoints you intentionally decide not to document).

## Verification
9. Re-run the inventory + doc-diff after updates and ensure:
   - 0 missing (or a clearly justified allowlist for truly internal/ops routes).
   - No endpoints are duplicated under conflicting paths.

If you confirm, I will start by generating the full route inventory from the gateway + all services, then produce the missing-from-docs report, then update the docs until the report is clean.