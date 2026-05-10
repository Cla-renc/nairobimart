import prisma from "@/lib/prisma";
import CouponClient from "./CouponClient";

export default async function CouponsPage() {
    const coupons = await prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' }
    });

    // Serialize dates for client component
    const serializedCoupons = coupons.map(coupon => ({
        ...coupon,
        createdAt: coupon.createdAt.toISOString(),
        expiresAt: coupon.expiresAt.toISOString(),
    }));

    return <CouponClient initialCoupons={serializedCoupons} />;
}
