import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") || "").trim();
    const limit = Number(url.searchParams.get("limit") || "12");

    if (!q) {
      return NextResponse.json({ products: [] });
    }

    let products = [];

    try {
      // 1. Attempt Atlas Search (requires a Search Index named "default" on the Product collection)
      const atlasResults = await prisma.product.aggregateRaw({
        pipeline: [
          {
            $search: {
              index: "default",
              text: {
                query: q,
                path: ["name", "description", "category", "tags"],
                fuzzy: {
                  maxEdits: 1, // Tolerate 1 typo (e.g. "raddish" -> "radish")
                }
              }
            }
          },
          {
            $match: { isActive: true }
          },
          {
            $limit: limit
          },
          {
            $project: {
              id: { $toString: "$_id" },
              _id: 0,
              name: 1,
              slug: 1,
              description: 1,
              price: 1,
              tags: 1,
              images: 1
            }
          }
        ]
      });

      // Prisma aggregateRaw returns an unknown type array or object
      if (Array.isArray(atlasResults) && atlasResults.length > 0) {
        products = atlasResults as any[];
      } else {
        throw new Error("No results from Atlas Search, falling back to Regex");
      }
    } catch (atlasError) {
      // 2. Fallback to standard Regex match if Atlas Search fails (e.g., index not created yet)
      console.warn("Atlas Search failed or returned 0 results. Falling back to regex.", atlasError);
      
      products = await prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ]
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          price: true,
          tags: true,
          images: { select: { url: true } },
        },
        take: limit,
      });
    }

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ products: [], error: String(error) }, { status: 500 });
  }
}
