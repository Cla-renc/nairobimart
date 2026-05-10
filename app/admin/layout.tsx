"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    Users,
    Grid,
    Tag,
    Star,
    Image as ImageIcon,
    BarChart2,
    Bell,
    Settings,
    LogOut,
    Search,
    Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetTrigger
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const adminNavItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
    { name: "Customers", href: "/admin/customers", icon: Users },
    { name: "Categories", href: "/admin/categories", icon: Grid },
    { name: "Coupons", href: "/admin/coupons", icon: Tag },
    { name: "Reviews", href: "/admin/reviews", icon: Star },
    { name: "Banners", href: "/admin/banners", icon: ImageIcon },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart2 },
    { name: "Settings", href: "/admin/settings", icon: Settings },
];

import { Toaster } from "@/components/ui/toaster";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-primary text-primary-foreground">
            <div className="p-6">
                <Link href="/admin" className="flex items-center space-x-2">
                    <ShoppingBag className="h-6 w-6 text-accent" />
                    <span className="text-xl font-bold tracking-tight">NairobiMart <span className="text-[10px] bg-accent text-accent-foreground px-1 rounded uppercase">Admin</span></span>
                </Link>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-1">
                {adminNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium",
                                isActive
                                    ? "bg-accent text-accent-foreground"
                                    : "hover:bg-primary-foreground/10 text-primary-foreground/70 hover:text-primary-foreground"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-primary-foreground/10">
                <Button variant="ghost" className="w-full justify-start text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-muted/30">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Admin Header */}
                <header className="h-16 border-b bg-white flex items-center justify-between px-4 lg:px-8">
                    <div className="flex items-center">
                        <Sheet>
                            <SheetTrigger render={
                                <Button variant="ghost" size="icon" className="lg:hidden mr-2">
                                    <Menu className="h-6 w-6" />
                                </Button>
                            } />
                            <SheetContent side="left" className="p-0 w-64">
                                <SidebarContent />
                            </SheetContent>
                        </Sheet>
                        <div className="relative hidden md:block">
                            <Input
                                placeholder="Search orders, products..."
                                className="w-64 lg:w-96 pl-10 bg-muted/50 border-none h-10"
                            />
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="icon" className="relative group">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent border-2 border-white" />
                        </Button>
                        <div className="flex items-center space-x-3 border-l pl-4">
                            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold">
                                AD
                            </div>
                            <div className="hidden sm:block text-left">
                                <p className="text-xs font-bold leading-none">Admin User</p>
                                <p className="text-[10px] text-muted-foreground mt-1">Super Admin</p>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    {children}
                </main>
            </div>
            <Toaster />
        </div>
    );
}
