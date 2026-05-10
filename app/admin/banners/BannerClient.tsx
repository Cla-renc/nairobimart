"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Image as ImageIcon,
    Plus,
    MoreVertical,
    ExternalLink,
    MoveUp,
    MoveDown,
    Eye,
    EyeOff,
    Edit,
    Trash2,
    Loader2
} from "lucide-react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";

const bannerSchema = z.object({
    title: z.string(),
    subtitle: z.string(),
    imageUrl: z.string().url("Invalid image URL"),
    linkUrl: z.string(),
    isActive: z.boolean(),
});

type BannerFormValues = {
    title: string;
    subtitle: string;
    imageUrl: string;
    linkUrl: string;
    isActive: boolean;
};

interface Banner {
    id: string;
    title: string | null;
    subtitle: string | null;
    imageUrl: string;
    linkUrl: string | null;
    position: number;
    isActive: boolean;
    startsAt: Date | null;
    endsAt: Date | null;
    createdAt: Date;
}

interface BannerClientProps {
    banners: Banner[];
}

export default function BannerClient({ banners }: BannerClientProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<BannerFormValues>({
        resolver: zodResolver(bannerSchema),
        defaultValues: {
            title: "",
            subtitle: "",
            imageUrl: "",
            linkUrl: "",
            isActive: true,
        },
    });

    const onOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setEditingBanner(null);
            form.reset({
                title: "",
                subtitle: "",
                imageUrl: "",
                linkUrl: "",
                isActive: true,
            });
        }
    };

    const onEdit = (banner: Banner) => {
        setEditingBanner(banner);
        form.reset({
            title: banner.title || "",
            subtitle: banner.subtitle || "",
            imageUrl: banner.imageUrl,
            linkUrl: banner.linkUrl || "",
            isActive: banner.isActive,
        });
        setIsOpen(true);
    };

    const onSubmit = async (data: BannerFormValues) => {
        setIsLoading(true);
        try {
            if (editingBanner) {
                await fetch(`/api/admin/banners/${editingBanner.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });
            } else {
                await fetch("/api/admin/banners", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });
            }
            router.refresh();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const onDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this banner?")) return;

        try {
            await fetch(`/api/admin/banners/${id}`, {
                method: "DELETE",
            });
            router.refresh();
        } catch (error) {
            console.error(error);
        }
    };

    const onToggleVisibility = async (banner: Banner) => {
        try {
            await fetch(`/api/admin/banners/${banner.id}`, {
                method: "PATCH",
                body: JSON.stringify({ isActive: !banner.isActive }),
            });
            router.refresh();
        } catch (error) {
            console.error(error);
        }
    };

    const onReorder = async (id: string, direction: "up" | "down") => {
        try {
            const response = await fetch(`/api/admin/banners/${id}/reorder`, {
                method: "POST",
                body: JSON.stringify({ direction }),
            });
            if (response.ok) {
                router.refresh();
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Store Banners</h1>
                    <p className="text-muted-foreground mt-1">Manage homepage banners and promotional images.</p>
                </div>
                <Button onClick={() => setIsOpen(true)} className="bg-primary hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" /> Add New Banner
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {banners.length > 0 ? (
                    banners.map((banner) => (
                        <Card key={banner.id} className={cn("border-none shadow-sm overflow-hidden group", !banner.isActive && "opacity-60")}>
                            <div className="aspect-[21/9] bg-muted relative overflow-hidden">
                                <Image
                                    src={banner.imageUrl}
                                    alt={banner.title || "Banner"}
                                    fill
                                    sizes="100vw"
                                    className="object-cover transition-transform group-hover:scale-105 duration-500"
                                />
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <Badge variant={banner.isActive ? "default" : "secondary"} className="bg-white/80 backdrop-blur-sm text-primary border-none shadow-sm">
                                        {banner.isActive ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                                        {banner.isActive ? "Visible" : "Hidden"}
                                    </Badge>
                                </div>
                            </div>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="overflow-hidden">
                                        <h4 className="font-bold text-lg text-primary truncate leading-tight">{banner.title || "No Title"}</h4>
                                        <p className="text-xs text-muted-foreground truncate">{banner.subtitle || "No Subtitle"}</p>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-1">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onEdit(banner)}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit Banner
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onToggleVisibility(banner)}>
                                                {banner.isActive ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                                                {banner.isActive ? "Hide" : "Show"}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => onDelete(banner.id)} className="text-red-600">
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                                    <div className="flex gap-1">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7 rounded-lg"
                                            onClick={() => onReorder(banner.id, "up")}
                                        >
                                            <MoveUp className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7 rounded-lg"
                                            onClick={() => onReorder(banner.id, "down")}
                                        >
                                            <MoveDown className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                                        Pos: {banner.position}
                                    </Badge>
                                </div>
                                {banner.linkUrl && (
                                    <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1">
                                        <ExternalLink className="h-2.5 w-2.5" /> {banner.linkUrl}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card className="col-span-full border-none shadow-sm p-12 text-center">
                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <ImageIcon className="h-8 w-8 text-muted-foreground opacity-30" />
                        </div>
                        <h3 className="text-xl font-bold text-primary">No banners found</h3>
                        <p className="text-muted-foreground mt-2 mb-6">Create promotional banners to highlight your best deals.</p>
                        <Button onClick={() => setIsOpen(true)} className="bg-primary hover:bg-primary/90">
                            <Plus className="mr-2 h-4 w-4" /> Create First Banner
                        </Button>
                    </Card>
                )}
            </div>

            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingBanner ? "Edit Banner" : "Add New Banner"}</DialogTitle>
                        <DialogDescription>
                            Enter the details for your homepage promotional banner.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Extra 20% Off" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="subtitle"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Subtitle</FormLabel>
                                        <FormControl>
                                            <Input placeholder="On all electronics this weekend" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="imageUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Image URL</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://example.com/banner.jpg" {...field} />
                                        </FormControl>
                                        <FormDescription>Link to an image (e.g. from CJDropshipping or Unsplash)</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="linkUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Link URL</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://nairobimart.co.ke/products/..." {...field} />
                                        </FormControl>
                                        <FormDescription>Where should users go when clicking the banner?</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="isActive"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                        <div className="space-y-0.5">
                                            <FormLabel>Active Status</FormLabel>
                                            <FormDescription>
                                                Make this banner visible on the homepage immediately.
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
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading} className="bg-primary text-white">
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingBanner ? "Update Banner" : "Create Banner"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
