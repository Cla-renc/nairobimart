"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function submitReview(data: {
    productId: string;
    rating: number;
    title?: string;
    body: string;
    videoUrl?: string;
}) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: "You must be logged in to leave a review." };
    }

    try {
        // Enforce verified purchase: Check if user has an order with this product
        const completedOrder = await prisma.order.findFirst({
            where: {
                userId: session.user.id,
                status: "delivered", // Must be delivered to review it
                items: {
                    some: {
                        productId: data.productId
                    }
                }
            },
            select: { id: true }
        });

        if (!completedOrder) {
            return { 
                success: false, 
                error: "Verified Purchase Only: You can only review products you have successfully purchased and received." 
            };
        }

        // Check if user already reviewed this product
        const existingReview = await prisma.review.findFirst({
            where: {
                userId: session.user.id,
                productId: data.productId,
            }
        });

        if (existingReview) {
            return { success: false, error: "You have already reviewed this product." };
        }

        await prisma.review.create({
            data: {
                rating: data.rating,
                title: data.title,
                body: data.body,
                videoUrl: data.videoUrl,
                productId: data.productId,
                userId: session.user.id,
                orderId: completedOrder.id,
                isApproved: false, // Default to pending approval by admin
            }
        });

        revalidatePath(`/products/${data.productId}`); // Can be adjusted depending on route structure

        return { success: true };
    } catch (error) {
        console.error("Failed to submit review:", error);
        return { success: false, error: "Failed to submit review. Please try again." };
    }
}
