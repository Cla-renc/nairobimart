"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
    Loader2,
    Mail,
    Lock,
    ShoppingBag,
    ChevronRight,
    ArrowLeft,
    Eye,
    EyeOff
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    useEffect(() => {
        if (searchParams.get("registered") === "true") {
            toast({
                title: "Registration Successful",
                description: "You can now login with your new account.",
            });
        }
    }, [searchParams, toast]);

    const form = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (data: LoginValues) => {
        setIsLoading(true);
        try {
            const result = await signIn("credentials", {
                email: data.email,
                password: data.password,
                redirect: false,
            });

            if (result?.error) {
                toast({
                    variant: "destructive",
                    title: "Login Failed",
                    description: "Invalid email or password. Please try again.",
                });
            } else {
                toast({
                    title: "Login Successful",
                    description: "Welcome back to NairobiMart!",
                });
                await router.push("/");
                router.refresh(); // Force server components (Navbar, Layout) to re-render with new session
            }
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "An unexpected error occurred. Please try again later.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-accent mb-6 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Store
                    </Link>
                    <div className="flex justify-center mb-4">
                        <div className="bg-primary p-3 rounded-2xl">
                            <ShoppingBag className="h-8 w-8 text-accent" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-extrabold text-primary tracking-tight">Welcome Back</h1>
                    <p className="text-muted-foreground mt-2">Sign in to your NairobiMart account</p>
                </div>

                <Card className="border-none shadow-xl">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold">Login</CardTitle>
                        <CardDescription>Enter your email and password to access your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email Address</FormLabel>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <FormControl>
                                                    <Input autoComplete="email" placeholder="name@example.com" className="pl-10 h-11" {...field} />
                                                </FormControl>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <FormControl>
                                                    <Input
                                                        autoComplete="current-password"
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="••••••••"
                                                        className="pl-10 pr-10 h-11"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-accent transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex items-center justify-end">
                                    <Link href="/forgot-password" className="text-sm font-medium text-accent hover:underline">
                                        Forgot password?
                                    </Link>
                                </div>
                                <Button className="w-full h-11 bg-primary hover:bg-primary/90 text-white text-base font-bold" type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Sign In
                                </Button>
                            </form>
                        </Form>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <Separator />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-muted-foreground font-medium">Or continue with</span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full h-11 border-muted hover:bg-muted/50 font-semibold"
                            onClick={() => signIn("google")}
                            disabled={isLoading}
                        >
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Google
                        </Button>
                    </CardContent>
                    <CardFooter className="flex flex-wrap justify-center pb-6">
                        <p className="text-sm text-muted-foreground mr-1">Don&apos;t have an account?</p>
                        <Link href="/register" className="text-sm font-bold text-accent hover:underline flex items-center">
                            Create an Account <ChevronRight className="ml-1 h-3 w-3" />
                        </Link>
                    </CardFooter>
                </Card>

                <p className="text-center text-xs text-muted-foreground px-8 leading-relaxed">
                    By continuing, you agree to NairobiMart&apos;s
                    <Link href="/terms" className="hover:text-primary underline px-1">Terms of Service</Link>
                    and
                    <Link href="/privacy" className="hover:text-primary underline px-1">Privacy Policy</Link>.
                </p>
            </div>
        </div>
    );
}
