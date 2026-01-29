'use strict';

const apiGatewayApp = require('../../../services/api-gateway/src/app');
const userServiceApp = require('../../../services/user-service/src/app');
const orgServiceApp = require('../../../services/org-service/src/app');
const propertyServiceApp = require('../../../services/property-service/src/app');
const searchServiceApp = require('../../../services/search-service/src/app');
const mediaServiceApp = require('../../../services/media-service/src/app');
const leadServiceApp = require('../../../services/lead-service/src/app');
const moderationServiceApp = require('../../../services/moderation-service/src/app');
const billingServiceApp = require('../../../services/billing-service/src/app');
const notificationServiceApp = require('../../../services/notification-service/src/app');
const geoServiceApp = require('../../../services/geo-service/src/app');
const analyticsServiceApp = require('../../../services/analytics-service/src/app');
const userInteractionsServiceApp = require('../../../services/user-interactions-service/src/app');
const adminServiceApp = require('../../../services/admin-service/src/app');

describe('service boot smoke', () => {
  const serviceApps = [
    { path: 'services/api-gateway/src/app.js', app: apiGatewayApp },
    { path: 'services/user-service/src/app.js', app: userServiceApp },
    { path: 'services/org-service/src/app.js', app: orgServiceApp },
    { path: 'services/property-service/src/app.js', app: propertyServiceApp },
    { path: 'services/search-service/src/app.js', app: searchServiceApp },
    { path: 'services/media-service/src/app.js', app: mediaServiceApp },
    { path: 'services/lead-service/src/app.js', app: leadServiceApp },
    { path: 'services/moderation-service/src/app.js', app: moderationServiceApp },
    { path: 'services/billing-service/src/app.js', app: billingServiceApp },
    { path: 'services/notification-service/src/app.js', app: notificationServiceApp },
    { path: 'services/geo-service/src/app.js', app: geoServiceApp },
    { path: 'services/analytics-service/src/app.js', app: analyticsServiceApp },
    { path: 'services/user-interactions-service/src/app.js', app: userInteractionsServiceApp },
    { path: 'services/admin-service/src/app.js', app: adminServiceApp },
  ];

  for (const item of serviceApps) {
    it(`loads ${item.path} without throwing`, () => {
      expect(typeof item.app).toBe('function');
    });
  }
});

