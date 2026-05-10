import Link from "next/link";
import prisma from "@/lib/prisma";
import {
    Smartphone,
    Watch,
    Laptop,
    Shirt,
    Home,
    Gift,
    Gamepad,
    User,
    Headphones,
    Camera,
    Package,
    LucideIcon
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
    'Electronics': Smartphone,
    'Accessories': Watch,
    'Laptops': Laptop,
    'Fashion': Shirt,
    'Home': Home,
    'Gifts': Gift,
    'Beauty': User,
    'Toys': Gamepad,
    'Audio': Headphones,
    'Photography': Camera,
};

const COLOR_MAP: Record<string, string> = {
    'Electronics': "bg-blue-100 text-blue-600",
    'Accessories': "bg-purple-100 text-purple-600",
    'Fashion': "bg-pink-100 text-pink-600",
    'Home': "bg-green-100 text-green-600",
    'Gifts': "bg-yellow-100 text-yellow-600",
    'Beauty': "bg-rose-100 text-rose-600",
};

export default async function CategoriesPage() {
    const categoriesDb = await prisma.category.findMany({
        where: { isActive: true },
        include: {
            _count: {
                select: { products: { where: { isActive: true } } }
            }
        },
        orderBy: { position: 'asc' }
    });

    const liveCategories = categoriesDb.map(cat => ({
        name: cat.name,
        slug: cat.slug,
        icon: ICON_MAP[cat.name] || Package,
        count: cat._count.products,
        color: COLOR_MAP[cat.name] || "bg-gray-100 text-gray-600",
        href: `/products?category=${cat.slug}`
    }));

    return (
        <div className="container px-4 py-16 space-y-12">
            <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tighter uppercase">Browse <span className="text-accent">Categories</span></h1>
                <p className="text-muted-foreground text-lg max-w-2xl">
                    Discover our extensive collection of products curated from global fulfillment centers.
                </p>
            </div>

            {liveCategories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Package className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
                    <p className="text-xl font-medium text-muted-foreground">No categories found.</p>
                    <p className="text-sm text-muted-foreground mt-1 text-center max-w-xs">Seed some products or create categories in the admin dashboard to see them here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {liveCategories.map((cat) => (
                        <Link
                            key={cat.slug}
                            href={cat.href}
                            className="group p-8 bg-white border rounded-3xl shadow-sm hover:shadow-xl hover:border-accent/40 transition-all duration-500 flex flex-col items-center text-center space-y-6"
                        >
                            <div className={`p-6 rounded-3xl ${cat.color} group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500`}>
                                <cat.icon className="h-10 w-10" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-primary group-hover:text-accent transition-colors">{cat.name}</h3>
                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">{cat.count} Items</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
