import prisma from "@/lib/prisma";
import ReviewClient from "./ReviewClient";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
    const reviews = await prisma.review.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            product: {
                select: {
                    name: true,
                    images: {
                        take: 1,
                        orderBy: { position: 'asc' }
                    }
                }
            },
            user: {
                select: { name: true, email: true }
            }
        }
    });

    // Serialize dates for client component
    const serializedReviews = reviews.map(review => ({
        ...review,
        createdAt: review.createdAt.toISOString(),
    }));

    return <ReviewClient initialReviews={serializedReviews} />;
}
