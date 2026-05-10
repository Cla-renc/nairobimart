"use server"

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveSiteSettings(data: Record<string, string>) {
    try {
        const promises = Object.entries(data).map(([key, value]) => {
            return prisma.siteSettings.upsert({
                where: { key },
                update: { value },
                create: { key, value }
            });
        });

        await Promise.all(promises);
        revalidatePath("/admin/settings");
        return { success: true };
    } catch (error) {
        console.error("Failed to save settings:", error);
        return { success: false, error: "Failed to save settings" };
    }
}
