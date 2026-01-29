# API Endpoints Specification — Real Estate Platform (Housing/99acres-like)

**Version 1.1 | REST API (Public + Partner + Admin + Internal)**  
**Date:** 18 Dec 2025

---

## 0. API Conventions

- Base URL: https://api.example.com
- Versioning: /v1 (breaking changes → /v2).
- Auth: Bearer JWT access token; refresh token rotation via /auth/refresh.
- Idempotency: POST/PUT that create resources accept Idempotency-Key header.
- Pagination: cursor-based (cursor, limit).
- Standard query params: sort, order, fields, include, locale.
- Standard headers: X-Request-Id, X-Client-Version, X-Device-Id.
- Rate limits: per IP + per user token; 429 with Retry-After.
- Error contract: { error: { code, message, details, traceId } }

## 1. Authentication & Sessions

- `POST   /v1/auth/otp/request — Request OTP to phone/email`
- `POST   /v1/auth/otp/verify — Verify OTP and issue tokens`
- `POST   /v1/auth/password/login — Password login (optional)`
- `POST   /v1/auth/password/reset/request — Request password reset`
- `POST   /v1/auth/password/reset/confirm — Confirm password reset`
- `POST   /v1/auth/refresh — Rotate refresh token and issue new access token`
- `POST   /v1/auth/logout — Invalidate current session`
- `GET    /v1/auth/sessions — List active sessions`
- `DELETE /v1/auth/sessions/{sessionId} — Revoke a session`
- `GET    /v1/auth/public-keys — JWKS / token verification keys`
- `POST   /v1/auth/mfa/enable — Enable MFA (if enabled)`
- `POST   /v1/auth/mfa/verify — Verify MFA`
- `POST   /v1/auth/mfa/disable — Disable MFA`

## 2. Users, Preferences & Compliance

- `GET    /v1/users/me — Get my profile`
- `PATCH  /v1/users/me — Update my profile`
- `GET    /v1/users/me/preferences — Get preferences`
- `PATCH  /v1/users/me/preferences — Update preferences`
- `GET    /v1/users/me/consents — Get consent state`
- `PATCH  /v1/users/me/consents — Update consents`
- `GET    /v1/users/me/security — Security settings`
- `PATCH  /v1/users/me/security — Update security settings`
- `GET    /v1/users/me/activity — Recent activity`
- `POST   /v1/users/me/deactivate — Deactivate account`
- `POST   /v1/users/me/delete/request — Request account deletion`
- `POST   /v1/users/me/delete/confirm — Confirm deletion`
- `GET    /v1/users/me/export — Export my data`
- `POST   /v1/users/me/verify-email — Verify email`
- `POST   /v1/users/me/verify-phone — Verify phone`
- `GET    /v1/users/{userId} — Get public user profile (admin/agent context)`
- `GET    /v1/users — Search users (admin)`
- `PATCH  /v1/users/{userId} — Update user (admin)`
- `POST   /v1/users/{userId}/block — Block user (admin)`
- `POST   /v1/users/{userId}/unblock — Unblock user (admin)`

## 3. Admin RBAC

- `GET    /v1/admin/roles — List roles`
- `POST   /v1/admin/roles — Create role`
- `GET    /v1/admin/roles/{roleId} — Get role`
- `PATCH  /v1/admin/roles/{roleId} — Update role`
- `DELETE /v1/admin/roles/{roleId} — Delete role`
- `GET    /v1/admin/permissions — List permissions`
- `POST   /v1/admin/users/{userId}/roles — Assign roles`
- `GET    /v1/admin/users/{userId}/roles — Get user roles`
- `DELETE /v1/admin/users/{userId}/roles/{roleId} — Remove role`

## 4. Organizations (Agents/Builders)

- `POST   /v1/orgs — Create organization (Agent firm/Builder)`
- `GET    /v1/orgs — List orgs (admin or my orgs)`
- `GET    /v1/orgs/{orgId} — Get org profile`
- `PATCH  /v1/orgs/{orgId} — Update org profile`
- `POST   /v1/orgs/{orgId}/logo — Upload org logo`
- `GET    /v1/orgs/{orgId}/members — List members`
- `POST   /v1/orgs/{orgId}/members — Invite/add member`
- `GET    /v1/orgs/{orgId}/members/{memberId} — Get member`
- `PATCH  /v1/orgs/{orgId}/members/{memberId} — Update member role/status`
- `DELETE /v1/orgs/{orgId}/members/{memberId} — Remove member`
- `POST   /v1/orgs/{orgId}/members/{memberId}/resend-invite — Resend invite`
- `GET    /v1/orgs/{orgId}/teams — List teams (optional)`
- `POST   /v1/orgs/{orgId}/teams — Create team`
- `PATCH  /v1/orgs/{orgId}/teams/{teamId} — Update team`
- `DELETE /v1/orgs/{orgId}/teams/{teamId} — Delete team`

