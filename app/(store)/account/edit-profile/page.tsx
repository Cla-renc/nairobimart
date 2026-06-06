"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ArrowLeft, User, Phone, MapPin, Building, Map, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/lib/button-variants";

const editProfileSchema = z.object({
    name: z.string().min(2, "Full name is required"),
    phone: z.string().min(10, "Valid phone number required (e.g. 0712345678)"),
    defaultAddress: z.string().min(3, "Delivery address is required"),
    defaultCity: z.string().min(2, "City/Town is required"),
    defaultCounty: z.string().min(2, "County is required"),
});

type EditProfileValues = z.infer<typeof editProfileSchema>;

export default function EditProfilePage() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<EditProfileValues>({
        resolver: zodResolver(editProfileSchema),
        defaultValues: {
            name: "",
            phone: "",
            defaultAddress: "",
            defaultCity: "",
            defaultCounty: "",
        },
    });

    const onSubmit = async (data: EditProfileValues) => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/account/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const result = await res.json();
            if (res.ok) {
                toast({ title: "Profile Updated", description: "Your changes have been saved." });
                router.push("/account");
                router.refresh();
            } else {
                toast({ title: "Error", description: result.error || "Failed to update profile.", variant: "destructive" });
            }
        } catch {
            toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-muted/30 min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-2xl">
                <Link href="/account" className="inline-flex items-center text-sm text-muted-foreground hover:text-accent mb-6 transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Account
                </Link>

                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                <User className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-extrabold text-primary">Edit Profile</CardTitle>
                                <CardDescription>Update your personal and delivery information.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Full Name</FormLabel>
                                            <div className="relative">
                                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <FormControl>
                                                    <Input placeholder="e.g. Jane Doe" className="pl-10 h-11" {...field} />
                                                </FormControl>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone Number (M-Pesa & Delivery)</FormLabel>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <FormControl>
                                                    <Input placeholder="0712 345 678" className="pl-10 h-11" {...field} />
                                                </FormControl>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <FormField
                                        control={form.control}
                                        name="defaultCounty"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>County</FormLabel>
                                                <div className="relative">
                                                    <Map className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <FormControl>
                                                        <Input placeholder="e.g. Nairobi" className="pl-10 h-11" {...field} />
                                                    </FormControl>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="defaultCity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>City / Town</FormLabel>
                                                <div className="relative">
                                                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <FormControl>
                                                        <Input placeholder="e.g. Westlands" className="pl-10 h-11" {...field} />
                                                    </FormControl>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="defaultAddress"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Delivery Address (Building, Street, Landmark)</FormLabel>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <FormControl>
                                                    <Input placeholder="e.g. 4th Floor, KCA Building, Thika Road" className="pl-10 h-11" {...field} />
                                                </FormControl>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex gap-3 pt-2">
                                    <Link href="/account" className={cn(buttonVariants({ variant: "outline" }), "flex-1 h-11")}>
                                        Cancel
                                    </Link>
                                    <Button className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white font-bold" type="submit" disabled={isLoading}>
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
