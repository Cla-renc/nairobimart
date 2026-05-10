"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    Plus,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    ExternalLink,
    Filter,
    ArrowUpDown,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

interface Product {
    id: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
    isActive: boolean;
    slug: string;
    images: { url: string }[];
    category?: { name: string } | null;
}

export default function AdminProductsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/products?page=${page}&limit=10&search=${searchTerm}`);
            const data = await res.json();
            setProducts(data.products || []);
            setTotalPages(data.totalPages || 1);
            setTotalProducts(data.total || 0);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    }, [page, searchTerm]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-primary">Products</h1>
                    <p className="text-muted-foreground">Manage your storefront inventory and CJDropshipping sync.</p>
                </div>
                <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold">
                    <Link href="/admin/products/new">
                        <Plus className="mr-2 h-4 w-4" /> Add New Product
                    </Link>
                </Button>
            </div>

            <Card className="border-none shadow-sm">
                <CardContent className="p-0">
                    <div className="p-4 border-b flex flex-col md:flex-row gap-4 justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, SKU or category..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                                <Filter className="mr-2 h-4 w-4" /> Filter
                            </Button>
                            <Button variant="outline" size="sm">
                                <ArrowUpDown className="mr-2 h-4 w-4" /> Sort
                            </Button>
                        </div>
                    </div>

                    <div className="relative">
                        {loading && (
                            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent bg-muted/20">
                                    <TableHead className="w-[80px]">Image</TableHead>
                                    <TableHead>Product Name</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">
                                            No products found.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {products.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            <div className="relative h-10 w-10 rounded overflow-hidden border bg-muted">
                                                <Image
                                                    src={product.images?.[0]?.url || "/images/placeholder.jpg"}
                                                    alt={product.name}
                                                    fill
                                                    sizes="40px"
                                                    className="object-cover"
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium max-w-[250px] truncate">
                                            {product.name}
                                        </TableCell>
                                        <TableCell className="text-xs font-mono">{product.sku}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{product.category?.name || "Uncategorized"}</Badge>
                                        </TableCell>
                                        <TableCell className="font-bold">KES {product.price?.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "font-medium",
                                                product.stock === 0 ? "text-red-600" : product.stock < 10 ? "text-orange-600" : "text-primary"
                                            )}>
                                                {product.stock} pcs
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={cn(
                                                "border-none uppercase text-[10px] font-bold",
                                                product.isActive ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                                            )}>
                                                {product.isActive ? "Active" : "Draft"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted rounded-full">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 p-2">
                                                    <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider">Product Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />

                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/admin/products/${product.id}`} className="flex items-center cursor-pointer w-full">
                                                            <Edit className="mr-2 h-4 w-4 text-blue-600" /> Edit Details
                                                        </Link>
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/products/${product.slug}`} className="flex items-center cursor-pointer w-full">
                                                            <ExternalLink className="mr-2 h-4 w-4 text-green-600" /> View on Store
                                                        </Link>
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator />

                                                    <DropdownMenuItem className="flex items-center text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete Product
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="p-4 border-t flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            Showing {products.length > 0 ? (page - 1) * 10 + 1 : 0} to {Math.min(page * 10, totalProducts)} of {totalProducts} products
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || loading}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
