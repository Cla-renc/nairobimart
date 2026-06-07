import prisma from "@/lib/prisma";
import CouponClient from "./CouponClient";

export const dynamic = "force-dynamic";

export default async function CouponsPage() {
    const coupons = await prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' }
    });

    const ordersWithCoupons = await prisma.order.findMany({
        where: { couponCode: { not: null } },
        select: { couponCode: true }
    });

    const couponUsageMap = ordersWithCoupons.reduce<Record<string, number>>((acc, order) => {
        if (order.couponCode) {
            acc[order.couponCode] = (acc[order.couponCode] ?? 0) + 1;
        }
        return acc;
    }, {});

    const serializedCoupons = coupons.map(coupon => ({
        ...coupon,
        createdAt: coupon.createdAt.toISOString(),
        expiresAt: coupon.expiresAt.toISOString(),
        redemptionCount: couponUsageMap[coupon.code] ?? 0,
    }));

    return <CouponClient initialCoupons={serializedCoupons} />;
}
