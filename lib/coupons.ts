import prisma from "./prisma";
import type { Coupon } from "@prisma/client";

type CouponValidationBase = {
    valid: boolean;
    error?: string;
};

type CouponValidationSuccess = CouponValidationBase & {
    valid: true;
    coupon: Coupon;
    amount: number;
};

type CouponValidationFailure = CouponValidationBase & {
    valid: false;
};

export type CouponValidationResult = CouponValidationSuccess | CouponValidationFailure;

export async function validateCouponCode(code: string, subtotal: number): Promise<CouponValidationResult> {
    if (!code || typeof code !== "string") {
        return { valid: false, error: "Coupon code is required." };
    }

    const normalizedCode = code.trim().toUpperCase();
    const coupon = await prisma.coupon.findUnique({
        where: { code: normalizedCode },
    });

    if (!coupon || !coupon.isActive) {
        return { valid: false, error: "Invalid or inactive coupon code." };
    }

    if (coupon.expiresAt < new Date()) {
        return { valid: false, error: "This coupon has expired." };
    }

    if (coupon.usedCount >= coupon.maxUses) {
        return { valid: false, error: "This coupon has already reached its maximum number of uses." };
    }

    if (subtotal < coupon.minOrder) {
        return {
            valid: false,
            error: `This coupon requires a minimum order of KES ${coupon.minOrder.toLocaleString()}.`,
        };
    }

    const amount = coupon.type === "percentage"
        ? Math.min(Math.round((subtotal * coupon.value) / 100), subtotal)
        : Math.min(coupon.value, subtotal);

    return {
        valid: true,
        coupon,
        amount,
    };
}

export async function applyCouponCode(code: string, subtotal: number): Promise<CouponValidationResult> {
    const validation = await validateCouponCode(code, subtotal);
    if (!validation.valid) {
        return validation;
    }

    const updatedCoupon = await prisma.coupon.update({
        where: { code: validation.coupon.code },
        data: {
            usedCount: { increment: 1 },
            isActive: validation.coupon.usedCount + 1 >= validation.coupon.maxUses ? false : validation.coupon.isActive,
        },
    });

    return {
        valid: true,
        coupon: updatedCoupon,
        amount: validation.amount,
    };
}

export async function createCampaignCoupon(
    prefix: string,
    value: number,
    type: "percentage" | "fixed_amount" = "percentage",
    expiresInDays = 7,
    minOrder = 500,
    maxUses = 1
) {
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `${prefix}-${randomSuffix}`;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const coupon = await prisma.coupon.create({
        data: {
            code,
            type,
            value,
            minOrder,
            maxUses,
            expiresAt,
            isActive: true,
        },
    });

    return coupon;
}

export async function createRecoveryCoupon(userId: string, value = 5, expiresInDays = 7) {
    const coupon = await createCampaignCoupon("COMEBACK", value, "percentage", expiresInDays, 500, 1);
    await prisma.user.update({
        where: { id: userId },
        data: { lastAbandonedCartNotificationAt: new Date() },
    });
    return coupon;
}

export async function createWelcomeCoupon(userId: string, value = 10, expiresInDays = 30) {
    // Generates a WELCOME-XXXX coupon for 10% off
    const coupon = await createCampaignCoupon("WELCOME", value, "percentage", expiresInDays, 0, 1);
    return coupon;
}

export async function createVIPMilestoneCoupon(userId: string, value = 15, expiresInDays = 30) {
    // Generates a VIP-XXXX coupon for 15% off
    const coupon = await createCampaignCoupon("VIP", value, "percentage", expiresInDays, 0, 1);
    return coupon;
}

export async function createWinBackCoupon(userId: string, value = 10, expiresInDays = 14) {
    const coupon = await createCampaignCoupon("WINBACK", value, "percentage", expiresInDays, 500, 1);
    await prisma.user.update({
        where: { id: userId },
        data: { lastWinBackSentAt: new Date() },
    });
    return coupon;
}
