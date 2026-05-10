"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    Users, Search, Filter, MoreVertical, Mail, Phone, Calendar,
    Shield, User as UserIcon, X, ShoppingBag, Star, Download,
    ChevronDown, AlertTriangle, Trash2, Eye, RefreshCw, ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

type Order = {
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    createdAt: string;
};

type Customer = {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    role: string;
    image: string | null;
    createdAt: string;
    orderCount: number;
    reviewCount: number;
    totalSpent: number;
};

type CustomerDetail = Customer & {
    orders: Order[];
    _count?: { orders: number; reviews: number; wishlist: number };
    totalSpent: number;
};

export default function CustomersClient() {
    const { toast } = useToast();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<"" | "admin" | "customer">("");
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Customer | null>(null);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    const fetchCustomers = useCallback(async (q = search, role = roleFilter) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (q) params.set("search", q);
            if (role) params.set("role", role);
            const res = await fetch(`/api/admin/customers?${params}`);
            if (!res.ok) throw new Error("Failed to load");
            const data = await res.json();
            setCustomers(data);
        } catch {
            toast({ title: "Error", description: "Failed to load customers", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [search, roleFilter, toast]);

    useEffect(() => {
        fetchCustomers("", "");
    }, [fetchCustomers]);

    // Debounced search
    const handleSearch = (val: string) => {
        setSearch(val);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => fetchCustomers(val, roleFilter), 400);
    };

    const handleRoleFilter = (role: "" | "admin" | "customer") => {
        setRoleFilter(role);
        fetchCustomers(search, role);
    };

    const openCustomer = async (customer: Customer) => {
        setDrawerOpen(true);
        setDetailLoading(true);
        setSelectedCustomer(null);
        try {
            const res = await fetch(`/api/admin/customers/${customer.id}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setSelectedCustomer(data);
        } catch {
            toast({ title: "Error", description: "Failed to load customer details", variant: "destructive" });
            setDrawerOpen(false);
        } finally {
            setDetailLoading(false);
        }
    };

    const changeRole = async (customer: Customer, newRole: "admin" | "customer") => {
        setActionLoading(customer.id + "_role");
        try {
            const res = await fetch(`/api/admin/customers/${customer.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole }),
            });
            if (!res.ok) throw new Error();
            toast({
                title: "Role updated",
                description: `${customer.name} is now a ${newRole}.`,
            });
            fetchCustomers();
            if (selectedCustomer?.id === customer.id) {
                setSelectedCustomer(prev => prev ? { ...prev, role: newRole } : prev);
            }
        } catch {
            toast({ title: "Error", description: "Failed to update role", variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const deleteCustomer = async (customer: Customer) => {
        setActionLoading(customer.id + "_delete");
        setConfirmDelete(null);
        try {
            const res = await fetch(`/api/admin/customers/${customer.id}`, { method: "DELETE" });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text);
            }
            toast({ title: "Customer removed", description: `${customer.name}'s account has been deleted.` });
            setCustomers(prev => prev.filter(c => c.id !== customer.id));
            if (drawerOpen && selectedCustomer?.id === customer.id) {
                setDrawerOpen(false);
                setSelectedCustomer(null);
            }
        } catch (e: unknown) {
            toast({ title: "Error", description: e instanceof Error ? e.message : "Failed to delete customer", variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const exportCSV = () => {
        const headers = ["Name", "Email", "Phone", "Role", "Orders", "Total Spent", "Joined"];
        const rows = customers.map(c => [
            c.name || "", c.email || "", c.phone || "", c.role,
            c.orderCount, `KES ${c.totalSpent.toLocaleString()}`,
            format(new Date(c.createdAt), "MMM dd, yyyy")
        ]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "customers.csv"; a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Exported!", description: "Customer list downloaded as CSV." });
    };

    const stats = {
        total: customers.length,
        activeThisMonth: customers.filter(c => new Date(c.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
        admins: customers.filter(c => c.role === "admin").length,
    };

    const getRoleBadge = (role: string) => {
        if (role === "admin") return <Badge className="bg-purple-100 text-purple-700 border-purple-200 capitalize">Admin</Badge>;
        return <Badge variant="secondary" className="capitalize">Customer</Badge>;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Customer Management</h1>
                    <p className="text-muted-foreground mt-1">View and manage your NairobiMart customer base.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => fetchCustomers()} title="Refresh">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button className="bg-primary hover:bg-primary/90" onClick={exportCSV}>
                        <Download className="h-4 w-4 mr-2" /> Export List
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-blue-50/50">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600 uppercase tracking-wider">Total Customers</p>
                                <h3 className="text-3xl font-bold mt-1">{loading ? "—" : stats.total}</h3>
                            </div>
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl"><Users className="h-6 w-6" /></div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-green-50/50">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-600 uppercase tracking-wider">Active This Month</p>
                                <h3 className="text-3xl font-bold mt-1">{loading ? "—" : stats.activeThisMonth}</h3>
                            </div>
                            <div className="p-3 bg-green-100 text-green-600 rounded-2xl"><Calendar className="h-6 w-6" /></div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-purple-50/50">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-purple-600 uppercase tracking-wider">Admin Users</p>
                                <h3 className="text-3xl font-bold mt-1">{loading ? "—" : stats.admins}</h3>
                            </div>
                            <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl"><Shield className="h-6 w-6" /></div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <CardTitle>All Customers</CardTitle>
                        <div className="flex w-full md:w-auto items-center gap-2">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search name or email..."
                                    className="pl-10"
                                    value={search}
                                    onChange={e => handleSearch(e.target.value)}
                                />
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="gap-1">
                                        <Filter className="h-4 w-4" />
                                        {roleFilter ? <span className="capitalize">{roleFilter}</span> : "All Roles"}
                                        <ChevronDown className="h-3 w-3 ml-1" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleRoleFilter("")}>All Roles</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleRoleFilter("customer")}>Customers</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleRoleFilter("admin")}>Admins</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[250px]">Customer</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Orders</TableHead>
                                <TableHead>Total Spent</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 7 }).map((_, j) => (
                                            <TableCell key={j}>
                                                <div className="h-4 bg-muted animate-pulse rounded" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : customers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                        <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                        No customers found
                                    </TableCell>
                                </TableRow>
                            ) : customers.map(customer => (
                                <TableRow
                                    key={customer.id}
                                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                                    onClick={() => openCustomer(customer)}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                                                {customer.name?.charAt(0)?.toUpperCase() || "U"}
                                            </div>
                                            <div>
                                                <p className="font-bold">{customer.name || "Unnamed User"}</p>
                                                <p className="text-xs text-muted-foreground">ID: {customer.id.slice(-6)}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Mail className="h-3 w-3" /> {customer.email}
                                            </div>
                                            {customer.phone && (
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Phone className="h-3 w-3" /> {customer.phone}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{getRoleBadge(customer.role)}</TableCell>
                                    <TableCell>
                                        <span className="font-medium">{customer.orderCount ?? 0}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-medium text-green-700">
                                            KES {(customer.totalSpent ?? 0).toLocaleString()}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {format(new Date(customer.createdAt), "MMM dd, yyyy")}
                                    </TableCell>
                                    <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost" size="icon" className="h-8 w-8"
                                                    disabled={!!actionLoading}
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => openCustomer(customer)}>
                                                    <Eye className="mr-2 h-4 w-4" /> View Profile
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {customer.role !== "admin" ? (
                                                    <DropdownMenuItem onClick={() => changeRole(customer, "admin")}>
                                                        <Shield className="mr-2 h-4 w-4 text-purple-600" />
                                                        Promote to Admin
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem onClick={() => changeRole(customer, "customer")}>
                                                        <UserIcon className="mr-2 h-4 w-4" />
                                                        Demote to Customer
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600 focus:text-red-600"
                                                    onClick={() => setConfirmDelete(customer)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Customer Detail Drawer */}
            {drawerOpen && (
                <div className="fixed inset-0 z-50 flex">
                    {/* Backdrop */}
                    <div
                        className="flex-1 bg-black/40 backdrop-blur-sm"
                        onClick={() => setDrawerOpen(false)}
                    />
                    {/* Drawer Panel */}
                    <div className="w-full max-w-md bg-background shadow-2xl overflow-y-auto border-l animate-in slide-in-from-right duration-300">
                        <div className="p-6 space-y-6">
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold">Customer Profile</h2>
                                <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(false)}>
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            {detailLoading || !selectedCustomer ? (
                                <div className="space-y-4">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
                                    ))}
                                </div>
                            ) : (
                                <>
                                    {/* Avatar + Name */}
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                                            {selectedCustomer.name?.charAt(0)?.toUpperCase() || "U"}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold">{selectedCustomer.name || "Unnamed User"}</h3>
                                            <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                                            {getRoleBadge(selectedCustomer.role)}
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-muted/50 rounded-xl p-3 text-center">
                                            <ShoppingBag className="h-5 w-5 mx-auto text-primary mb-1" />
                                            <p className="text-xl font-bold">{selectedCustomer._count?.orders ?? selectedCustomer.orderCount ?? 0}</p>
                                            <p className="text-xs text-muted-foreground">Orders</p>
                                        </div>
                                        <Link
                                            href={`/admin/reviews?search=${selectedCustomer.email}`}
                                            className="bg-muted/50 rounded-xl p-3 text-center hover:bg-muted transition-colors cursor-pointer"
                                        >
                                            <Star className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
                                            <p className="text-xl font-bold">{selectedCustomer._count?.reviews ?? 0}</p>
                                            <p className="text-xs text-muted-foreground">Reviews</p>
                                        </Link>
                                        <div className="bg-green-50 rounded-xl p-3 text-center">
                                            <p className="text-xs font-semibold text-green-600 uppercase mb-1">Spent</p>
                                            <p className="text-sm font-bold text-green-700">
                                                KES {(selectedCustomer.totalSpent ?? 0).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Contact Info */}
                                    <div className="space-y-2">
                                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contact</p>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <a href={`mailto:${selectedCustomer.email}`} className="hover:underline text-primary">
                                                {selectedCustomer.email}
                                            </a>
                                        </div>
                                        {selectedCustomer.phone && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <a href={`tel:${selectedCustomer.phone}`} className="hover:underline text-primary">
                                                    {selectedCustomer.phone}
                                                </a>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            Joined {format(new Date(selectedCustomer.createdAt), "MMMM dd, yyyy")}
                                        </div>
                                    </div>

                                    {/* Recent Orders */}
                                    {selectedCustomer.orders && selectedCustomer.orders.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Recent Orders</p>
                                                <Link
                                                    href={`/admin/orders?search=${selectedCustomer.email}`}
                                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                                >
                                                    View All <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            </div>
                                            <div className="divide-y rounded-xl border border-muted-foreground/10 overflow-hidden bg-muted/5">
                                                {selectedCustomer.orders.map(order => (
                                                    <Link
                                                        key={order.id}
                                                        href={`/admin/orders?search=${order.orderNumber}`}
                                                        className="flex items-center justify-between p-4 text-sm hover:bg-primary/5 transition-colors group"
                                                    >
                                                        <div>
                                                            <p className="font-bold group-hover:text-primary transition-colors">#{order.orderNumber}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {format(new Date(order.createdAt), "MMM dd, yyyy")}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-foreground">KES {order.total.toLocaleString()}</p>
                                                            <Badge
                                                                variant="outline"
                                                                className={`text-[10px] px-1.5 h-5 capitalize ${order.status === "delivered" ? "text-green-600 bg-green-50 border-green-200" :
                                                                    order.status === "pending" ? "text-yellow-600 bg-yellow-50 border-yellow-200" :
                                                                        "text-blue-600 bg-blue-50 border-blue-200"
                                                                    }`}
                                                            >
                                                                {order.status}
                                                            </Badge>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="space-y-2 pt-2 border-t">
                                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Actions</p>
                                        <div className="flex gap-2 flex-wrap">
                                            {selectedCustomer.role !== "admin" ? (
                                                <Button
                                                    size="sm" variant="outline"
                                                    className="gap-1"
                                                    disabled={actionLoading === selectedCustomer.id + "_role"}
                                                    onClick={() => changeRole(selectedCustomer, "admin")}
                                                >
                                                    <Shield className="h-4 w-4 text-purple-600" /> Promote to Admin
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm" variant="outline"
                                                    disabled={actionLoading === selectedCustomer.id + "_role"}
                                                    onClick={() => changeRole(selectedCustomer, "customer")}
                                                >
                                                    <UserIcon className="h-4 w-4" /> Demote to Customer
                                                </Button>
                                            )}
                                            <Button
                                                size="sm" variant="destructive"
                                                disabled={!!actionLoading}
                                                onClick={() => {
                                                    setDrawerOpen(false);
                                                    setConfirmDelete(selectedCustomer);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" /> Delete Account
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
                    <div className="relative bg-background rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 space-y-4 border">
                        <div className="flex items-center gap-3 text-red-500">
                            <div className="p-2 bg-red-50 rounded-full">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold">Delete Account</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Are you sure you want to permanently delete{" "}
                            <span className="font-semibold text-foreground">{confirmDelete.name || "this user"}</span>?
                            This action cannot be undone.
                        </p>
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                            <Button
                                variant="destructive"
                                disabled={actionLoading === confirmDelete.id + "_delete"}
                                onClick={() => deleteCustomer(confirmDelete)}
                            >
                                {actionLoading === confirmDelete.id + "_delete" ? "Deleting..." : "Delete"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