## 5. KYC & Verification

- `POST   /v1/orgs/{orgId}/kyc — Submit KYC documents`
- `GET    /v1/orgs/{orgId}/kyc — List KYC docs`
- `GET    /v1/orgs/{orgId}/kyc/{kycId} — Get KYC doc`
- `PATCH  /v1/orgs/{orgId}/kyc/{kycId} — Update/replace KYC doc`
- `POST   /v1/orgs/{orgId}/kyc/{kycId}/withdraw — Withdraw KYC doc`
- `GET    /v1/orgs/{orgId}/verification/status — Verification status`
- `POST   /v1/admin/orgs/{orgId}/verification/approve — Approve org verification`
- `POST   /v1/admin/orgs/{orgId}/verification/reject — Reject org verification`
- `POST   /v1/admin/orgs/{orgId}/verification/request-changes — Request changes`

## 6. Media Service

- `POST   /v1/media/presign — Get pre-signed upload URL`
- `POST   /v1/media/complete — Mark upload complete / create media record`
- `GET    /v1/media/{mediaId} — Get media metadata`
- `GET    /v1/media/{mediaId}/renditions — Get renditions (thumb/webp/etc.)`
- `DELETE /v1/media/{mediaId} — Delete media`
- `POST   /v1/media/{mediaId}/reprocess — Reprocess media (admin)`
- `GET    /v1/admin/media/failed — List failed processing jobs`
- `POST   /v1/admin/media/{mediaId}/override — Override moderation (admin)`

## 7. Listings / Property Service

- `POST   /v1/properties — Create property (draft)`
- `GET    /v1/properties/{propertyId} — Get property detail`
- `PATCH  /v1/properties/{propertyId} — Update property (draft or editable states)`
- `DELETE /v1/properties/{propertyId} — Delete property (owner/admin)`
- `POST   /v1/properties/{propertyId}/submit — Submit for moderation`
- `POST   /v1/properties/{propertyId}/resubmit — Resubmit after changes`
- `POST   /v1/properties/{propertyId}/publish — Publish (admin/auto)`
- `POST   /v1/properties/{propertyId}/unpublish — Unpublish (admin/owner)`
- `POST   /v1/properties/{propertyId}/expire — Expire listing`
- `POST   /v1/properties/{propertyId}/archive — Archive listing`
- `POST   /v1/properties/{propertyId}/restore — Restore archived listing`
- `GET    /v1/properties — List/search properties (non-ES, owner/admin views)`
- `GET    /v1/properties/{propertyId}/versions — List change history versions`
- `GET    /v1/properties/{propertyId}/audit — Get audit details`
- `POST   /v1/properties/{propertyId}/media — Attach media to property`
- `PATCH  /v1/properties/{propertyId}/media/order — Reorder media`
- `DELETE /v1/properties/{propertyId}/media/{mediaId} — Detach media`
- `POST   /v1/properties/{propertyId}/documents — Attach docs (RERA/ownership proof)`
- `DELETE /v1/properties/{propertyId}/documents/{docId} — Remove doc`
- `POST   /v1/properties/{propertyId}/mark-sold — Mark as sold`
- `POST   /v1/properties/{propertyId}/mark-rented — Mark as rented`
- `POST   /v1/properties/{propertyId}/refresh — Refresh listing (bump)`
- `POST   /v1/properties/{propertyId}/duplicate/check — Run duplicate check`
- `GET    /v1/properties/{propertyId}/similar — Similar listings`
- `POST   /v1/properties/batch — Batch fetch property details by IDs`
- `GET    /v1/properties/{propertyId}/contact-options — Get contact options (masked numbers etc.)`

## 8. Builder Projects & Inventory

