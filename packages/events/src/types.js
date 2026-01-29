'use strict';

/**
 * Kafka topics configuration
 */
const TOPICS = {
  PROPERTY: 'property.events.v1',
  MEDIA: 'media.events.v1',
  LEAD: 'lead.events.v1',
  BILLING: 'billing.events.v1',
  USER: 'user.events.v1',
  MODERATION: 'moderation.events.v1',
  NOTIFICATION: 'notification.events.v1',
  ANALYTICS: 'analytics.events.v1',
};

/**
 * Event types organized by domain
 */
const EVENT_TYPES = {
  // Property Events
  PROPERTY: {
    CREATED: 'property.created',
    UPDATED: 'property.updated',
    SUBMITTED: 'property.submitted',
    APPROVED: 'property.approved',
    REJECTED: 'property.rejected',
    PUBLISHED: 'property.published',
    UNPUBLISHED: 'property.unpublished',
    EXPIRED: 'property.expired',
    ARCHIVED: 'property.archived',
    REFRESHED: 'property.refreshed',
    SOLD: 'property.sold',
    RENTED: 'property.rented',
    DELETED: 'property.deleted',
    MEDIA_ATTACHED: 'property.media.attached',
    MEDIA_DETACHED: 'property.media.detached',
    BOOSTED: 'property.boosted',
    VIEWS_UPDATED: 'property.views.updated',
  },

  // Media Events
  MEDIA: {
    UPLOAD_INITIATED: 'media.upload.initiated',
    UPLOAD_COMPLETED: 'media.upload.completed',
    PROCESSING_STARTED: 'media.processing.started',
    PROCESSING_COMPLETED: 'media.processing.completed',
    PROCESSING_FAILED: 'media.processing.failed',
    DELETED: 'media.deleted',
    MODERATION_FLAGGED: 'media.moderation.flagged',
  },

  // Lead Events
  LEAD: {
    CREATED: 'lead.created',
    ASSIGNED: 'lead.assigned',
    STATUS_CHANGED: 'lead.status.changed',
    NOTE_ADDED: 'lead.note.added',
    APPOINTMENT_SCHEDULED: 'lead.appointment.scheduled',
    APPOINTMENT_UPDATED: 'lead.appointment.updated',
    APPOINTMENT_CANCELLED: 'lead.appointment.cancelled',
    CONVERTED: 'lead.converted',
    MARKED_SPAM: 'lead.marked.spam',
    UNMARKED_SPAM: 'lead.unmarked.spam',
  },

  // Billing Events
  BILLING: {
    PAYMENT_INITIATED: 'payment.initiated',
    PAYMENT_COMPLETED: 'payment.completed',
    PAYMENT_FAILED: 'payment.failed',
    SUBSCRIPTION_CREATED: 'subscription.created',
    SUBSCRIPTION_ACTIVATED: 'subscription.activated',
    SUBSCRIPTION_RENEWED: 'subscription.renewed',
    SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
    SUBSCRIPTION_EXPIRED: 'subscription.expired',
    REFUND_CREATED: 'refund.created',
    REFUND_COMPLETED: 'refund.completed',
    INVOICE_GENERATED: 'invoice.generated',
  },

  // User Events
  USER: {
    REGISTERED: 'user.registered',
    VERIFIED: 'user.verified',
    PROFILE_UPDATED: 'user.profile.updated',
    PASSWORD_CHANGED: 'user.password.changed',
    PREFERENCES_UPDATED: 'user.preferences.updated',
    BLOCKED: 'user.blocked',
    UNBLOCKED: 'user.unblocked',
    DELETED: 'user.deleted',
    SESSION_CREATED: 'user.session.created',
    SESSION_REVOKED: 'user.session.revoked',
  },

  // Organization Events
  ORG: {
    CREATED: 'org.created',
    UPDATED: 'org.updated',
    VERIFIED: 'org.verified',
    REJECTED: 'org.rejected',
    SUSPENDED: 'org.suspended',
    MEMBER_INVITED: 'org.member.invited',
    MEMBER_JOINED: 'org.member.joined',
    MEMBER_REMOVED: 'org.member.removed',
    MEMBER_ROLE_CHANGED: 'org.member.role.changed',
    KYC_SUBMITTED: 'org.kyc.submitted',
    KYC_APPROVED: 'org.kyc.approved',
    KYC_REJECTED: 'org.kyc.rejected',
  },

  // Moderation Events
  MODERATION: {
    TASK_CREATED: 'moderation.task.created',
    TASK_CLAIMED: 'moderation.task.claimed',
    TASK_RELEASED: 'moderation.task.released',
    TASK_DECIDED: 'moderation.task.decided',
    RULE_TRIGGERED: 'moderation.rule.triggered',
    AUTO_APPROVED: 'moderation.auto.approved',
    AUTO_REJECTED: 'moderation.auto.rejected',
  },

  // Notification Events
  NOTIFICATION: {
    REQUESTED: 'notification.requested',
    SENT: 'notification.sent',
    DELIVERED: 'notification.delivered',
    FAILED: 'notification.failed',
    READ: 'notification.read',
  },

  // Analytics Events
  ANALYTICS: {
    PAGE_VIEW: 'analytics.page.view',
    SEARCH: 'analytics.search',
    PROPERTY_VIEW: 'analytics.property.view',
    PROPERTY_SHARE: 'analytics.property.share',
    SHORTLIST_ADD: 'analytics.shortlist.add',
    SHORTLIST_REMOVE: 'analytics.shortlist.remove',
    PHONE_REVEAL: 'analytics.phone.reveal',
    LEAD_SUBMIT: 'analytics.lead.submit',
  },
};

/**
 * Consumer group IDs
 */
const CONSUMER_GROUPS = {
  SEARCH_INDEXER: 'search-indexer-group',
  MEDIA_PROCESSOR: 'media-processor-group',
  NOTIFICATION_WORKER: 'notification-worker-group',
  ANALYTICS_WORKER: 'analytics-worker-group',
  PROPERTY_SERVICE: 'property-service-group',
  MODERATION_SERVICE: 'moderation-service-group',
  BILLING_SERVICE: 'billing-service-group',
  ADMIN_SERVICE: 'admin-service-group',
};

module.exports = {
  TOPICS,
  EVENT_TYPES,
  CONSUMER_GROUPS,
};
