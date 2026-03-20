"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductGrid from "@/components/store/ProductGrid";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Filter,
    Search
} from "lucide-react";

// Expanded Mock data with 20 products
const allProducts = [
    { id: "1", name: "Xiaomi Smart Band 8 - 1.62' AMOLED", slug: "xiaomi-smart-band-8", price: 4500, comparePrice: 6500, image: "https://ae01.alicdn.com/kf/Sa7da5355e8254132b4c5ea23102bde7fE.jpg", category: "Electronics", rating: 4.8, isFeatured: true, isSale: true },
    { id: "2", name: "M10 Wireless Earbuds 9D Stereo", slug: "m10-wireless-earbuds", price: 1800, comparePrice: 2800, image: "https://ae01.alicdn.com/kf/S8b03da40eafd43558363e09ba880ae17k.jpg", category: "Electronics", rating: 4.7, isSale: true },
    { id: "3", name: "Thinkplus GM2 Pro Gaming Earbuds", slug: "thinkplus-gm2-pro", price: 2200, image: "https://ae01.alicdn.com/kf/Sed533b46fce8427c9a26abdafbd018c0b.jpg", category: "Electronics", rating: 4.9, isFeatured: true },
    { id: "4", name: "Y13 Pro Max Smart Watch Bluetooth", slug: "y13-smart-watch", price: 3500, comparePrice: 5500, image: "https://ae01.alicdn.com/kf/S2039805149754fd6b3e656820a341b04s.jpg", category: "Accessories", rating: 4.7, isSale: true },
    { id: "5", name: "Portable Mini Air Cooler Humidifier", slug: "portable-air-cooler", price: 3800, image: "https://ae01.alicdn.com/kf/S32262ebc964d40c9bb7aff0c471f5366l.jpg", category: "Home", rating: 4.5 },
    { id: "6", name: "3L Ultrasonic Cool Mist Humidifier", slug: "3l-mist-humidifier", price: 4200, image: "https://ae01.alicdn.com/kf/Sadda79af720147649cc636979b59e3d5Q.jpg", category: "Home", rating: 4.6 },
    { id: "7", name: "SZUK Wireless Car Vacuum Cleaner", slug: "szuk-car-vacuum", price: 4800, comparePrice: 6800, image: "https://ae01.alicdn.com/kf/Sc3e2d243aeef4f2abc3fd4fe652efc26O.jpg", category: "Home", rating: 4.8, isSale: true },
    { id: "8", name: "Digital Hanging Luggage Scale 50kg", slug: "digital-luggage-scale", price: 1200, image: "https://ae01.alicdn.com/kf/Sbaf40bce26e4400a979efb789229519fm.jpg", category: "Accessories", rating: 4.4 },
    { id: "9", name: "Smart Sensor Automatic Trash Can", slug: "smart-trash-can", price: 5500, image: "https://ae01.alicdn.com/kf/Sbeba48733f6e48b59383b1db71919d13t.jpg", category: "Home", rating: 4.3 },
    { id: "10", name: "Mini WiFi Desktop Weather Station", slug: "wifi-weather-station", price: 6500, image: "https://ae01.alicdn.com/kf/S000b201b656144f6bcf0f21b0d425e2f3.jpg", category: "Electronics", rating: 4.9, isFeatured: true },
    { id: "11", name: "Flame Aroma Diffuser Night Light", slug: "flame-aroma-diffuser", price: 2800, image: "https://ae01.alicdn.com/kf/S23aeed22400b4639ac8bb31dc23664c9D.jpg", category: "Home", rating: 4.7 },
    { id: "12", name: "Men's Graphic Casual Button-Up Shirt", slug: "mens-graphic-shirt", price: 2500, image: "https://ae01.alicdn.com/kf/Sa3e0eb0ae29c4f1dbdaa2a552df1f4bbJ.png", category: "Fashion", rating: 4.6 },
    { id: "13", name: "Women's Stripe Evening Party Dress", slug: "women-stripe-dress", price: 3200, image: "https://ae01.alicdn.com/kf/HTB14WltacfrK1Rjy1Xd761emFXap.png", category: "Fashion", rating: 4.5 },
    { id: "14", name: "M10 Bluetooth Earphones HiFi Stereo", slug: "m10-hifi-earphones", price: 1900, image: "https://ae01.alicdn.com/kf/Sc434ec628c3447029c070d07b280d1ccn.jpg", category: "Electronics", rating: 4.2 },
    { id: "15", name: "TWS E6S Noise Cancelling Headset", slug: "tws-e6s-headset", price: 1500, image: "https://ae01.alicdn.com/kf/S8b692b154fff4602970c49b6697c6fb2e.png", category: "Electronics", rating: 4.3 },
    { id: "16", name: "Lenovo LP75 Sports Wireless Gym", slug: "lenovo-lp75-sports", price: 2800, image: "https://ae01.alicdn.com/kf/Sb8cba2da53674ad8ba0fab308dfe7f03T.jpg", category: "Electronics", rating: 4.8 },
    { id: "17", name: "Wireless PC Soundbar TV Speaker", slug: "wireless-pc-soundbar", price: 5800, comparePrice: 8500, image: "https://ae01.alicdn.com/kf/S967b8bdaa4e745a0bc08782f40f629776.jpg", category: "Electronics", rating: 4.6, isSale: true },
    { id: "18", name: "Intelligent AI Dialogue Toy Clock", slug: "ai-dialogue-toy", price: 7500, image: "https://ae01.alicdn.com/kf/Ae2aa6d7e4398497c84fa0f73ea8933f08.jpg", category: "Gifts", rating: 4.9, isFeatured: true },
    { id: "19", name: "T2 Transparent Wireless Headset", slug: "t2-transparent-headset", price: 3200, image: "https://ae01.alicdn.com/kf/Sfca6f88fa6dc461783577905b368b2fbW.jpg", category: "Electronics", rating: 4.7 },
    { id: "20", name: "SanDisk Ultra 128GB MicroSD Card", slug: "sandisk-ultra-128gb", price: 1800, image: "https://ae01.alicdn.com/kf/H7429188d617c4611a51a8d003e659b09V.jpg", category: "Electronics", rating: 4.9, isFeatured: true }
];