- `POST   /v1/projects — Create builder project`
- `GET    /v1/projects — List projects`
- `GET    /v1/projects/{projectId} — Get project detail`
- `PATCH  /v1/projects/{projectId} — Update project`
- `DELETE /v1/projects/{projectId} — Delete project`
- `POST   /v1/projects/{projectId}/submit — Submit project for moderation`
- `POST   /v1/projects/{projectId}/publish — Publish project (admin)`
- `POST   /v1/projects/{projectId}/media — Attach media`
- `PATCH  /v1/projects/{projectId}/media/order — Reorder media`
- `DELETE /v1/projects/{projectId}/media/{mediaId} — Detach media`
- `POST   /v1/projects/{projectId}/brochure — Upload brochure`
- `POST   /v1/projects/{projectId}/inventory/units — Create inventory unit`
- `GET    /v1/projects/{projectId}/inventory/units — List inventory units`
- `GET    /v1/projects/{projectId}/inventory/units/{unitId} — Get unit`
- `PATCH  /v1/projects/{projectId}/inventory/units/{unitId} — Update unit`
- `DELETE /v1/projects/{projectId}/inventory/units/{unitId} — Delete unit`
- `POST   /v1/projects/{projectId}/inventory/import — Bulk import units (CSV)`
- `GET    /v1/projects/{projectId}/inventory/import/{jobId} — Import job status`

## 9. Search Service

- `GET    /v1/search/properties — Full search (text + filters)`
- `GET    /v1/search/map — Map search (bbox + clusters)`
- `GET    /v1/search/suggest — Autocomplete suggestions`
- `GET    /v1/search/filters — Filter metadata for UI`
- `GET    /v1/search/trending — Trending searches`
- `GET    /v1/search/recent — User recent searches`
- `DELETE /v1/search/recent — Clear recent`
- `POST   /v1/admin/search/reindex — Trigger reindex (admin)`
- `GET    /v1/admin/search/reindex/{taskId} — Reindex status`
- `GET    /v1/admin/search/index/health — Index health`

## 10. Geo & Location Service

- `GET    /v1/geo/countries — List countries`
- `GET    /v1/geo/states — List states`
- `GET    /v1/geo/cities — List cities`
- `GET    /v1/geo/cities/{cityId} — Get city`
- `GET    /v1/geo/localities — List localities`
- `GET    /v1/geo/localities/{localityId} — Get locality`
- `GET    /v1/geo/localities/{localityId}/polygon — Locality boundary polygon`
- `GET    /v1/geo/pois — Points of interest list`
- `GET    /v1/geo/pois/{poiId} — Get POI`
- `GET    /v1/geo/geocode — Forward geocode (address → lat/lng)`
- `GET    /v1/geo/reverse-geocode — Reverse geocode`
- `GET    /v1/geo/nearby — Nearby POIs for point`
- `GET    /v1/geo/clusters — Server-side clusters (optional)`
- `POST   /v1/admin/geo/cities — Create city (admin)`
- `PATCH  /v1/admin/geo/cities/{cityId} — Update city (admin)`
- `POST   /v1/admin/geo/localities — Create locality (admin)`
- `PATCH  /v1/admin/geo/localities/{localityId} — Update locality (admin)`

## 11. User Interactions (Shortlist, Saved Search, Alerts)

- `GET    /v1/shortlists — List my shortlisted properties`
- `POST   /v1/shortlists — Add to shortlist`
- `DELETE /v1/shortlists/{shortlistId} — Remove from shortlist`
- `POST   /v1/shortlists/bulk — Bulk add/remove`
- `GET    /v1/saved-searches — List saved searches`
- `POST   /v1/saved-searches — Create saved search`
- `GET    /v1/saved-searches/{savedSearchId} — Get saved search`
- `PATCH  /v1/saved-searches/{savedSearchId} — Update saved search`
- `DELETE /v1/saved-searches/{savedSearchId} — Delete saved search`
- `POST   /v1/alerts/price — Create price alert`
- `GET    /v1/alerts/price — List price alerts`
- `PATCH  /v1/alerts/price/{alertId} — Update alert`
- `DELETE /v1/alerts/price/{alertId} — Delete alert`

## 12. Leads / Inquiries / Appointments

