"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Plus,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    ExternalLink,
    Filter,
    ArrowUpDown
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
import Image from "next/image";

// Mock products
const products = [
    {
        id: "1",
        name: "Premium Wireless Noise Cancelling Earbuds",
        sku: "EAR-001",
        price: 4500,
        stock: 45,
        category: "Electronics",
        status: "Active",
        image: "/images/product-1.jpg",
    },
    {
        id: "2",
        name: "Luxury Minimalist Men's Quartz Watch",
        sku: "WTC-002",
        price: 3200,
        stock: 12,
        category: "Accessories",
        status: "Active",
        image: "/images/product-2.jpg",
    },
    {
        id: "3",
        name: "Slim Fit Cotton Casual Shirt",
        sku: "SHT-003",
        price: 1800,
        stock: 0,
        category: "Fashion",
        status: "Draft",
        image: "/images/product-3.jpg",
    },
    {
        id: "4",
        name: "Ultra-Fast Portable SSD 1TB",
        sku: "SSD-004",
        price: 8500,
        stock: 8,
        category: "Electronics",
        status: "Active",
        image: "/images/product-4.jpg",
    },
];

export default function AdminProductsPage() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-primary">Products</h1>
                    <p className="text-muted-foreground">Manage your storefront inventory and AliExpress sync.</p>
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
                                onChange={(e) => setSearchTerm(e.target.value)}
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
                            {products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        <div className="relative h-10 w-10 rounded overflow-hidden border bg-muted">
                                            <Image src={product.image} alt={product.name} fill className="object-cover" />
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium max-w-[250px] truncate">
                                        {product.name}
                                    </TableCell>
                                    <TableCell className="text-xs font-mono">{product.sku}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{product.category}</Badge>
                                    </TableCell>
                                    <TableCell className="font-bold">KES {product.price.toLocaleString()}</TableCell>
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
                                            product.status === "Active" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                                        )}>
                                            {product.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/products/${product.id}`} className="flex items-center cursor-pointer">
                                                        <Edit className="mr-2 h-4 w-4" /> Edit Details
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="flex items-center cursor-pointer">
                                                    <ExternalLink className="mr-2 h-4 w-4" /> View Store
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

                    <div className="p-4 border-t flex items-center justify-between text-sm text-muted-foreground">
                        <span>Showing 1 to 4 of 48 products</span>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" disabled>Previous</Button>
                            <Button variant="outline" size="sm">Next</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Helper Card component for within the same file if needed, or I'll just use the UI ones
import { Card, CardContent } from "@/components/ui/card";
