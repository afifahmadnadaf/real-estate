'use strict';

const { prisma } = require('@real-estate/db-models');

/**
 * Get user notification preferences
 */
async function getPreferences(userId) {
  const userPrefs = await prisma.userPreferences.findUnique({
    where: { userId },
  });

  const defaultPrefs = {
    email: true,
    sms: true,
    push: true,
    whatsapp: false,
  };

  if (!userPrefs || !userPrefs.notificationSettings) {
    return defaultPrefs;
  }

  return {
    ...defaultPrefs,
    ...userPrefs.notificationSettings,
  };
}

/**
 * Update preferences
 */
async function updatePreferences(userId, preferences) {
  await prisma.userPreferences.upsert({
    where: { userId },
    create: {
      userId,
      notificationSettings: preferences,
    },
    update: {
      notificationSettings: preferences,
    },
  });

  return getPreferences(userId);
}

module.exports = {
  getPreferences,
  updatePreferences,
};