- `POST   /v1/leads — Create lead (contact seller/agent)`
- `GET    /v1/leads — List leads (role-based: buyer/agent/admin)`
- `GET    /v1/leads/{leadId} — Get lead detail`
- `PATCH  /v1/leads/{leadId} — Update lead status`
- `POST   /v1/leads/{leadId}/notes — Add note`
- `GET    /v1/leads/{leadId}/notes — List notes`
- `POST   /v1/leads/{leadId}/assign — Assign lead to agent/team`
- `POST   /v1/leads/{leadId}/spam — Mark as spam`
- `POST   /v1/leads/{leadId}/unspam — Unmark spam`
- `POST   /v1/leads/{leadId}/appointment — Create appointment`
- `GET    /v1/leads/{leadId}/appointment — Get appointment`
- `PATCH  /v1/leads/{leadId}/appointment — Update appointment`
- `DELETE /v1/leads/{leadId}/appointment — Cancel appointment`
- `POST   /v1/leads/{leadId}/call/request — Request a callback`
- `GET    /v1/leads/metrics/summary — Lead metrics summary (agent)`

## 13. Reports, Reviews & Trust

- `POST   /v1/reports — Report listing/user`
- `GET    /v1/reports — List my reports`
- `GET    /v1/reports/{reportId} — Get report`
- `POST   /v1/reviews — Create review (agent/builder/project)`
- `GET    /v1/reviews — List reviews`
- `GET    /v1/reviews/{reviewId} — Get review`
- `PATCH  /v1/reviews/{reviewId} — Update review`
- `DELETE /v1/reviews/{reviewId} — Delete review`
- `GET    /v1/admin/reports/queue — Reports moderation queue`
- `POST   /v1/admin/reports/{reportId}/decision — Resolve report`
- `GET    /v1/admin/reviews/queue — Reviews moderation queue`
- `POST   /v1/admin/reviews/{reviewId}/decision — Approve/reject review`

## 14. Admin Moderation

- `GET    /v1/admin/moderation/queue — Unified moderation queue`
- `GET    /v1/admin/moderation/queue/{taskId} — Get moderation task`
- `POST   /v1/admin/moderation/{taskId}/claim — Claim task`
- `POST   /v1/admin/moderation/{taskId}/release — Release task`
- `POST   /v1/admin/moderation/{taskId}/decision — Approve/reject/request changes`
- `POST   /v1/admin/moderation/{taskId}/comment — Add moderator comment`
- `GET    /v1/admin/moderation/rules — List rules`
- `POST   /v1/admin/moderation/rules — Create rule`
- `PATCH  /v1/admin/moderation/rules/{ruleId} — Update rule`
- `DELETE /v1/admin/moderation/rules/{ruleId} — Delete rule`
- `GET    /v1/admin/moderation/stats — Moderation stats`

## 15. Fraud, Abuse & Blacklists

- `GET    /v1/admin/fraud/signals — Fraud signals for entity`
- `POST   /v1/admin/fraud/score/recompute — Recompute fraud score`
- `GET    /v1/admin/blacklist — List blacklist entries`
- `POST   /v1/admin/blacklist — Create blacklist entry`
- `GET    /v1/admin/blacklist/{entryId} — Get entry`
- `PATCH  /v1/admin/blacklist/{entryId} — Update entry`
- `DELETE /v1/admin/blacklist/{entryId} — Delete entry`
- `GET    /v1/admin/rate-limits — View rate limit config`
- `PATCH  /v1/admin/rate-limits — Update rate limit config`
- `GET    /v1/admin/bot/blocked — Blocked bot events`

## 16. Premium / Billing / Payments

- `GET    /v1/packages — List packages`
- `GET    /v1/packages/{packageId} — Get package`
- `POST   /v1/packages — Create package (admin)`
- `PATCH  /v1/packages/{packageId} — Update package (admin)`
- `DELETE /v1/packages/{packageId} — Delete package (admin)`
- `POST   /v1/subscriptions — Create subscription (buy)`
- `GET    /v1/subscriptions — List subscriptions`
- `GET    /v1/subscriptions/{subscriptionId} — Get subscription`
- `POST   /v1/subscriptions/{subscriptionId}/cancel — Cancel subscription`
- `POST   /v1/payments/initiate — Create payment order`
- `GET    /v1/payments — List payments`
- `GET    /v1/payments/{paymentId} — Get payment`
- `POST   /v1/payments/{paymentId}/retry — Retry payment`
- `POST   /v1/payments/{paymentId}/refund — Create refund`
- `GET    /v1/refunds — List refunds`
- `GET    /v1/refunds/{refundId} — Get refund`
- `GET    /v1/invoices — List invoices`
- `GET    /v1/invoices/{invoiceId} — Get invoice`
- `GET    /v1/coupons — List coupons`
- `POST   /v1/coupons — Create coupon (admin)`
- `PATCH  /v1/coupons/{couponId} — Update coupon (admin)`
- `DELETE /v1/coupons/{couponId} — Delete coupon (admin)`

