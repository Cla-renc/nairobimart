"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { completeProfile } from "./actions";
import { useToast } from "@/hooks/use-toast";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Phone, MapPin, Building, Map } from "lucide-react";
import { Loader2 } from "lucide-react";

const profileSchema = z.object({
    phone: z.string().min(10, "Valid phone number is required (e.g., 0712345678)"),
    defaultAddress: z.string().min(5, "Please provide a specific address or landmark"),
    defaultCity: z.string().min(2, "City/Town is required"),
    defaultCounty: z.string().min(2, "County is required"),
});

type ProfileValues = z.infer<typeof profileSchema>;

export default function CompleteProfilePage() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<ProfileValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            phone: "",
            defaultAddress: "",
            defaultCity: "",
            defaultCounty: "",
        },
    });

    const onSubmit = async (data: ProfileValues) => {
        setIsLoading(true);
        const result = await completeProfile(data);
        setIsLoading(false);

        if (result.success) {
            toast({
                title: "Profile Updated",
                description: "Your account is now ready for checkout!",
            });
            // We usually redirect to checkout or account page after completing profile.
            // Since they were probably trying to checkout, redirect there. 
            // The middleware or user flow will handle the exact path.
            router.push("/checkout"); 
            router.refresh();
        } else {
            toast({
                title: "Error",
                description: result.error || "Something went wrong.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <Card className="w-full max-w-lg border-none shadow-xl">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-3xl font-extrabold text-primary">Complete Your Profile</CardTitle>
                    <CardDescription className="text-base">
                        We need a few more details to ensure smooth delivery of your orders.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Number (for M-Pesa & Delivery)</FormLabel>
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

                            <Button className="w-full h-11 bg-primary hover:bg-primary/90 text-white text-base font-bold mt-4" type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save & Continue
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
