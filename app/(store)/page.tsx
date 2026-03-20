import HeroBanner from "@/components/store/HeroBanner";
import ProductCard from "@/components/store/ProductCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
    Smartphone,
    Watch,
    Laptop,
    Shirt,
    Home,
    Gift,
    ArrowRight,
    ShoppingBag
} from "lucide-react";

const categories = [
    { name: "Electronics", icon: Smartphone, href: "/products?category=electronics", color: "bg-blue-100 text-blue-600" },
    { name: "Accessories", icon: Watch, href: "/products?category=accessories", color: "bg-purple-100 text-purple-600" },
    { name: "Laptops", icon: Laptop, href: "/products?category=electronics", color: "bg-orange-100 text-orange-600" },
    { name: "Fashion", icon: Shirt, href: "/products?category=fashion", color: "bg-pink-100 text-pink-600" },
    { name: "Home", icon: Home, href: "/products?category=home", color: "bg-green-100 text-green-600" },
    { name: "Gifts", icon: Gift, href: "/products?category=gifts", color: "bg-yellow-100 text-yellow-600" },
];

const featuredProducts = [
    {
        id: "1",
        name: "Xiaomi Smart Band 8 - 1.62' AMOLED Screen",
        slug: "xiaomi-smart-band-8",
        price: 4500,
        comparePrice: 6500,
        image: "https://ae01.alicdn.com/kf/Sa7da5355e8254132b4c5ea23102bde7fE.jpg",
        category: "Electronics",
        rating: 4.8,
        isFeatured: true,
        isSale: true,
    },
    {
        id: "10",
        name: "Mini WiFi Desktop Weather Station",
        slug: "wifi-weather-station",
        price: 6500,
        image: "https://ae01.alicdn.com/kf/S000b201b656144f6bcf0f21b0d425e2f3.jpg",
        category: "Electronics",
        rating: 4.9,
    },
    {
        id: "3",
        name: "Thinkplus GM2 Pro Gaming Earbuds",
        slug: "thinkplus-gm2-pro",
        price: 2200,
        image: "https://ae01.alicdn.com/kf/Sed533b46fce8427c9a26abdafbd018c0b.jpg",
        category: "Electronics",
        rating: 4.9,
    },
    {
        id: "18",
        name: "Intelligent AI Dialogue Toy Clock",
        slug: "ai-dialogue-toy",
        price: 7500,
        image: "https://ae01.alicdn.com/kf/Ae2aa6d7e4398497c84fa0f73ea8933f08.jpg",
        category: "Gifts",
        rating: 4.9,
        isFeatured: true,
    }
];

export default function HomePage() {
    return (
        <div className="flex flex-col min-h-screen">
            <HeroBanner />

            {/* Categories Section */}
            <section className="py-12 bg-muted/30">
                <div className="container px-4">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-primary">Shop by Category</h2>
                        <Link href="/categories" className="text-sm font-medium text-accent hover:underline flex items-center">
                            View All <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {categories.map((category) => (
                            <Link
                                key={category.name}
                                href={category.href}
                                className="group flex flex-col items-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md hover:bg-muted/50 transition-all duration-300"
                            >
                                <div className={`p-4 rounded-full ${category.color} group-hover:scale-110 transition-transform`}>
                                    <category.icon className="h-6 w-6" />
                                </div>
                                <span className="mt-4 font-semibold text-primary">{category.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Products Section */}
            <section className="py-16">
                <div className="container px-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
                        <div className="space-y-1">
                            <h2 className="text-3xl font-extrabold text-primary">Featured Products</h2>
                            <p className="text-muted-foreground">Handpicked for quality and value</p>
                        </div>
                        <Link href="/products?filter=featured" className="mt-4 md:mt-0">
                            <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                                Shop the Colection
                            </Button>
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {featuredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Promotional Section */}
            <section className="py-12">
                <div className="container px-4">
                    <div className="bg-primary rounded-3xl overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary to-transparent opacity-90" />
                        <div className="relative z-10 px-8 py-16 md:px-16 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="max-w-xl text-center md:text-left space-y-4">
                                <Badge className="bg-accent text-accent-foreground font-bold mb-2">LIMITED TIME OFFER</Badge>
                                <h2 className="text-4xl md:text-5xl font-bold text-white">Flash Sale is Live!</h2>
                                <p className="text-white/80 text-lg">
                                    Get incredible discounts up to 70% off on all imported gadgets. Ends in 24 hours.
                                </p>
                                <div className="pt-4 flex flex-wrap justify-center md:justify-start gap-4">
                                    <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                                        Explore Sale
                                    </Button>
                                    <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                                        Learn More
                                    </Button>
                                </div>
                            </div>
                            <div className="hidden lg:block relative w-80 h-80">
                                {/* Promo Image Placeholder */}
                                <div className="w-full h-full bg-accent/20 rounded-full flex items-center justify-center animate-pulse">
                                    <ShoppingBag className="h-32 w-32 text-accent" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
