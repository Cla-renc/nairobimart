import prisma from "@/lib/prisma";
import BannerClient from "./BannerClient";

export default async function BannersPage() {
    const banners = await prisma.banner.findMany({
        orderBy: { position: 'asc' }
    });

    return <BannerClient banners={banners} />;
}
