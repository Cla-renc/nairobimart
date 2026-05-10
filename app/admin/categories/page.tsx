import prisma from "@/lib/prisma";
import CategoryCouponClient from "./CategoryCouponClient";

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
    const categories = await prisma.category.findMany({
        include: {
            _count: {
                select: { products: true }
            },
            parent: {
                select: { name: true }
            }
        },
        orderBy: {
            name: "asc"
        }
    });

    const coupons = await prisma.coupon.findMany({
        orderBy: {
            createdAt: "desc"
        }
    });

    // Transform categories to include productCount for the client component
    const transformedCategories = categories.map(cat => ({
        ...cat,
        productCount: cat._count.products
    }));

    return (
        <CategoryCouponClient
            initialCategories={transformedCategories}
            initialCoupons={coupons}
        />
    );
}
