import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: { slug: string } }
) {
    try {
        const product = await prisma.product.findUnique({
            where: { slug: params.slug },
            include: { images: true }
        });

        if (!product || product.images.length === 0) {
            return new NextResponse('Not found', { status: 404 });
        }

        const imageUrl = product.images[0].url;
        
        // Fetch from the external source using Vercel's IP to bypass scraper blocks
        const imageRes = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            }
        });

        if (!imageRes.ok) {
            return new NextResponse('Failed to fetch image', { status: 500 });
        }

        const buffer = await imageRes.arrayBuffer();
        
        // Force JPEG/PNG response so WhatsApp accepts it
        const contentType = imageRes.headers.get('content-type') || 'image/jpeg';

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400, s-maxage=86400',
            }
        });
    } catch (e) {
        return new NextResponse('Server error', { status: 500 });
    }
}
