"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
    Plus,
    Trash2,
    Loader2,
    ExternalLink,
    ArrowLeft
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useRef, type ChangeEvent } from "react";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";

const productSchema = z.object({
    name: z.string().min(2, "Product name is required"),
    slug: z.string().min(2, "Slug is required"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    price: z.number().min(0, "Price must be positive"),
    comparePrice: z.number().optional(),
    sku: z.string().min(2, "SKU is required"),
    stock: z.number().min(0, "Stock cannot be negative"),
    category: z.string().min(1, "Category is required"),
    status: z.string().min(1, "Status is required"),
    cjProductId: z.string().optional().or(z.literal("")),
    isFlashSale: z.boolean().optional(),
    flashSalePrice: z.number().optional(),
    flashSaleEndsAt: z.string().optional().or(z.literal("")),
    images: z.array(z.union([z.string(), z.object({ url: z.string(), publicId: z.string().optional() })])).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const ProductForm = ({ initialData, productId }: { initialData?: Partial<ProductFormValues>, productId?: string }) => {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingImages, setIsUploadingImages] = useState(false);
    const [uploadedImages, setUploadedImages] = useState<{ url: string; publicId?: string }[]>(
        initialData?.images?.map((image) => (typeof image === "string" ? { url: image } : image)) || []
    );
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const fileToDataUrl = (file: File) =>
        new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(file);
        });

    const uploadProductImages = async (files: FileList) => {
        if (!files.length) return;
        setIsUploadingImages(true);

        try {
            const uploaded: { url: string; publicId?: string }[] = [];

            for (const file of Array.from(files)) {
                const dataUrl = await fileToDataUrl(file);
                const res = await fetch("/api/admin/products/upload-image", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ file: dataUrl, fileName: file.name }),
                });

                if (!res.ok) {
                    throw new Error("Image upload failed");
                }

                const json = await res.json();
                uploaded.push({ url: json.url, publicId: json.publicId });
            }

            setUploadedImages((prev) => [...prev, ...uploaded]);
            toast({ title: "Images uploaded", description: `${uploaded.length} image${uploaded.length === 1 ? "" : "s"} added.` });
        } catch {
            toast({ title: "Upload failed", description: "Unable to upload product images. Please try again.", variant: "destructive" });
        } finally {
            setIsUploadingImages(false);
        }
    };

    const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files?.length) return;

        await uploadProductImages(event.target.files);
        event.target.value = "";
    };

    const removeImage = (index: number) => {
        setUploadedImages((prev) => prev.filter((_, idx) => idx !== index));
    };

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: initialData?.name || "",
            slug: initialData?.slug || "",
            description: initialData?.description || "",
            price: initialData?.price || 0,
            comparePrice: initialData?.comparePrice || 0,
            sku: initialData?.sku || "",
            stock: initialData?.stock || 0,
            category: initialData?.category || "",
            status: initialData?.status || "Active",
            cjProductId: initialData?.cjProductId || "",
            isFlashSale: initialData?.isFlashSale || false,
            flashSalePrice: initialData?.flashSalePrice || 0,
            flashSaleEndsAt: initialData?.flashSaleEndsAt || "",
            images: initialData?.images?.map((image) => (typeof image === "string" ? image : image.url)) || [],
        },
    });

    const onSubmit = async (values: ProductFormValues) => {
        setIsSubmitting(true);
        try {
            const url = productId
                ? `/api/admin/products/${productId}`
                : "/api/admin/products";

            const method = productId ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...values,
                    images: uploadedImages.map((image) => image.url),
                }),
            });

            if (!res.ok) throw new Error("Something went wrong");

            toast({
                title: productId ? "Product updated" : "Product created",
                description: `Successfully ${productId ? "updated" : "published"} ${values.name}.`,
            });

            router.push("/admin/products");
            router.refresh();
        } catch {
            toast({
                title: "Error",
                description: "Failed to save product. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button asChild variant="outline" size="icon">
                            <Link href="/admin/products"><ArrowLeft className="h-4 w-4" /></Link>
                        </Button>
                        <h1 className="text-3xl font-extrabold text-primary">
                            {initialData ? "Edit Product" : "New Product"}
                        </h1>
                    </div>
                    <div className="flex space-x-3">
                        <Button variant="outline" type="button" disabled={isSubmitting}>Save as Draft</Button>
                        <Button className="bg-accent text-accent-foreground hover:bg-accent/90" type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {initialData ? "Update Product" : "Publish Product"}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                                <CardDescription>Enter the name, description and slug for your product.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Product Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Premium Noise Cancelling Earbuds" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="slug"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Slug</FormLabel>
                                            <FormControl>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-xs text-muted-foreground">nairobimart.co.ke/products/</span>
                                                    <Input placeholder="earbuds-pro" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormDescription>The URL-friendly version of the name.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Tell customers more about this product..."
                                                    className="min-h-[200px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle>Media Gallery</CardTitle>
                                <CardDescription>Upload high-quality product images to attract customers.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageChange}
                                />
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <button
                                        type="button"
                                        disabled={isUploadingImages}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {isUploadingImages ? (
                                            <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
                                        ) : (
                                            <Plus className="h-8 w-8 text-muted-foreground" />
                                        )}
                                        <span className="text-xs text-muted-foreground mt-2 font-medium">
                                            {isUploadingImages ? "Uploading..." : "Add Images"}
                                        </span>
                                    </button>
                                    {uploadedImages.map((image, index) => (
                                        <div key={`${image.url}-${index}`} className="aspect-square rounded-xl overflow-hidden relative">
                                            <Image
                                                src={image.url}
                                                alt={`Product image ${index + 1}`}
                                                fill
                                                sizes="200px"
                                                unoptimized
                                                className="object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-md shadow-lg"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-4">Accepted formats: JPG, PNG, WEBP. Max size: 2MB per image.</p>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle>Inventory & Pricing</CardTitle>
                                <CardDescription>Configure stock details and pricing strategy.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Selling Price (KES)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="comparePrice"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Compare at Price (KES)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="sku"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>SKU (Stock Keeping Unit)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. EAR-PRO-001" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="stock"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Available Stock</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {/* Flash Sale Configuration */}
                        <Card className="border-none shadow-sm bg-red-50/50 ring-1 ring-red-100">
                            <CardHeader>
                                <CardTitle className="text-red-600">Flash Sale Configuration</CardTitle>
                                <CardDescription>Set up a limited-time offer for this product.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="isFlashSale"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-white">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base font-bold">Enable Flash Sale</FormLabel>
                                                <FormDescription>
                                                    Show this product in the homepage flash sales section.
                                                </FormDescription>
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

                                {form.watch("isFlashSale") && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-white mt-4">
                                        <FormField
                                            control={form.control}
                                            name="flashSalePrice"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Flash Sale Price (KES)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="flashSaleEndsAt"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Ends At (Date & Time)</FormLabel>
                                                    <FormControl>
                                                        <Input type="datetime-local" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-8">
                        <Card className="border-none shadow-sm overflow-hidden">
                            <div className="h-2 bg-accent w-full" />
                            <CardHeader>
                                <CardTitle>Product Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Active">Active (Live on store)</SelectItem>
                                                    <SelectItem value="Draft">Draft (Hidden)</SelectItem>
                                                    <SelectItem value="Archived">Archived</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="pt-2">
                                    <div className="flex items-center justify-between text-xs mb-2">
                                        <span className="text-muted-foreground">Visibiltiy</span>
                                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Public</Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Last Edited</span>
                                        <span className="font-medium">2 mins ago</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle>Organization</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Product Category</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a category" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Electronics">Electronics</SelectItem>
                                                    <SelectItem value="Accessories">Accessories</SelectItem>
                                                    <SelectItem value="Fashion">Fashion</SelectItem>
                                                    <SelectItem value="Home">Home & Kitchen</SelectItem>
                                                    <SelectItem value="Gifts">Gifts</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="space-y-2">
                                    <Label>Tags</Label>
                                    <Input placeholder="Add tags (commas to separate)" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-accent/5 ring-1 ring-accent/20">
                            <CardHeader>
                                <CardTitle className="flex items-center text-accent">
                                    <ExternalLink className="mr-2 h-5 w-5" /> CJDropshipping Sync
                                </CardTitle>
                                <CardDescription>Link this product to a CJ Dropshipping listing.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="cjProductId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>CJ Product ID</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 1CFB12345" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button variant="outline" className="w-full text-xs font-bold border-accent text-accent hover:bg-accent hover:text-white" type="button">
                                    FETCH DETAILS FROM CJ
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </Form>
    );
};

export default ProductForm;

// Explicitly import Label since I used it manually
import { Label } from "@/components/ui/label";
