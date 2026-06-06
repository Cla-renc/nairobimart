import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { ArrowLeft, MapPin, Building, Map, Phone, Edit, Package } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/lib/button-variants";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ShippingPage() {
    const session = await auth();

    if (!session?.user?.email) {
        return (
            <div className="container mx-auto py-20 text-center">
                <h1 className="text-2xl font-bold">Please log in to view your shipping addresses.</h1>
                <Link href="/login" className={cn(buttonVariants(), "mt-4")}>Login</Link>
            </div>
        );
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
            name: true,
            phone: true,
            defaultAddress: true,
            defaultCity: true,
            defaultCounty: true,
        }
    });

    const hasAddress = user?.defaultAddress || user?.defaultCity || user?.defaultCounty;

    return (
        <div className="bg-muted/30 min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-2xl">
                <Link href="/account" className="inline-flex items-center text-sm text-muted-foreground hover:text-accent mb-6 transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Account
                </Link>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-extrabold text-primary flex items-center gap-3">
                                <MapPin className="h-8 w-8 text-orange-500" /> Shipping Addresses
                            </h1>
                            <p className="text-muted-foreground mt-1">Your saved delivery addresses for faster checkout.</p>
                        </div>
                        <Link
                            href="/account/edit-profile"
                            className={cn(buttonVariants({ variant: "outline" }), "flex items-center gap-2")}
                        >
                            <Edit className="h-4 w-4" /> Edit Address
                        </Link>
                    </div>

                    {hasAddress ? (
                        <Card className="border-none shadow-sm overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-bold">Default Delivery Address</CardTitle>
                                    <span className="text-[10px] uppercase font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                        Default
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-5 space-y-4">
                                {user?.name && (
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/5 text-primary">
                                            <Package className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Recipient</p>
                                            <p className="font-semibold text-sm">{user.name}</p>
                                        </div>
                                    </div>
                                )}
                                {user?.phone && (
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/5 text-primary">
                                            <Phone className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Phone</p>
                                            <p className="font-semibold text-sm">{user.phone}</p>
                                        </div>
                                    </div>
                                )}
                                {user?.defaultAddress && (
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/5 text-primary">
                                            <MapPin className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Address</p>
                                            <p className="font-semibold text-sm">{user.defaultAddress}</p>
                                        </div>
                                    </div>
                                )}
                                {(user?.defaultCity || user?.defaultCounty) && (
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/5 text-primary">
                                            <Building className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">City / County</p>
                                            <p className="font-semibold text-sm">
                                                {[user.defaultCity, user.defaultCounty].filter(Boolean).join(", ")}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/5 text-primary">
                                        <Map className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Country</p>
                                        <p className="font-semibold text-sm">Kenya</p>
                                    </div>
                                </div>

                                <Link
                                    href="/account/edit-profile"
                                    className={cn(buttonVariants({ variant: "outline" }), "w-full mt-4 flex items-center justify-center gap-2")}
                                >
                                    <Edit className="h-4 w-4" /> Update Address
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-none shadow-sm p-12 text-center">
                            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                <MapPin className="h-8 w-8 text-muted-foreground opacity-50" />
                            </div>
                            <h3 className="text-xl font-bold text-primary">No address saved</h3>
                            <p className="text-muted-foreground mt-2 mb-6">Add a delivery address to speed up future checkouts.</p>
                            <Link href="/account/edit-profile" className={cn(buttonVariants(), "bg-primary hover:bg-primary/90")}>
                                Add Address
                            </Link>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
