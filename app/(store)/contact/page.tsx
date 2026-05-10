"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
    Mail,
    MessageSquare,
    Phone,
    MapPin,
    Send,
    Loader2,
    CheckCircle2,
    Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const contactSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email address"),
    subject: z.string().min(5, "Subject is required"),
    message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactValues = z.infer<typeof contactSchema>;

export default function ContactPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const form = useForm<ContactValues>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            name: "",
            email: "",
            subject: "",
            message: "",
        },
    });

    const onSubmit = async (data: ContactValues) => {
        setIsSubmitting(true);
        console.log("Contact form submitted:", data);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setIsSubmitting(false);
        setIsSuccess(true);
        form.reset();
    };

    return (
        <div className="bg-muted/30 min-h-screen">
            {/* Header */}
            <div className="bg-primary pt-20 pb-32 text-center text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-10 left-10 w-64 h-64 bg-accent rounded-full blur-3xl" />
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent rounded-full blur-3xl" />
                </div>
                <div className="container px-4 relative z-10">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Contact NairobiMart</h1>
                    <p className="text-white/80 max-w-2xl mx-auto text-lg">
                        Have questions about shipping, an order, or our products?
                        We&apos;re here to help you shop smart in Kenya.
                    </p>
                </div>
            </div>

            <div className="container px-4 -mt-16 pb-20 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Info Sidebar */}
                    <div className="space-y-6">
                        <Card className="border-none shadow-lg overflow-hidden">
                            <CardContent className="p-8 space-y-8">
                                <div className="flex items-start space-x-4">
                                    <div className="bg-accent/10 p-3 rounded-xl">
                                        <Phone className="h-6 w-6 text-accent" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-primary">Call or WhatsApp</h3>
                                        <p className="text-muted-foreground mt-1 text-sm">0759193674</p>
                                        <p className="text-xs text-muted-foreground mt-1">Mon - Sat, 8am to 6pm</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-4">
                                    <div className="bg-accent/10 p-3 rounded-xl">
                                        <Mail className="h-6 w-6 text-accent" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-primary">Email Support</h3>
                                        <p className="text-muted-foreground mt-1 text-sm">support@nairobimart.co.ke</p>
                                        <p className="text-xs text-muted-foreground mt-1">We reply within 24 hours</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-4">
                                    <div className="bg-accent/10 p-3 rounded-xl">
                                        <MapPin className="h-6 w-6 text-accent" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-primary">100% Online Store</h3>
                                        <p className="text-muted-foreground mt-1 text-sm">Direct Dropshipping to your location.</p>
                                        <p className="text-xs text-muted-foreground mt-1">No physical retail storefront.</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-4 border-t pt-8">
                                    <div className="bg-accent/10 p-3 rounded-xl">
                                        <Clock className="h-6 w-6 text-accent" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-primary">Shipping Info</h3>
                                        <p className="text-muted-foreground mt-1 text-sm italic">&quot;15-30 Business Days&quot;</p>
                                        <p className="text-xs text-muted-foreground mt-1">Standard international transit time</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="bg-accent rounded-3xl p-8 text-white shadow-lg shadow-accent/20 relative overflow-hidden group">
                            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full group-hover:scale-110 transition-transform" />
                            <h3 className="text-xl font-bold mb-4 flex items-center">
                                <MessageSquare className="mr-2 h-5 w-5" /> Live Chat
                            </h3>
                            <p className="text-white/80 text-sm mb-6">
                                Need an instant answer? Chat with our team right now for order inquiries and technical help.
                            </p>
                            <Button className="w-full bg-white text-accent hover:bg-white/90 font-bold">
                                START CHAT
                            </Button>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="lg:col-span-2">
                        <Card className="border-none shadow-lg h-full">
                            <CardContent className="p-8 md:p-12">
                                {isSuccess ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-12">
                                        <div className="bg-green-100 p-6 rounded-full">
                                            <CheckCircle2 className="h-16 w-16 text-green-600" />
                                        </div>
                                        <div className="space-y-2">
                                            <h2 className="text-3xl font-extrabold text-primary">Message Sent!</h2>
                                            <p className="text-muted-foreground">
                                                Thank you for reaching out. A member of our team will get back to you shortly.
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsSuccess(false)}
                                            className="border-accent text-accent mt-4"
                                        >
                                            Send Another Message
                                        </Button>
                                    </div>
                                ) : (
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Your Full Name</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="John Doe" className="h-12 border-muted" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="email"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Email Address</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="john@example.com" className="h-12 border-muted" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <FormField
                                                control={form.control}
                                                name="subject"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Subject</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="How can we help you?" className="h-12 border-muted" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="message"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Detailed Message</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="Describe your inquiry in detail..."
                                                                className="min-h-[180px] border-muted resize-none p-4"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button
                                                type="submit"
                                                size="lg"
                                                className="w-full md:w-auto px-8 bg-primary hover:bg-primary/90 font-bold h-12"
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                        SENDING...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="mr-2 h-5 w-5" /> SEND MESSAGE
                                                    </>
                                                )}
                                            </Button>
                                        </form>
                                    </Form>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
