# Endpoint Gap Report

- Spec endpoints: 320
- Implemented endpoints (code): 402
- Missing from code: 9
- Extra in code (not in spec): 48
- Implemented but not exposed via gateway: 0

## Missing From Code

- GET /v1/admin/media/failed
- GET /v1/admin/search/index/health
- GET /v1/admin/search/reindex/{param}
- PATCH /v1/admin/geo/cities/{param}
- PATCH /v1/admin/geo/localities/{param}
- POST /v1/admin/geo/cities
- POST /v1/admin/geo/localities
- POST /v1/admin/media/{param}/override
- POST /v1/admin/search/reindex

## Implemented But Not Exposed Via Gateway

- None

## Extra In Code

- DELETE /v1/admin/content/seo/{param}
- DELETE /v1/admin/meta/{param}/{param}
- DELETE /v1/media/{param}/usage
- DELETE /v1/packages/admin/{param}
- GET /redis
- GET /v1/admin/content/seo
- GET /v1/admin/feature-flags/{param}
- GET /v1/admin/fraud/score
- GET /v1/admin/meta/{param}
- GET /v1/admin/moderation/blacklist
- GET /v1/admin/orgs
- GET /v1/admin/orgs/{param}
- GET /v1/admin/system/stats
- GET /v1/experiments/{param}/assignment
- GET /v1/media
- GET /v1/media/admin/failed
- GET /v1/notifications/{param}
- GET /v1/orgs/{param}/teams/{param}
- GET /v1/properties/me/list
- GET /v1/search/admin/index/health
- GET /v1/search/admin/reindex/{param}
- PATCH /v1/admin/meta/{param}/{param}
- PATCH /v1/admin/orgs/{param}
- PATCH /v1/geo/admin/cities/{param}
- PATCH /v1/geo/admin/localities/{param}
- PATCH /v1/geo/admin/pois/{param}
- PATCH /v1/packages/admin/{param}
- POST /internal/v1/config
- POST /v1/admin/content/seo
- POST /v1/admin/internal/permissions/check
- POST /v1/admin/meta/{param}
- POST /v1/admin/orgs
- POST /v1/admin/orgs/{param}/logo
- POST /v1/admin/roles/assign
- POST /v1/admin/roles/revoke
- POST /v1/coupons/validate
- POST /v1/experiments/{param}/exposures
- POST /v1/geo/admin/cities
- POST /v1/geo/admin/localities
- POST /v1/geo/admin/pois
- POST /v1/media/admin/{param}/override
- POST /v1/media/admin/{param}/reprocess
- POST /v1/media/{param}/usage
- POST /v1/orgs/{param}/verification/approve
- POST /v1/orgs/{param}/verification/reject
- POST /v1/orgs/{param}/verification/request-changes
- POST /v1/packages/admin
- POST /v1/search/admin/reindex
