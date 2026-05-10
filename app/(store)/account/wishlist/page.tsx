import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import WishlistItem from "@/components/store/WishlistItem";

export default async function WishlistPage() {
    const session = await auth();
    const user = session?.user;

    if (!user) {
        return (
            <div className="container mx-auto py-20 px-4 text-center">
                <div className="inline-block p-4 rounded-full bg-muted mb-6">
                    <Heart className="h-10 w-10 text-muted-foreground" />
                </div>
                <h1 className="text-3xl font-extrabold text-primary mb-2">Your Wishlist</h1>
                <p className="text-muted-foreground mb-8">Please log in to save and view your favorite items.</p>
                <Link href="/login" className={cn(buttonVariants(), "px-8")}>Login to Your Account</Link>
            </div>
        );
    }

    const wishlistItems = await prisma.wishlist.findMany({
        where: { userId: user.id },
        include: {
            product: {
                include: {
                    images: {
                        take: 1
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="bg-muted/30 min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/account" className="p-2 rounded-full hover:bg-white transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold text-primary tracking-tight">My Wishlist</h1>
                        <p className="text-muted-foreground">Products you&apos;ve saved for later.</p>
                    </div>
                </div>

                {wishlistItems.length === 0 ? (
                    <Card className="border-none shadow-sm py-20 text-center">
                        <CardContent>
                            <div className="inline-block p-6 rounded-full bg-primary/5 text-primary mb-6">
                                <Heart className="h-12 w-12" />
                            </div>
                            <h2 className="text-xl font-bold mb-2">Your wishlist is empty</h2>
                            <p className="text-muted-foreground mb-10 max-w-sm mx-auto">
                                See something you like? Tap the heart icon on any product to save it here for later.
                            </p>
                            <Link href="/products" className={cn(buttonVariants(), "px-10 h-12 font-bold")}>
                                Start Shopping
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {wishlistItems.map((item) => (
                            <WishlistItem key={item.id} item={item} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
