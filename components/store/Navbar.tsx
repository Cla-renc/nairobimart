"use client";

import Link from "next/link";
import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search,
    ShoppingCart,
    Menu,
    X,
    User as UserIcon,
    Heart,
    ShoppingBag,
} from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import CartDrawer from "@/components/store/CartDrawer";

const Navbar = () => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const cartItemsCount = useCartStore((state) => state.getTotalItems());

    const navLinks = [
        { name: "Home", href: "/" },
        { name: "All Products", href: "/products" },
        { name: "Categories", href: "/categories" },
        { name: "About Us", href: "/about" },
        { name: "Contact", href: "/contact" },
    ];

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-4">
                {/* Mobile Menu */}
                <div className="flex items-center md:hidden">
                    <Sheet>
                        <SheetTrigger
                            render={
                                <Button variant="ghost" size="icon" className="mr-2">
                                    <Menu className="h-6 w-6" />
                                </Button>
                            }
                        />
                        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                            <SheetHeader>
                                <SheetTitle className="text-left font-bold text-primary">
                                    NairobiMart
                                </SheetTitle>
                            </SheetHeader>
                            <div className="flex flex-col gap-4 py-8">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        className="text-lg font-medium transition-colors hover:text-accent"
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </div>
                        </SheetContent>
                    </Sheet>
                    <Link href="/" className="flex items-center space-x-2">
                        <ShoppingBag className="h-6 w-6 text-accent" />
                        <span className="font-bold text-primary text-xl">NairobiMart</span>
                    </Link>
                </div>

                {/* Desktop Logo */}
                <div className="hidden md:flex items-center space-x-2">
                    <Link href="/" className="flex items-center space-x-2">
                        <ShoppingBag className="h-8 w-8 text-accent" />
                        <span className="font-bold text-primary text-2xl tracking-tight">
                            NairobiMart
                        </span>
                    </Link>
                </div>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="transition-colors hover:text-accent"
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 md:space-x-4">
                    <div className="hidden lg:flex relative w-64">
                        <Input
                            type="search"
                            placeholder="Search products..."
                            className="pl-8 h-9"
                        />
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>

                    <Button variant="ghost" size="icon" className="lg:hidden">
                        <Search className="h-5 w-5" />
                    </Button>

                    <Link href="/account/wishlist">
                        <Button variant="ghost" size="icon" className="relative">
                            <Heart className="h-5 w-5" />
                        </Button>
                    </Link>

                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <Button variant="ghost" size="icon">
                                    <UserIcon className="h-5 w-5" />
                                </Button>
                            }
                        />
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                render={<Link href="/login">Login</Link>}
                            />
                            <DropdownMenuItem
                                render={<Link href="/register">Register</Link>}
                            />
                            <DropdownMenuItem
                                render={<Link href="/account">My Profile</Link>}
                            />
                            <DropdownMenuItem
                                render={<Link href="/account/orders">My Orders</Link>}
                            />
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <CartDrawer>
                        <Button variant="ghost" size="icon" className="relative">
                            <ShoppingCart className="h-5 w-5" />
                            {cartItemsCount > 0 && (
                                <Badge
                                    className="absolute -right-1 -top-1 px-1.5 py-0.5 text-[10px] bg-accent text-accent-foreground"
                                >
                                    {cartItemsCount}
                                </Badge>
                            )}
                        </Button>
                    </CartDrawer>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
