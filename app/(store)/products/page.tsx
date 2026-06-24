"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
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
    Search,
    Loader2
} from "lucide-react";

interface Product {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice?: number;
    category: string;
    image: string;
    attributes?: Record<string, string>;
    rating?: number;
    isFeatured?: boolean;
}

function ProductsContent() {
    const searchParams = useSearchParams();
    const searchParam = searchParams.get("search");
    const filterParam = searchParams.get("filter");
    const initialCategory = searchParams.get("category");

    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<{name: string, slug: string}[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalItems, setTotalItems] = useState(0);

    const [priceRange, setPriceRange] = useState<number[]>([0, 50000]);
    const [selectedCategoriesState, setSelectedCategoriesState] = useState<string[]>([]);
    const [selectedAttributesState, setSelectedAttributesState] = useState<Record<string, string[]>>({});
    const [hasInteracted, setHasInteracted] = useState(false);
    const [sortBy, setSortBy] = useState("newest");
    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 8;

    // Facets fetched from server (attribute -> [{value, count}])
    const [facets, setFacets] = useState<{ name: string; options: { value: string; count: number }[] }[]>([]);

    useEffect(() => {
        const loadFacets = async () => {
            try {
                const params = new URLSearchParams();
                if (searchParam) params.set('search', searchParam);
                if (filterParam) params.set('filter', filterParam);
                if (priceRange[0] > 0) params.set('minPrice', String(priceRange[0]));
                if (priceRange[1] < 50000) params.set('maxPrice', String(priceRange[1]));
                if (!hasInteracted && initialCategory && selectedCategoriesState.length === 0) params.set('category', initialCategory);

                const res = await fetch(`/api/product-facets?${params.toString()}`);
                const data = await res.json();
                setFacets(Array.isArray(data.facets) ? data.facets : []);
            } catch (err) {
                console.error('Failed to load facets:', err);
                setFacets([]);
            }
        };
        loadFacets();
    }, [searchParam, filterParam, priceRange, selectedCategoriesState, hasInteracted, initialCategory]);

    // Fetch categories once
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const catRes = await fetch('/api/categories');
                const catData = await catRes.json();
                if (Array.isArray(catData)) {
                    setCategories(catData.map((c: { name: string, slug: string }) => ({ name: c.name, slug: c.slug })));
                }
            } catch (err) {
                console.error('Failed to load categories:', err);
            }
        };
        loadCategories();
    }, []);

    // Fetch products page from server whenever filters change
    useEffect(() => {
        const loadProducts = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                params.set('page', String(currentPage));
                params.set('perPage', String(productsPerPage));
                if (searchParam) params.set('search', searchParam);
                if (filterParam) params.set('filter', filterParam);
                if (sortBy) params.set('sort', sortBy);
                if (priceRange[0] > 0) params.set('minPrice', String(priceRange[0]));
                if (priceRange[1] < 50000) params.set('maxPrice', String(priceRange[1]));
                if (!hasInteracted && initialCategory && selectedCategoriesState.length === 0) params.set('category', initialCategory);

                const res = await fetch(`/api/products?${params.toString()}`);
                const data = await res.json();
                setAllProducts(Array.isArray(data.products) ? data.products : []);
                setTotalItems(typeof data.total === 'number' ? data.total : 0);
            } catch (err) {
                console.error('Failed to load products page:', err);
                setAllProducts([]);
                setTotalItems(0);
            } finally {
                setLoading(false);
            }
        };
        loadProducts();
    }, [currentPage, productsPerPage, searchParam, filterParam, selectedCategoriesState, selectedAttributesState, priceRange, sortBy, hasInteracted, initialCategory]);

    // Synchronously derive active categories from URL if user hasn't interacted yet
    // This completely eliminates useEffect race conditions
    const activeCategories = (() => {
        if (!hasInteracted && initialCategory && selectedCategoriesState.length === 0) {
            const safeDecode = decodeURIComponent(initialCategory).trim().toLowerCase();
            const foundCategory = categories.find(c => {
                if (!c || !c.slug || !c.name) return false;
                const slugMatch = c.slug.trim().toLowerCase() === safeDecode;
                const nameMatch = c.name.trim().toLowerCase() === safeDecode;
                const fuzzySlugMatch = c.slug.trim().toLowerCase().replace(/-/g, ' ') === safeDecode.replace(/-/g, ' ');
                const fuzzyNameMatch = c.name.trim().toLowerCase().replace(/\\s+/g, '-') === safeDecode.replace(/\\s+/g, '-');
                return slugMatch || nameMatch || fuzzySlugMatch || fuzzyNameMatch;
            });
            if (foundCategory) {
                return [foundCategory.name];
            }
        }
        return selectedCategoriesState;
    })();

    const toggleCategory = (category: string) => {
        setHasInteracted(true);
        setSelectedCategoriesState(prev => {
            // If this is the first interaction, start from the URL-derived state
            const currentState = (!hasInteracted && initialCategory && prev.length === 0) ? activeCategories : prev;
            return currentState.includes(category)
                ? currentState.filter(c => c !== category)
                : [...currentState, category];
        });
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setHasInteracted(true);
        setSelectedCategoriesState([]);
        setSelectedAttributesState({});
        setPriceRange([0, 50000]);
        setCurrentPage(1);
    };

    const filteredProducts = allProducts.filter(product => {
        // Category Filter
        const matchesCategory = activeCategories.length === 0 || activeCategories.includes(product.category);

        // Price Filter
        const matchesPrice = Number(product.price) >= priceRange[0] && Number(product.price) <= priceRange[1];

        // Search Filter
        const matchesSearch = !searchParam ||
            product.name.toLowerCase().includes(searchParam.toLowerCase()) ||
            product.category.toLowerCase().includes(searchParam.toLowerCase());

        // Sale Filter
        const matchesSale = filterParam !== "sale" || (product.comparePrice && product.comparePrice > product.price);

        // Featured Filter
        const matchesFeatured = filterParam !== "featured" || product.isFeatured;

        // Dynamic Attributes Filter
        const matchesAttributes = Object.entries(selectedAttributesState).every(([key, selectedValues]) => {
            if (!selectedValues || selectedValues.length === 0) return true;
            if (!product.attributes || typeof product.attributes[key] !== 'string') return false;
            return selectedValues.includes(product.attributes[key]);
        });

        return matchesCategory && matchesPrice && matchesSearch && matchesSale && matchesFeatured && matchesAttributes;
    });

    // Sorting logic
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (sortBy === "price-low") return a.price - b.price;
        if (sortBy === "price-high") return b.price - a.price;
        if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
        return 0; // default newest
    });

    const totalPages = Math.max(1, Math.ceil(totalItems / productsPerPage));
    const currentProducts = allProducts;

    // Helper to generate page numbers with ellipses
    const getPageNumbers = () => {
        const pages = [];

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push("...");

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) pages.push(i);
            }

            if (currentPage < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="container mx-auto px-4 py-8">
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
                                            <div key={category.slug} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={category.slug}
                                                    checked={activeCategories.includes(category.name)}
                                                    onCheckedChange={() => toggleCategory(category.name)}
                                                />
                                                <Label htmlFor={category.slug} className="text-sm font-medium leading-none cursor-pointer hover:text-accent transition-colors">
                                                    {category.name}
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

                                {/* Dynamic Attribute Filters (facets from server) */}
                                {facets.map(filter => (
                                    <div key={filter.name} className="space-y-3 pt-4 border-t border-gray-50">
                                        <h4 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground">{filter.name}</h4>
                                        <div className="space-y-2">
                                            {filter.options.map(option => (
                                                <div key={option.value} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`filter-${filter.name}-${option.value}`}
                                                        checked={selectedAttributesState[filter.name]?.includes(option.value) || false}
                                                        onCheckedChange={() => {
                                                            setHasInteracted(true);
                                                            setSelectedAttributesState(prev => {
                                                                const current = prev[filter.name] || [];
                                                                const next = current.includes(option.value)
                                                                    ? current.filter(o => o !== option.value)
                                                                    : [...current, option.value];
                                                                return { ...prev, [filter.name]: next };
                                                            });
                                                            setCurrentPage(1);
                                                        }}
                                                    />
                                                    <Label htmlFor={`filter-${filter.name}-${option.value}`} className="text-sm font-medium leading-none cursor-pointer hover:text-accent transition-colors">
                                                        {option.value} <span className="text-[11px] text-muted-foreground ml-2">({option.count})</span>
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                <Button
                                    variant="ghost"
                                    className="w-full text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors"
                                    onClick={clearFilters}
                                >
                                    Clear All Filters
                                </Button>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-primary tracking-tighter uppercase leading-none">
                                {activeCategories.length === 1 ? activeCategories[0] : "All"} <span className="text-accent">Products</span>
                            </h1>
                            <p className="text-muted-foreground mt-2 text-sm font-medium">Found {totalItems} items from global fulfillment centers</p>
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

                    {loading ? (
                        <div className="py-24 flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="h-12 w-12 animate-spin text-accent" />
                            <p className="text-muted-foreground font-bold animate-pulse">Fetching global catalog...</p>
                        </div>
                    ) : currentProducts.length > 0 ? (
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
                                onClick={clearFilters}
                            >
                                Reset All Filters
                            </Button>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-16 flex justify-center items-center space-x-2 md:space-x-4">
                            <Button
                                variant="outline"
                                disabled={currentPage === 1}
                                onClick={() => {
                                    setCurrentPage(prev => Math.max(1, prev - 1));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="rounded-2xl px-4 md:px-8 border-2 font-bold shadow-sm"
                            >
                                Previous
                            </Button>
                            <div className="flex items-center space-x-1 md:space-x-2">
                                {getPageNumbers().map((page, i) => (
                                    page === "..." ? (
                                        <span key={`ellipsis-${i}`} className="text-muted-foreground font-bold px-2">...</span>
                                    ) : (
                                        <Button
                                            key={page}
                                            variant={currentPage === page ? "default" : "outline"}
                                            className={`h-10 w-10 md:h-12 md:w-12 p-0 rounded-2xl font-black text-sm shadow-sm transition-all duration-300 ${currentPage === page
                                                ? "bg-accent text-accent-foreground border-accent shadow-xl shadow-accent/20 scale-110"
                                                : "hover:border-accent hover:text-accent border-2"
                                                }`}
                                            onClick={() => {
                                                setCurrentPage(page as number);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                        >
                                            {page}
                                        </Button>
                                    )
                                ))}
                            </div>
                            <Button
                                variant="outline"
                                disabled={currentPage === totalPages}
                                onClick={() => {
                                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="rounded-2xl px-4 md:px-8 border-2 font-bold shadow-sm"
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
