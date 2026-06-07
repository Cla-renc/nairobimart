import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Fuse from "fuse.js";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") || "").trim();
    const limit = Number(url.searchParams.get("limit") || "12");

    if (!q) {
      return NextResponse.json({ products: [] });
    }

    // Fetch a subset of product fields to build the search index in memory
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        tags: true,
        images: { select: { url: true } },
      },
      take: 1000,
    });

    const fuse = new Fuse(products, {
      keys: [
        { name: 'name', weight: 0.6 },
        { name: 'tags', weight: 0.3 },
        { name: 'description', weight: 0.1 },
      ],
      includeScore: true,
      threshold: 0.45,
    });

    const results = fuse.search(q, { limit }).map((r) => r.item);

    return NextResponse.json({ products: results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ products: [], error: String(error) }, { status: 500 });
  }
}
