"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Grid,
    Tag,
    ShoppingBag,
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
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";

// Types
import { Category, Coupon, CouponType } from "@prisma/client";

interface CategoryWithCount extends Category {
    productCount: number;
    parent?: { name: string } | null;
}

interface CategoryCouponClientProps {
    initialCategories: CategoryWithCount[];
    initialCoupons: Coupon[];
}

// Schemas
const categorySchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    description: z.string(),
    imageUrl: z.string(),
    parentId: z.string().nullable(),
    isActive: z.boolean(),
    position: z.number(),
});

const couponSchema = z.object({
    code: z.string().min(1, "Code is required"),
    type: z.nativeEnum(CouponType),
    value: z.number().min(0, "Value must be positive"),
    minOrder: z.number().min(0),
    maxUses: z.number().min(1),
    expiresAt: z.string().min(1, "Expiry date is required"),
    isActive: z.boolean(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;
type CouponFormValues = z.infer<typeof couponSchema>;

export default function CategoryCouponClient({
    initialCategories,
    initialCoupons
}: CategoryCouponClientProps) {
    const router = useRouter();
    const [categories, setCategories] = useState<CategoryWithCount[]>(initialCategories);
    const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);

    // UI State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null);
    const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [couponSearchTerm, setCouponSearchTerm] = useState("");

    // Forms
    const categoryForm = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: "",
            slug: "",
            description: "",
            imageUrl: "",
            parentId: null,
            isActive: true,
            position: 0,
        },
    });

    const couponForm = useForm<CouponFormValues>({
        resolver: zodResolver(couponSchema),
        defaultValues: {
            code: "",
            type: "percentage",
            value: 0,
            minOrder: 0,
            maxUses: 100,
            expiresAt: "", // Empty initial value for hydration safety
            isActive: true,
        },
    });

    // Handle hydration of the date field
    const [isMounted, setIsMounted] = React.useState(false);
    React.useEffect(() => {
        setIsMounted(true);
        if (!editingCoupon) {
            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            couponForm.setValue("expiresAt", nextYear.toISOString().split('T')[0]);
        }
    }, [editingCoupon, couponForm]);

    // Handlers
    const onCategoryOpenChange = (open: boolean) => {
        setIsCategoryModalOpen(open);
        if (!open) {
            setEditingCategory(null);
            categoryForm.reset({
                name: "",
                slug: "",
                description: "",
                imageUrl: "",
                parentId: null,
                isActive: true,
                position: 0,
            });
        }
    };

    const onCouponOpenChange = (open: boolean) => {
        setIsCouponModalOpen(open);
        if (!open) {
            setEditingCoupon(null);
            couponForm.reset({
                code: "",
                type: "percentage",
                value: 0,
                minOrder: 0,
                maxUses: 100,
                expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                isActive: true,
            });
        }
    };

    const handleCategoryEdit = (category: CategoryWithCount) => {
        setEditingCategory(category);
        categoryForm.reset({
            name: category.name,
            slug: category.slug,
            description: category.description || "",
            imageUrl: category.imageUrl || "",
            parentId: category.parentId,
            isActive: category.isActive,
            position: category.position,
        });
        setIsCategoryModalOpen(true);
    };

    const handleCouponEdit = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        couponForm.reset({
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            minOrder: coupon.minOrder,
            maxUses: coupon.maxUses,
            expiresAt: new Date(coupon.expiresAt).toISOString().split('T')[0],
            isActive: coupon.isActive,
        });
        setIsCouponModalOpen(true);
    };

    const onCategorySubmit = async (data: CategoryFormValues) => {
        setIsLoading(true);
        try {
            const url = editingCategory
                ? `/api/admin/categories/${editingCategory.id}`
                : "/api/admin/categories";
            const method = editingCategory ? "PATCH" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || "Something went wrong");
            }

            router.refresh();
            // Refetch data for local state
            const updatedCategories = await (await fetch("/api/admin/categories")).json();
            setCategories(updatedCategories);
            onCategoryOpenChange(false);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Something went wrong";
            alert(message);
        } finally {
            setIsLoading(false);
        }
    };

    const onCouponSubmit = async (data: CouponFormValues) => {
        setIsLoading(true);
        try {
            const url = editingCoupon
                ? `/api/admin/coupons/${editingCoupon.id}`
                : "/api/admin/coupons";
            const method = editingCoupon ? "PATCH" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || "Something went wrong");
            }

            router.refresh();
            const updatedCoupons = await (await fetch("/api/admin/coupons")).json();
            setCoupons(updatedCoupons);
            onCouponOpenChange(false);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Something went wrong";
            alert(message);
        } finally {
            setIsLoading(false);
        }
    };

    const onCategoryDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this category?")) return;

        try {
            const response = await fetch(`/api/admin/categories/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || "Failed to delete");
            }

            router.refresh();
            setCategories(categories.filter(c => c.id !== id));
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to delete";
            alert(message);
        }
    };

    const onCouponDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this coupon?")) return;

        try {
            const response = await fetch(`/api/admin/coupons/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || "Failed to delete");
            }

            router.refresh();
            setCoupons(coupons.filter(c => c.id !== id));
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to delete";
            alert(message);
        }
    };

    const onCategoryStatusToggle = async (category: CategoryWithCount) => {
        try {
            const response = await fetch(`/api/admin/categories/${category.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !category.isActive }),
            });

            if (!response.ok) throw new Error("Failed to update status");

            setCategories(categories.map(c =>
                c.id === category.id ? { ...c, isActive: !c.isActive } : c
            ));
            router.refresh();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to update status";
            alert(message);
        }
    };

    const onCouponStatusToggle = async (coupon: Coupon) => {
        try {
            const response = await fetch(`/api/admin/coupons/${coupon.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !coupon.isActive }),
            });

            if (!response.ok) throw new Error("Failed to update status");

            setCoupons(coupons.map(c =>
                c.id === coupon.id ? { ...c, isActive: !c.isActive } : c
            ));
            router.refresh();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to update status";
            alert(message);
        }
    };

    // Filtered data
    const filteredCategories = useMemo(() => {
        return categories.filter(cat =>
            cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cat.slug.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [categories, searchTerm]);

    const filteredCoupons = useMemo(() => {
        return coupons.filter(coupon =>
            coupon.code.toLowerCase().includes(couponSearchTerm.toLowerCase())
        );
    }, [coupons, couponSearchTerm]);

    if (!isMounted) return null;

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
                            <Input
                                placeholder="Search categories..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button onClick={() => setIsCategoryModalOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
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
                                {filteredCategories.map((cat) => (
                                    <TableRow
                                        key={cat.id}
                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => handleCategoryEdit(cat)}
                                    >
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <div className="relative h-10 w-10 rounded-lg overflow-hidden border bg-muted">
                                                {cat.imageUrl ? (
                                                    <Image src={cat.imageUrl} alt={cat.name} fill sizes="40px" className="object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center">
                                                        <Grid className="h-4 w-4 text-muted-foreground opacity-30" />
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-bold text-primary">
                                            {cat.name}
                                            {cat.parent && (
                                                <div className="text-[10px] text-muted-foreground font-normal">
                                                    in {cat.parent.name}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs font-mono">{cat.slug}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-sm font-medium">
                                                <ShoppingBag className="mr-2 h-4 w-4 text-muted-foreground" />
                                                {cat.productCount} Items
                                            </div>
                                        </TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <Badge
                                                className={cn(
                                                    "cursor-pointer transition-all",
                                                    cat.isActive ? "bg-green-100 text-green-700 border-none hover:bg-green-200" : "bg-muted text-muted-foreground border-none hover:bg-muted/80"
                                                )}
                                                onClick={() => onCategoryStatusToggle(cat)}
                                            >
                                                {cat.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end space-x-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleCategoryEdit(cat)}><Edit className="h-4 w-4" /></Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => onCategoryDelete(cat.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredCategories.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                            No categories found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                <TabsContent value="coupons" className="space-y-6">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search coupons..."
                                className="pl-10"
                                value={couponSearchTerm}
                                onChange={(e) => setCouponSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button onClick={() => setIsCouponModalOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
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
                                {filteredCoupons.map((coupon) => (
                                    <TableRow
                                        key={coupon.id}
                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => handleCouponEdit(coupon)}
                                    >
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <span className="font-mono font-bold text-accent bg-accent/10 px-2 py-1 rounded text-sm tracking-wider">
                                                {coupon.code}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-extrabold text-primary">
                                            {coupon.type === "percentage" ? `${coupon.value}%` : `KES ${coupon.value}`}
                                        </TableCell>
                                        <TableCell className="text-sm font-medium capitalize">{coupon.type.replace('_', ' ')}</TableCell>
                                        <TableCell className="text-sm">{coupon.usedCount} / {coupon.maxUses}</TableCell>
                                        <TableCell className="text-sm font-medium">{new Date(coupon.expiresAt).toLocaleDateString()}</TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <Badge
                                                className={cn(
                                                    "cursor-pointer transition-all",
                                                    coupon.isActive ? "bg-green-100 text-green-700 border-none hover:bg-green-200" : "bg-red-100 text-red-700 border-none hover:bg-red-200"
                                                )}
                                                onClick={() => onCouponStatusToggle(coupon)}
                                            >
                                                {coupon.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end space-x-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleCouponEdit(coupon)}><Edit className="h-4 w-4" /></Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => onCouponDelete(coupon.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredCoupons.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                            No coupons found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Category Modal */}
            <Dialog open={isCategoryModalOpen} onOpenChange={onCategoryOpenChange}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
                        <DialogDescription>
                            Organize your products with categories and subcategories.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...categoryForm}>
                        <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4 py-4">
                            <FormField
                                control={categoryForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Electronics" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={categoryForm.control}
                                name="slug"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Slug</FormLabel>
                                        <FormControl>
                                            <Input placeholder="electronics" {...field} />
                                        </FormControl>
                                        <FormDescription>URL-friendly name (e.g. electronics)</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={categoryForm.control}
                                name="parentId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Parent Category</FormLabel>
                                        <Select
                                            onValueChange={(val) => field.onChange(val === "none" ? null : val)}
                                            defaultValue={field.value || "none"}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a parent (optional)" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">None (Main Category)</SelectItem>
                                                {categories
                                                    .filter(c => c.id !== editingCategory?.id && !c.parentId)
                                                    .map(c => (
                                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                    ))
                                                }
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={categoryForm.control}
                                name="imageUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Image URL</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://example.com/cat.jpg" {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={categoryForm.control}
                                name="isActive"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                        <div className="space-y-0.5">
                                            <FormLabel>Active Status</FormLabel>
                                            <FormDescription>Make this category visible in the store.</FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => onCategoryOpenChange(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading} className="bg-primary text-white">
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingCategory ? "Update Category" : "Add Category"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Coupon Modal */}
            <Dialog open={isCouponModalOpen} onOpenChange={onCouponOpenChange}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingCoupon ? "Edit Coupon" : "Create New Coupon"}</DialogTitle>
                        <DialogDescription>
                            Offer discounts to your customers with coupon codes.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...couponForm}>
                        <form onSubmit={couponForm.handleSubmit(onCouponSubmit)} className="space-y-4 py-4">
                            <FormField
                                control={couponForm.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Coupon Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="SUMMER20" {...field} className="uppercase font-mono" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={couponForm.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="percentage">Percentage</SelectItem>
                                                    <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={couponForm.control}
                                    name="value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Value</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={couponForm.control}
                                    name="minOrder"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Min. Order Amount (KES)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={couponForm.control}
                                    name="expiresAt"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Expiry Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={couponForm.control}
                                name="isActive"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                        <div className="space-y-0.5">
                                            <FormLabel>Active Status</FormLabel>
                                            <FormDescription>Allow customers to use this coupon.</FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => onCouponOpenChange(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading} className="bg-primary text-white">
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingCoupon ? "Update Coupon" : "Create Coupon"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
