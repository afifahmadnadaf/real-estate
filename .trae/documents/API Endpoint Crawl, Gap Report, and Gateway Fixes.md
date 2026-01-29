## Where “Projects” Routes Live
- Property service exposes builder projects at [project.routes.js](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/services/property-service/src/routes/project.routes.js) (mounted as `/v1/projects` in property-service app).
- API Gateway currently does **not** proxy `/v1/projects` at all (gateway routes file: [index.js](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/services/api-gateway/src/routes/index.js)).

## Critical Coverage Gaps vs Spec (v1.1)
### Missing/Blocked in API Gateway (clients can’t reach them via /v1)
- `/v1/projects/*` (spec section 8) not proxied to property-service.
- `/v1/reports/*` and `/v1/reviews/*` (spec section 13) not proxied to moderation-service.
- `/v1/content/*`, `/v1/seo/*`, `/v1/meta/*`, `/v1/experiments/*` (spec sections 17–20) not proxied to admin-service.
- `POST/PATCH/DELETE /v1/packages` (spec section 14) not reachable because gateway only defines GET handlers for packages ([index.js](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/services/api-gateway/src/routes/index.js#L139-L143)).
- `GET /v1/properties` is **blocked by gateway auth** even though property-service exposes it publicly (gateway uses `authMiddleware()` for `/properties` [index.js](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/services/api-gateway/src/routes/index.js#L95-L101); property-service has public `GET /` [property.routes.js](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/services/property-service/src/routes/property.routes.js#L22-L25)).
- `GET /v1/media/{id}` and `/renditions` are blocked by gateway auth even though media-service exposes them publicly ([media.routes.js](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/services/media-service/src/routes/media.routes.js#L18-L23)).

### Admin Routing Bugs in Gateway
- `/v1/admin/users/{userId}/roles*` should go to **admin-service** (implemented in [admin.routes.js](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/services/admin-service/src/routes/admin.routes.js#L14-L26)), but gateway’s `/admin` dispatcher routes `/users` to **user-service** ([index.js](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/services/api-gateway/src/routes/index.js#L301-L303)).
- `/v1/admin/reports*`, `/v1/admin/reviews*`, `/v1/admin/fraud*`, `/v1/admin/webhooks*` from the spec are not routed by the gateway admin dispatcher and will hit the default 404.

### Missing in Services (Spec Endpoints Not Implemented)
- Property “projects” are missing several spec endpoints:
  - No `/v1/projects/{projectId}/media` attach/reorder/detach and no `/brochure` in [project.routes.js](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/services/property-service/src/routes/project.routes.js).
- Moderation “reviews” missing update/delete:
  - Spec has `PATCH/DELETE /v1/reviews/{reviewId}`, but [review.routes.js](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/services/moderation-service/src/routes/review.routes.js) only supports create/list/get.
- Fraud endpoints incomplete:
  - Spec has `POST /v1/admin/fraud/score/recompute`, but moderation-service fraud routes only have `GET /signals` and `GET /score` ([fraud.routes.js](file:///c:/Users/retec/Desktop/EXPER/STAT_ARTIFACT_real_estate/services/moderation-service/src/routes/fraud.routes.js)).
- Blacklist missing `GET /v1/admin/blacklist/{entryId}`.
- Spec endpoints with **no implementation anywhere in /services** (true missing features):
  - `/v1/admin/bulk/*` (import/export/jobs)
  - `/v1/support/tickets*`
  - `/v1/admin/rate-limits`
  - `/v1/admin/bot/blocked`
  - `/v1/webhooks/shiprocket` (optional in spec)

## Go / No-Go For Production (API Coverage)
- **NO-GO** if you require the gateway to match the endpoint spec: multiple spec endpoints are unreachable at the gateway, some are misrouted, and some don’t exist in any service.

## What I Will Do Next (After You Confirm)
1. Generate an authoritative endpoint inventory by parsing all `services/**/src/app.js` mount points + `services/**/src/routes/**/*.js` HTTP verbs.
2. Parse `Real_Estate_All_API_Endpoints_v1_1.md` into a normalized list of (method, path).
3. Produce a gap report: 
   - Spec-only (missing), Code-only (extra), and “implemented but not exposed via gateway”.
4. Fix API gateway routing so all implemented endpoints are exposed correctly:
   - Add `/projects`, `/reports`, `/reviews`, `/content`, `/seo`, `/meta`, `/experiments` proxies.
   - Make `/properties` and `/media` public GETs align with service/spec.
   - Fix `/admin/users/*/roles` routing and add missing admin dispatch branches.
   - Replace `GET /packages`-only with `router.use('/packages', optionalAuth(), proxy…)` while preserving public access.
5. Implement missing service endpoints that are intended to exist (projects media/brochure, reviews patch/delete, fraud recompute, blacklist get-by-id), or explicitly mark them “not supported” if out of scope.
6. Add/extend automated tests (route-level) to prevent future endpoint regressions.

If you confirm, I’ll start by generating the full diff report and then apply the gateway + service changes to eliminate the missing endpoints.