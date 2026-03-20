import { Metadata } from "next";
import ProductDetailClient from "@/components/store/ProductDetailClient";

// Mock product (Mirror of the client one but for server-side SEO)
const product = {
    id: "1",
    name: "Premium Wireless Noise Cancelling Earbuds",
    slug: "wireless-earbuds-kenya",
    price: 4500,
    description: "Experience studio-quality sound with our latest noise-cancelling earbuds. Perfect for the Nairobi commute or focus sessions at work.",
    images: ["/images/product-1.jpg"],
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    // In a real app, fetch based on params.slug
    return {
        title: `${product.name} | NairobiMart`,
        description: product.description,
        openGraph: {
            title: product.name,
            description: product.description,
            images: [product.images[0]],
        }
    };
}

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
    return <ProductDetailClient slug={params.slug} />;
}
