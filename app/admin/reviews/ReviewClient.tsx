"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    MessageSquare,
    Star,
    CheckCircle2,
    XCircle,
    MoreVertical,
    Search,
    Filter,
    Package,
    Trash2,
    Loader2
} from "lucide-react";
import Image from "next/image";
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
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Review {
    id: string;
    rating: number;
    title: string | null;
    body: string;
    isApproved: boolean;
    createdAt: string | Date; // handle both serialized string and Date object
    product: {
        name: string;
        images: { url: string }[];
    };
    user: {
        name: string | null;
        email: string;
    };
}

interface ReviewClientProps {
    initialReviews: Review[];
}

export default function ReviewClient({ initialReviews }: ReviewClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState<string | null>(null);

    useEffect(() => {
        const query = searchParams.get("search");
        if (query) setSearchTerm(query);
    }, [searchParams]);

    const filteredReviews = initialReviews.filter((review) => {
        const searchStr = searchTerm.toLowerCase();
        return (
            review.product.name.toLowerCase().includes(searchStr) ||
            review.user.email.toLowerCase().includes(searchStr) ||
            (review.user.name?.toLowerCase().includes(searchStr) || false) ||
            (review.title?.toLowerCase().includes(searchStr) || false) ||
            review.body.toLowerCase().includes(searchStr)
        );
    });

    const pendingCount = initialReviews.filter(r => !r.isApproved).length;
    const averageRating = initialReviews.length > 0
        ? (initialReviews.reduce((acc, r) => acc + r.rating, 0) / initialReviews.length).toFixed(1)
        : "0.0";

    const onToggleApproval = async (id: string, currentStatus: boolean) => {
        setIsLoading(id);
        try {
            const response = await fetch(`/api/admin/reviews/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isApproved: !currentStatus }),
            });

            if (response.ok) {
                router.refresh();
            }
        } catch (error) {
            console.error("Failed to toggle approval", error);
        } finally {
            setIsLoading(null);
        }
    };

    const onDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this review?")) return;

        setIsLoading(id);
        try {
            const response = await fetch(`/api/admin/reviews/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                router.refresh();
            }
        } catch (error) {
            console.error("Failed to delete review", error);
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Product Reviews</h1>
                    <p className="text-muted-foreground mt-1">Moderate and manage customer feedback for your products.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        Export Reviews
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground uppercase">Pending Approval</p>
                                <h3 className="text-3xl font-bold mt-1 text-orange-600">{pendingCount}</h3>
                            </div>
                            <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                                <MessageSquare className="h-6 w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground uppercase">Average Rating</p>
                                <h3 className="text-3xl font-bold mt-1 text-primary">{averageRating}</h3>
                            </div>
                            <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                                <Star className="h-6 w-6 fill-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground uppercase">Total Reviews</p>
                                <h3 className="text-3xl font-bold mt-1">{initialReviews.length}</h3>
                            </div>
                            <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                <MessageSquare className="h-6 w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <CardTitle>Recent Feedback</CardTitle>
                        <div className="flex w-full md:w-auto items-center gap-2">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search reviews..."
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
                                <TableHead className="w-[300px]">Product</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Rating</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredReviews.length > 0 ? (
                                filteredReviews.map((review) => (
                                    <TableRow key={review.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground overflow-hidden border">
                                                    {review.product.images[0] ? (
                                                        <Image
                                                            src={review.product.images[0].url}
                                                            alt={review.product.name}
                                                            fill
                                                            sizes="40px"
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <Package className="h-5 w-5 opacity-20" />
                                                    )}
                                                </div>
                                                <div className="max-w-[200px]">
                                                    <p className="font-bold text-sm line-clamp-1 truncate">{review.product.name}</p>
                                                    <p className="text-xs text-muted-foreground italic line-clamp-1 truncate">&quot;{review.title || review.body.slice(0, 30)}...&quot;</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-bold text-sm">{review.user.name || "NairobiMart User"}</p>
                                                <p className="text-xs text-muted-foreground">{review.user.email}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Star
                                                        key={s}
                                                        className={cn(
                                                            "h-3.5 w-3.5",
                                                            s <= review.rating ? "fill-orange-400 text-orange-400" : "text-muted/30"
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={review.isApproved ? "default" : "secondary"} className={review.isApproved ? "bg-green-100 text-green-700 hover:bg-green-100 border-none px-2" : "bg-orange-100 text-orange-700 hover:bg-orange-100 border-none px-2"}>
                                                {review.isApproved ? "Approved" : "Pending"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {format(new Date(review.createdAt), "MMM dd, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isLoading === review.id}>
                                                        {isLoading === review.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <MoreVertical className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => onToggleApproval(review.id, review.isApproved)}>
                                                        {review.isApproved ? (
                                                            <><XCircle className="mr-2 h-4 w-4" /> Reject</>
                                                        ) : (
                                                            <><CheckCircle2 className="mr-2 h-4 w-4" /> Approve</>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>View Full Review</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => onDelete(review.id)} className="text-red-600">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        {searchTerm ? "No reviews match your search." : "No reviews yet. Feedback will appear here as customers share their thoughts."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