## 17. Webhooks

- `POST   /v1/webhooks/razorpay — Payment gateway webhook`
- `POST   /v1/webhooks/stripe — Payment gateway webhook`
- `POST   /v1/webhooks/shiprocket — Logistics webhook (optional)`
- `POST   /v1/webhooks/partner/leads — Partner lead delivery ACK`
- `GET    /v1/admin/webhooks/logs — Webhook delivery logs`
- `POST   /v1/admin/webhooks/replay — Replay webhook`

## 18. Notifications

- `GET    /v1/notifications — List notifications`
- `PATCH  /v1/notifications/{notificationId} — Mark read/unread`
- `POST   /v1/notifications/mark-all-read — Mark all read`
- `GET    /v1/notification-preferences — Get notification preferences`
- `PATCH  /v1/notification-preferences — Update preferences`
- `GET    /v1/admin/notification-templates — List templates`
- `POST   /v1/admin/notification-templates — Create template`
- `GET    /v1/admin/notification-templates/{templateId} — Get template`
- `PATCH  /v1/admin/notification-templates/{templateId} — Update template`
- `DELETE /v1/admin/notification-templates/{templateId} — Delete template`
- `GET    /v1/admin/notifications/logs — Delivery logs`
- `POST   /v1/admin/notifications/test — Send test notification`

## 19. SEO & CMS Content

- `GET    /v1/seo/landing/cities — List city landing pages`
- `GET    /v1/seo/landing/city/{citySlug} — Get city landing page`
- `GET    /v1/seo/landing/locality/{localitySlug} — Get locality landing page`
- `GET    /v1/content/banners — List active banners`
- `GET    /v1/content/home — Home page content blocks`
- `GET    /v1/content/faq — FAQ content`
- `GET    /v1/content/blog — Blog list (if any)`
- `GET    /v1/content/blog/{slug} — Blog detail`
- `GET    /v1/admin/content/banners — Admin list banners`
- `POST   /v1/admin/content/banners — Create banner`
- `PATCH  /v1/admin/content/banners/{bannerId} — Update banner`
- `DELETE /v1/admin/content/banners/{bannerId} — Delete banner`
- `GET    /v1/admin/content/pages — List CMS pages`
- `POST   /v1/admin/content/pages — Create CMS page`
- `GET    /v1/admin/content/pages/{pageId} — Get CMS page`
- `PATCH  /v1/admin/content/pages/{pageId} — Update CMS page`
- `DELETE /v1/admin/content/pages/{pageId} — Delete CMS page`

## 20. Metadata (Master Data)

- `GET    /v1/meta/property-types — Property types`
- `GET    /v1/meta/amenities — Amenities`
- `GET    /v1/meta/furnishing — Furnishing options`
- `GET    /v1/meta/facing — Facing options`
- `GET    /v1/meta/ownership-types — Ownership types`
- `GET    /v1/meta/availability — Availability options`
- `GET    /v1/meta/sort-options — Search sort options`
- `GET    /v1/admin/meta/property-types — Admin list property types`
- `POST   /v1/admin/meta/property-types — Admin create property type`
- `PATCH  /v1/admin/meta/property-types/{id} — Admin update property type`
- `DELETE /v1/admin/meta/property-types/{id} — Admin delete property type`
- `GET    /v1/admin/meta/amenities — Admin list amenities`
- `POST   /v1/admin/meta/amenities — Admin create amenity`
- `PATCH  /v1/admin/meta/amenities/{id} — Admin update amenity`
- `DELETE /v1/admin/meta/amenities/{id} — Admin delete amenity`

## 21. Analytics & Event Ingestion

- `POST   /v1/events — Ingest client events (page_view, search, lead, etc.)`
- `POST   /v1/events/batch — Batch ingest events`
- `GET    /v1/admin/analytics/kpis — KPIs dashboard`
- `GET    /v1/admin/analytics/funnels — Funnels`
- `GET    /v1/admin/analytics/cohorts — Cohorts`
- `GET    /v1/admin/analytics/attribution — Attribution`

## 22. Feature Flags & Experiments

