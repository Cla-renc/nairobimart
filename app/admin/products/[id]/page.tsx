import prisma from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
    params
}: {
    params: { id: string }
}) {
    const product = await prisma.product.findUnique({
        where: { id: params.id },
        include: {
            category: true,
            images: true,
        }
    });

    if (!product) {
        notFound();
    }

    // Map Prisma product to ProductForm format
    const initialData = {
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        comparePrice: product.comparePrice || undefined,
        sku: product.sku || "",
        stock: product.stock,
        category: product.category?.id || "",
        status: product.isActive ? "Active" : "Draft",
        cjProductId: product.cjProductId || "",
        isFlashSale: product.isFlashSale,
        flashSalePrice: product.flashSalePrice || 0,
        flashSaleEndsAt: product.flashSaleEndsAt ? new Date(product.flashSaleEndsAt).toISOString().slice(0, 16) : "",
        images: product.images.map((image) => ({ url: image.url })),
    };

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <ProductForm initialData={initialData} productId={product.id} />
        </div>
    );
}