const categories = ["Electronics", "Laptops", "Accessories", "Fashion", "Home", "Gifts", "Beauty"];

function ProductsContent() {
    const searchParams = useSearchParams();
    const initialCategory = searchParams.get("category");

    const [priceRange, setPriceRange] = useState<number[]>([0, 50000]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState("newest");
    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 8;

    // Handle initial category from URL
    useEffect(() => {
        if (initialCategory) {
            const decodedCategory = decodeURIComponent(initialCategory);
            const foundCategory = categories.find(c => c.toLowerCase() === decodedCategory.toLowerCase());
            if (foundCategory) {
                setSelectedCategories([foundCategory]);
            }
        } else {
            setSelectedCategories([]);
        }
    }, [initialCategory]);

    const toggleCategory = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
        setCurrentPage(1);
    };

    const filteredProducts = allProducts.filter(product => {
        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category);
        const matchesPrice = Number(product.price) >= priceRange[0] && Number(product.price) <= priceRange[1];
        return matchesCategory && matchesPrice;
    });

    // Sorting logic
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (sortBy === "price-low") return a.price - b.price;
        if (sortBy === "price-high") return b.price - a.price;
        if (sortBy === "rating") return b.rating - a.rating;
        return 0; // default newest
    });

    const totalPages = Math.ceil(sortedProducts.length / productsPerPage);
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct);

    return (
        <div className="container px-4 py-8">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Filters */}
                <aside className="w-full md:w-64 space-y-8">
                    <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm space-y-8">
                        <div>
                            <h3 className="text-lg font-bold mb-4 flex items-center text-primary">
                                <Filter className="mr-2 h-5 w-5 text-accent" /> Filters
                            </h3>

                            <div className="space-y-6">
                                {/* Category Filter */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground">Categories</h4>
                                    <div className="space-y-2">
                                        {categories.map((category) => (
                                            <div key={category} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={category}
                                                    checked={selectedCategories.includes(category)}
                                                    onCheckedChange={() => toggleCategory(category)}
                                                />
                                                <Label htmlFor={category} className="text-sm font-medium leading-none cursor-pointer hover:text-accent transition-colors">
                                                    {category}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Price Filter */}
                                <div className="space-y-4 pt-4 border-t border-gray-50">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground">Price Range</h4>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setPriceRange([0, 50000])}
                                            className="h-6 text-[10px] font-bold text-accent"
                                        >
                                            Reset
                                        </Button>
                                    </div>
                                    <Slider
                                        defaultValue={[0, 50000]}
                                        max={50000}
                                        step={500}
                                        value={priceRange}
                                        onValueChange={(val: number | readonly number[]) => {
                                            if (Array.isArray(val)) {
                                                setPriceRange([...val]);
                                                setCurrentPage(1);
                                            }
                                        }}
                                    />
                                    <div className="flex items-center justify-between text-[11px] font-black font-mono text-primary">
                                        <span className="bg-muted px-2 py-1 rounded">KES {priceRange[0].toLocaleString()}</span>
                                        <span className="bg-muted px-2 py-1 rounded">KES {priceRange[1].toLocaleString()}</span>
                                    </div>
                                </div>

                                <Button
                                    variant="ghost"
                                    className="w-full text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors"
                                    onClick={() => {
                                        setSelectedCategories([]);
                                        setPriceRange([0, 50000]);
                                        setCurrentPage(1);
                                    }}
                                >
                                    Clear All Filters
                                </Button>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-primary tracking-tighter uppercase leading-none">
                                {selectedCategories.length === 1 ? selectedCategories[0] : "All"} <span className="text-accent">Products</span>
                            </h1>
                            <p className="text-muted-foreground mt-2 text-sm font-medium">Found {sortedProducts.length} items from global fulfillment centers</p>
                        </div>

                        <div className="flex items-center space-x-3">
                            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Sort by:</span>
                            <Select defaultValue="newest" onValueChange={(val) => val && setSortBy(val)}>
                                <SelectTrigger className="w-[180px] rounded-2xl border-2 border-gray-100 font-bold text-sm bg-gray-50/50">
                                    <SelectValue placeholder="Sort order" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-2">
                                    <SelectItem value="newest" className="font-bold">Newest Arrivals</SelectItem>
                                    <SelectItem value="price-low" className="font-bold">Price: Low to High</SelectItem>
                                    <SelectItem value="price-high" className="font-bold">Price: High to Low</SelectItem>
                                    <SelectItem value="rating" className="font-bold">Top Rated</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {currentProducts.length > 0 ? (
                        <ProductGrid products={currentProducts} />
                    ) : (
                        <div className="py-24 text-center space-y-4 bg-muted/20 rounded-[40px] border-4 border-dashed border-white flex flex-col items-center justify-center">
                            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                <Search className="h-8 w-8 text-muted-foreground opacity-20" />
                            </div>
                            <h3 className="text-xl font-black uppercase text-primary tracking-tighter">No products found</h3>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto">Try adjusting your filters or clearing your selection to see all items.</p>
                            <Button
                                variant="outline"
                                className="rounded-xl border-accent text-accent font-bold mt-4"
                                onClick={() => {
                                    setSelectedCategories([]);
                                    setPriceRange([0, 50000]);
                                }}
                            >
                                Reset All Filters
                            </Button>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-16 flex justify-center items-center space-x-4">
                            <Button
                                variant="outline"
                                disabled={currentPage === 1}
                                onClick={() => {
                                    setCurrentPage(prev => Math.max(1, prev - 1));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="rounded-2xl px-8 border-2 font-bold shadow-sm"
                            >
                                Previous
                            </Button>
                            <div className="flex items-center space-x-2">
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <Button
                                        key={i + 1}
                                        variant={currentPage === i + 1 ? "default" : "outline"}
                                        className={`h-12 w-12 p-0 rounded-2xl font-black text-sm shadow-sm transition-all duration-300 ${currentPage === i + 1
                                            ? "bg-accent text-accent-foreground border-accent shadow-xl shadow-accent/20 scale-110"
                                            : "hover:border-accent hover:text-accent border-2"
                                            }`}
                                        onClick={() => {
                                            setCurrentPage(i + 1);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                    >
                                        {i + 1}
                                    </Button>
                                ))}
                            </div>
                            <Button
                                variant="outline"
                                disabled={currentPage === totalPages}
                                onClick={() => {
                                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="rounded-2xl px-8 border-2 font-bold shadow-sm"
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<div className="container py-24 text-center font-bold">Loading Storefront...</div>}>
            <ProductsContent />
        </Suspense>
    );
}
