"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search,
    ShoppingCart,
    Menu,
    User as UserIcon,
    Heart,
} from "lucide-react";
import BrandLogo from "@/components/store/BrandLogo";
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
    DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import CartDrawer from "@/components/store/CartDrawer";
import { signOut } from "next-auth/react";

interface NavbarProps {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        role?: string;
    };
}

const Navbar = ({ user }: NavbarProps) => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();
    const cartItemsCount = useCartStore((state) => state.getTotalItems());

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
            setIsSearchOpen(false);
        }
    };

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
                                    <BrandLogo compact className="!justify-start" />
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
                        <BrandLogo compact />
                    </Link>
                </div>

                {/* Desktop Logo */}
                <div className="hidden md:flex items-center space-x-2">
                    <Link href="/" className="flex items-center space-x-2">
                        <BrandLogo />
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
                    <form onSubmit={handleSearch} className="hidden lg:flex relative w-64">
                        <Input
                            type="search"
                            placeholder="Search products..."
                            className="pl-8 h-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search
                            className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer hover:text-accent"
                            onClick={() => handleSearch()}
                        />
                    </form>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                    >
                        <Search className="h-6 w-6 transition-transform hover:scale-110" />
                    </Button>

                    <Link href="/account/wishlist">
                        <Button variant="ghost" size="icon" className="relative h-10 w-10">
                            <Heart className="h-6 w-6 transition-transform hover:scale-110" />
                        </Button>
                    </Link>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10">
                                <UserIcon className="h-6 w-6 transition-transform hover:scale-110" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {!user ? (
                                    <>
                                        <DropdownMenuItem asChild>
                                            <Link href="/login" className="cursor-pointer w-full">Login</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/register" className="cursor-pointer w-full">Register</Link>
                                        </DropdownMenuItem>
                                    </>
                                ) : (
                                    <>
                                        <DropdownMenuItem asChild>
                                            <Link href="/account" className="cursor-pointer w-full">My Profile</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/account/orders" className="cursor-pointer w-full">My Orders</Link>
                                        </DropdownMenuItem>
                                        {user.role === "admin" && (
                                            <DropdownMenuItem asChild>
                                                <Link href="/admin" className="cursor-pointer w-full">Admin Dashboard</Link>
                                            </DropdownMenuItem>
                                        )}
                                    </>
                                )}
                            </DropdownMenuGroup>
                            {user && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => signOut()}>
                                        Log out
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <CartDrawer>
                        <Button variant="ghost" size="icon" className="relative h-10 w-10">
                            <ShoppingCart className="h-6 w-6 transition-transform hover:scale-110" />
                            {isMounted && cartItemsCount > 0 && (
                                <Badge
                                    className="absolute -right-1.5 -top-1.5 px-1.5 py-0.5 text-[10px] bg-accent text-accent-foreground border-2 border-background"
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
