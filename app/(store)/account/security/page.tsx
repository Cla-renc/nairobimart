"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Lock, Eye, EyeOff, Shield, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function SecurityPage() {
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const { toast } = useToast();
    const router = useRouter();

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast({ title: "Passwords don't match", description: "New password and confirm password must be the same.", variant: "destructive" });
            return;
        }
        if (newPassword.length < 8) {
            toast({ title: "Password too short", description: "Password must be at least 8 characters.", variant: "destructive" });
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/account/security", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                toast({ title: "Password Changed", description: "Your password has been updated successfully." });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                toast({ title: "Error", description: data.error || "Failed to change password.", variant: "destructive" });
            }
        } catch {
            toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-muted/30 min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-2xl">
                <Link href="/account" className="inline-flex items-center text-sm text-muted-foreground hover:text-accent mb-6 transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Account
                </Link>

                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-primary flex items-center gap-3">
                            <Shield className="h-8 w-8 text-blue-500" /> Security Settings
                        </h1>
                        <p className="text-muted-foreground mt-1">Manage your password and account security.</p>
                    </div>

                    {/* Change Password */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Lock className="h-5 w-5 text-primary" /> Change Password
                            </CardTitle>
                            <CardDescription>Choose a strong password to keep your account secure.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Current Password</Label>
                                    <div className="relative">
                                        <Input
                                            type={showCurrent ? "text" : "password"}
                                            placeholder="Enter current password"
                                            className="h-11 pr-10"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            required
                                        />
                                        <button type="button" className="absolute right-3 top-3 text-muted-foreground" onClick={() => setShowCurrent(!showCurrent)}>
                                            {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>New Password</Label>
                                    <div className="relative">
                                        <Input
                                            type={showNew ? "text" : "password"}
                                            placeholder="At least 8 characters"
                                            className="h-11 pr-10"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                        <button type="button" className="absolute right-3 top-3 text-muted-foreground" onClick={() => setShowNew(!showNew)}>
                                            {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Confirm New Password</Label>
                                    <div className="relative">
                                        <Input
                                            type={showConfirm ? "text" : "password"}
                                            placeholder="Repeat new password"
                                            className="h-11 pr-10"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                        <button type="button" className="absolute right-3 top-3 text-muted-foreground" onClick={() => setShowConfirm(!showConfirm)}>
                                            {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                <Button type="submit" disabled={loading} className="w-full h-11 font-bold bg-primary hover:bg-primary/90 text-white mt-2">
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Update Password
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Security Tips */}
                    <Card className="border-none shadow-sm bg-blue-50">
                        <CardContent className="pt-5">
                            <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5" /> Security Tips
                            </h4>
                            <ul className="space-y-2 text-sm text-blue-700">
                                <li>• Use at least 8 characters with a mix of letters, numbers and symbols</li>
                                <li>• Never share your password with anyone</li>
                                <li>• Log out on shared or public devices</li>
                                <li>• Use a unique password not used on other sites</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
