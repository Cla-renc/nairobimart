"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Ticket,
    Plus,
    Search,
    Filter,
    MoreVertical,
    Tag,
    Clock,
    CheckCircle2,
    XCircle,
    Trash2,
    Edit,
    Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
    code: z.string().min(3, "Code must be at least 3 characters").toUpperCase(),
    type: z.enum(["percentage", "fixed_amount"]),
    value: z.number().min(0, "Value must be positive"),
    minOrder: z.number().min(0, "Minimum order must be positive"),
    maxUses: z.number().min(1, "Max uses must be at least 1"),
    expiresAt: z.string().min(1, "Expiration date is required"),
});

type CouponFormValues = z.infer<typeof formSchema>;

interface Coupon {
    id: string;
    code: string;
    type: "percentage" | "fixed_amount";
    value: number;
    minOrder: number;
    maxUses: number;
    usedCount: number;
    expiresAt: string | Date; // handle both
    isActive: boolean;
    createdAt: string | Date;
}

interface CouponClientProps {
    initialCoupons: Coupon[];
}

export default function CouponClient({ initialCoupons }: CouponClientProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

    const form = useForm<CouponFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            code: "",
            type: "percentage",
            value: 0,
            minOrder: 0,
            maxUses: 100,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
    });

    const filteredCoupons = initialCoupons.filter((coupon) =>
        coupon.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const onOpenAdd = () => {
        setEditingCoupon(null);
        form.reset({
            code: "",
            type: "percentage",
            value: 0,
            minOrder: 0,
            maxUses: 100,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
        setIsModalOpen(true);
    };

    const onOpenEdit = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        form.reset({
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            minOrder: coupon.minOrder,
            maxUses: coupon.maxUses,
            expiresAt: new Date(coupon.expiresAt).toISOString().split('T')[0],
        });
        setIsModalOpen(true);
    };

    const onSubmit = async (values: CouponFormValues) => {
        setIsLoading("form");
        try {
            const url = editingCoupon
                ? `/api/admin/coupons/${editingCoupon.id}`
                : "/api/admin/coupons";
            const method = editingCoupon ? "PATCH" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...values,
                    isActive: editingCoupon?.isActive ?? true
                }),
            });

            if (response.ok) {
                setIsModalOpen(false);
                router.refresh();
            }
        } catch (error) {
            console.error("Failed to save coupon", error);
        } finally {
            setIsLoading(null);
        }
    };

    const onToggleStatus = async (id: string, currentStatus: boolean) => {
        setIsLoading(id);
        try {
            const response = await fetch(`/api/admin/coupons/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !currentStatus }),
            });

            if (response.ok) {
                router.refresh();
            }
        } catch (error) {
            console.error("Failed to toggle status", error);
        } finally {
            setIsLoading(null);
        }
    };

    const onDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this coupon?")) return;

        setIsLoading(id);
        try {
            const response = await fetch(`/api/admin/coupons/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                router.refresh();
            }
        } catch (error) {
            console.error("Failed to delete coupon", error);
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Coupons & Discounts</h1>
                    <p className="text-muted-foreground mt-1">Manage store-wide discount codes and promotions.</p>
                </div>
                <Button onClick={onOpenAdd} className="bg-primary hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" /> Create Coupon
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-primary/10 text-primary rounded-xl">
                                <Ticket className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-bold">Active</p>
                                <h4 className="text-xl font-bold">{initialCoupons.filter(c => c.isActive).length}</h4>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <CardTitle>Active Coupons</CardTitle>
                        <div className="flex w-full md:w-auto items-center gap-2">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search coupon code..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead>Usage</TableHead>
                                <TableHead>Expires</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCoupons.length > 0 ? (
                                filteredCoupons.map((coupon) => (
                                    <TableRow key={coupon.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-accent/10 text-accent rounded-lg">
                                                    <Tag className="h-3.5 w-3.5" />
                                                </div>
                                                <span className="font-mono font-bold text-primary">{coupon.code}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="capitalize text-xs">
                                            {coupon.type.replace('_', ' ')}
                                        </TableCell>
                                        <TableCell className="font-bold">
                                            {coupon.type === 'percentage' ? `${coupon.value}%` : `KES ${coupon.value.toLocaleString()}`}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium">{coupon.usedCount} / {coupon.maxUses}</span>
                                                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary"
                                                        style={{ width: `${Math.min((coupon.usedCount / coupon.maxUses) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                {format(new Date(coupon.expiresAt), "MMM dd, yyyy")}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={coupon.isActive ? "default" : "secondary"}
                                                className={cn(
                                                    "border-none",
                                                    coupon.isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : ""
                                                )}
                                            >
                                                {coupon.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild disabled={isLoading === coupon.id}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        {isLoading === coupon.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <MoreVertical className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => onOpenEdit(coupon)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit Coupon
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => onToggleStatus(coupon.id, coupon.isActive)}>
                                                        {coupon.isActive ? (
                                                            <><XCircle className="mr-2 h-4 w-4" /> Deactivate</>
                                                        ) : (
                                                            <><CheckCircle2 className="mr-2 h-4 w-4" /> Activate</>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => onDelete(coupon.id)} className="text-red-600">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        No coupons found. Create your first one to get started!
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Modal for Create/Edit */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCoupon ? "Edit Coupon" : "Create New Coupon"}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Coupon Code</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="e.g. WELCOME20" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Discount Type</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                                                    <SelectItem value="fixed_amount">Fixed Amount (KES)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Discount Value</FormLabel>
                                            <FormControl>
                                                <Input {...field} type="number" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="minOrder"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Min Order (KES)</FormLabel>
                                            <FormControl>
                                                <Input {...field} type="number" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="maxUses"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Max Uses</FormLabel>
                                            <FormControl>
                                                <Input {...field} type="number" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="expiresAt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Expiration Date</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="date" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter className="pt-4">
                                <Button type="submit" disabled={isLoading === "form"}>
                                    {isLoading === "form" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
