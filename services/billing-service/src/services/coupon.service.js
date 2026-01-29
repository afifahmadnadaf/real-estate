'use strict';
const { prisma } = require('@real-estate/db-models');

/**
 * List coupons
 */
async function listCoupons(filters = {}) {
  const where = {
    isActive: filters.isActive !== undefined ? filters.isActive : true,
  };

  return prisma.coupon.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Validate coupon
 */
async function validateCoupon(code, amount, packageId = null) {
  const coupon = await prisma.coupon.findUnique({
    where: { code },
  });

  if (!coupon) {
    return { valid: false, error: 'Coupon not found' };
  }

  if (!coupon.isActive) {
    return { valid: false, error: 'Coupon is not active' };
  }

  const now = new Date();
  if (now < coupon.validFrom || now > coupon.validUntil) {
    return { valid: false, error: 'Coupon is expired or not yet valid' };
  }

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, error: 'Coupon usage limit reached' };
  }

  if (coupon.minAmount && parseFloat(amount) < parseFloat(coupon.minAmount)) {
    return {
      valid: false,
      error: `Minimum amount of ${coupon.minAmount} required`,
    };
  }

  if (
    packageId &&
    coupon.applicablePackages.length > 0 &&
    !coupon.applicablePackages.includes(packageId)
  ) {
    return { valid: false, error: 'Coupon not applicable to this package' };
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discountType === 'PERCENTAGE') {
    discountAmount = (parseFloat(amount) * parseFloat(coupon.discountValue)) / 100;
    if (coupon.maxDiscount) {
      discountAmount = Math.min(discountAmount, parseFloat(coupon.maxDiscount));
    }
  } else {
    discountAmount = parseFloat(coupon.discountValue);
  }

  const finalAmount = Math.max(0, parseFloat(amount) - discountAmount);

  return {
    valid: true,
    couponId: coupon.id,
    discountAmount,
    finalAmount,
    coupon,
  };
}

/**
 * Get coupon by ID
 */
async function getCoupon(couponId) {
  const coupon = await prisma.coupon.findUnique({
    where: { id: couponId },
  });
  if (!coupon) {
    return null;
  }
  return coupon;
}

/**
 * Create coupon (admin)
 */
async function createCoupon(data) {
  return prisma.coupon.create({
    data: {
      code: data.code,
      description: data.description || null,
      discountType: data.discountType,
      discountValue: data.discountValue,
      maxUses: data.maxUses || null,
      minAmount: data.minAmount || null,
      maxDiscount: data.maxDiscount || null,
      validFrom: data.validFrom,
      validUntil: data.validUntil,
      applicablePackages: data.applicablePackages || [],
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
  });
}

/**
 * Update coupon (admin)
 */
async function updateCoupon(couponId, data) {
  return prisma.coupon.update({
    where: { id: couponId },
    data: {
      description: data.description,
      discountType: data.discountType,
      discountValue: data.discountValue,
      maxUses: data.maxUses,
      minAmount: data.minAmount,
      maxDiscount: data.maxDiscount,
      validFrom: data.validFrom,
      validUntil: data.validUntil,
      applicablePackages: data.applicablePackages,
      isActive: data.isActive,
    },
  });
}

/**
 * Delete coupon (admin)
 */
async function deleteCoupon(couponId) {
  await prisma.coupon.delete({
    where: { id: couponId },
  });
  return { success: true };
}

/**
 * Apply coupon
 */
async function applyCoupon(couponId, userId, paymentId, discountAmount) {
  await prisma.$transaction(async (tx) => {
    // Create coupon usage
    await tx.couponUsage.create({
      data: {
        couponId,
        userId,
        paymentId,
        discountAmount,
      },
    });

    // Increment used count
    await tx.coupon.update({
      where: { id: couponId },
      data: {
        usedCount: {
          increment: 1,
        },
      },
    });
  });
}

module.exports = {
  listCoupons,
  validateCoupon,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
};
