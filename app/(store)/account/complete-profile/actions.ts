"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function completeProfile(data: {
    phone: string;
    defaultAddress: string;
    defaultCity: string;
    defaultCounty: string;
}) {
    const session = await auth();
    
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                phone: data.phone,
                defaultAddress: data.defaultAddress,
                defaultCity: data.defaultCity,
                defaultCounty: data.defaultCounty,
            },
        });

        revalidatePath("/account");
        revalidatePath("/checkout");
        
        return { success: true };
    } catch (error) {
        console.error("Failed to update profile:", error);
        return { success: false, error: "Failed to update profile" };
    }
}
