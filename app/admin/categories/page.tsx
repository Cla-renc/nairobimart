"use client";

import { useState } from "react";
import {
    Plus,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    Grid,
    Tag,
    ShoppingBag,
    ExternalLink
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data
const categories = [
    { id: "1", name: "Electronics", slug: "electronics", productCount: 45, status: "Active", image: "/images/cat-electronics.jpg" },
    { id: "2", name: "Accessories", slug: "accessories", productCount: 22, status: "Active", image: "/images/cat-accessories.jpg" },
    { id: "3", name: "Fashion", slug: "fashion", productCount: 38, status: "Active", image: "/images/cat-fashion.jpg" },
    { id: "4", name: "Home & Garden", slug: "home", productCount: 15, status: "Active", image: "/images/cat-home.jpg" },
    { id: "5", name: "Gifts", slug: "gifts", productCount: 12, status: "Draft", image: "/images/cat-gifts.jpg" },
];

const coupons = [
    { id: "1", code: "KARIBU20", discount: "20%", type: "Percentage", expiry: "2026-12-31", used: 145, status: "Active" },
    { id: "2", code: "NAIROBI500", discount: "KES 500", type: "Fixed", expiry: "2026-06-30", used: 84, status: "Active" },
    { id: "3", code: "FLASH70", discount: "70%", type: "Percentage", expiry: "2026-03-20", used: 312, status: "Expired" },
];

export default function AdminCategoriesCouponsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-primary">Content & Promotions</h1>
                    <p className="text-muted-foreground">Organize your store structure and manage discount offers.</p>
                </div>
            </div>

            <Tabs defaultValue="categories" className="space-y-6">
                <TabsList className="bg-muted/50 p-1 rounded-xl">
                    <TabsTrigger value="categories" className="px-6 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Grid className="mr-2 h-4 w-4" /> Categories
                    </TabsTrigger>
                    <TabsTrigger value="coupons" className="px-6 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Tag className="mr-2 h-4 w-4" /> Coupon Codes
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="categories" className="space-y-6">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search categories..." className="pl-10" />
                        </div>
                        <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                            <Plus className="mr-2 h-4 w-4" /> Add Category
                        </Button>
                    </div>

                    <Card className="border-none shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/20 hover:bg-transparent">
                                    <TableHead className="w-[80px]">Image</TableHead>
                                    <TableHead>Category Name</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Products</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.map((cat) => (
                                    <TableRow key={cat.id}>
                                        <TableCell>
                                            <div className="relative h-10 w-10 rounded-lg overflow-hidden border bg-muted">
                                                <Image src={cat.image} alt={cat.name} fill className="object-cover" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-bold text-primary">{cat.name}</TableCell>
                                        <TableCell className="text-xs font-mono">{cat.slug}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-sm font-medium">
                                                <ShoppingBag className="mr-2 h-4 w-4 text-muted-foreground" />
                                                {cat.productCount} Items
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={cat.status === "Active" ? "bg-green-100 text-green-700 border-none" : "bg-muted text-muted-foreground border-none"}>
                                                {cat.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end space-x-2">
                                                <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                <TabsContent value="coupons" className="space-y-6">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search coupons..." className="pl-10" />
                        </div>
                        <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                            <Plus className="mr-2 h-4 w-4" /> Create Coupon
                        </Button>
                    </div>

                    <Card className="border-none shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/20 hover:bg-transparent">
                                    <TableHead>Coupon Code</TableHead>
                                    <TableHead>Discount</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Used Count</TableHead>
                                    <TableHead>Expiry Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {coupons.map((coupon) => (
                                    <TableRow key={coupon.id}>
                                        <TableCell>
                                            <span className="font-mono font-bold text-accent bg-accent/10 px-2 py-1 rounded text-sm tracking-wider">
                                                {coupon.code}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-extrabold text-primary">{coupon.discount}</TableCell>
                                        <TableCell className="text-sm font-medium">{coupon.type}</TableCell>
                                        <TableCell className="text-sm">{coupon.used} times</TableCell>
                                        <TableCell className="text-sm font-medium">{coupon.expiry}</TableCell>
                                        <TableCell>
                                            <Badge className={coupon.status === "Active" ? "bg-green-100 text-green-700 border-none" : "bg-red-100 text-red-700 border-none"}>
                                                {coupon.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end space-x-2">
                                                <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