- `GET    /v1/experiments — List active experiments for user`
- `POST   /v1/experiments/exposure — Log experiment exposure`
- `GET    /v1/admin/feature-flags — List feature flags`
- `POST   /v1/admin/feature-flags — Create flag`
- `PATCH  /v1/admin/feature-flags/{flagId} — Update flag`
- `DELETE /v1/admin/feature-flags/{flagId} — Delete flag`
- `GET    /v1/admin/experiments — List experiments`
- `POST   /v1/admin/experiments — Create experiment`
- `PATCH  /v1/admin/experiments/{expId} — Update experiment`
- `DELETE /v1/admin/experiments/{expId} — Delete experiment`

## 23. Bulk Import / Export

- `POST   /v1/admin/bulk/import/properties — Bulk import listings (CSV)`
- `POST   /v1/admin/bulk/import/projects — Bulk import projects`
- `GET    /v1/admin/bulk/jobs — List bulk jobs`
- `GET    /v1/admin/bulk/jobs/{jobId} — Get job status`
- `GET    /v1/admin/bulk/jobs/{jobId}/errors — Download error report`
- `POST   /v1/admin/bulk/export/properties — Export listings`
- `GET    /v1/admin/bulk/export/{exportId} — Export status`

## 24. Audit Logs

- `GET    /v1/admin/audit — Search audit logs`
- `GET    /v1/admin/audit/{auditId} — Get audit record`
- `POST   /v1/admin/audit/export — Export audit logs`

## 25. Support / Tickets

- `POST   /v1/support/tickets — Create support ticket`
- `GET    /v1/support/tickets — List my tickets`
- `GET    /v1/support/tickets/{ticketId} — Get ticket`
- `PATCH  /v1/support/tickets/{ticketId} — Update ticket`
- `GET    /v1/admin/support/tickets — Admin list tickets`
- `PATCH  /v1/admin/support/tickets/{ticketId} — Admin update ticket`

## 26. System Health & Ops

- `GET    /health — Liveness`
- `GET    /ready — Readiness`
- `GET    /metrics — Prometheus metrics (internal)`
- `GET    /v1/admin/system/status — System status`
- `GET    /v1/admin/system/dependencies — Dependencies health`

## 27. Internal (Service-to-Service) APIs

- `POST   /internal/v1/search/index — Indexer upsert (internal only)`
- `POST   /internal/v1/cache/invalidate — Cache invalidation`
- `POST   /internal/v1/notifications/send — Send notification`
- `POST   /internal/v1/leads/deliver — Deliver lead to partner CRM`
- `GET    /internal/v1/config — Runtime config (service)`

---

## Notes on completeness

This document enumerates the complete v1 API surface for the platform modules defined in SDD v1.1: Public, Agent/Builder, Admin, Webhooks, and Internal APIs. If your implementation adds new modules (e.g., loans, rentals contracts, chat), extend this catalog accordingly.

## Repository implementation status (current codebase)

The current repository implements a large subset of this spec, but not all modules/endpoints are available yet.

### Implemented (in current repo)
- Core services: auth/users, org/kyc, property, search, media, leads, billing, notifications, moderation, analytics, user-interactions.
- Webhooks: `/v1/webhooks/razorpay`, `/v1/webhooks/stripe`, `/v1/webhooks/partner/leads`, and admin webhook logs/replay.
- Internal APIs: `/internal/v1/search/index`, `/internal/v1/cache/invalidate`, `/internal/v1/notifications/send`, `/internal/v1/leads/deliver`, `/internal/v1/config`.

### Not implemented yet (out of scope until added)
- Projects & inventory (`/v1/projects/*`)
- Reports & reviews (`/v1/reports`, `/v1/reviews`)
- Fraud/abuse signals and blacklist CRUD (`/v1/admin/fraud/*`, `/v1/admin/blacklist/*`)
- SEO/CMS content (`/v1/seo/*`, `/v1/content/*`)
- Metadata/master data (`/v1/meta/*`)
- Feature flags/experiments (`/v1/experiments/*`, `/v1/admin/feature-flags/*`)
- Bulk import/export (`/v1/admin/bulk/*`)
- Support tickets (`/v1/support/tickets/*`)

### Routing note (gateway compatibility)
Some admin modules are implemented under service-local admin paths (e.g., search `/v1/search/admin/*`, geo `/v1/geo/admin/*`, media `/v1/media/admin/*`) and are exposed through the API Gateway via rewrites so the external contract remains `/v1/admin/*`.
