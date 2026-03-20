"use client";

import Link from "next/link";
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
    Camera
} from "lucide-react";

const categories = [
    { name: "Electronics", icon: Smartphone, count: 10, color: "bg-blue-100 text-blue-600", href: "/products?category=electronics" },
    { name: "Accessories", icon: Watch, count: 2, color: "bg-purple-100 text-purple-600", href: "/products?category=accessories" },
    { name: "Fashion", icon: Shirt, count: 2, color: "bg-pink-100 text-pink-600", href: "/products?category=fashion" },
    { name: "Home", icon: Home, count: 5, color: "bg-green-100 text-green-600", href: "/products?category=home" },
    { name: "Gifts", icon: Gift, count: 1, color: "bg-yellow-100 text-yellow-600", href: "/products?category=gifts" },
    { name: "Beauty", icon: User, count: 0, color: "bg-rose-100 text-rose-600", href: "/products?category=beauty" },
];

export default function CategoriesPage() {
    return (
        <div className="container px-4 py-16 space-y-12">
            <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tighter uppercase">Browse <span className="text-accent">Categories</span></h1>
                <p className="text-muted-foreground text-lg max-w-2xl">
                    Discover our extensive collection of products curated from global fulfillment centers.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {categories.map((cat) => (
                    <Link
                        key={cat.name}
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
        </div>
    );
}
