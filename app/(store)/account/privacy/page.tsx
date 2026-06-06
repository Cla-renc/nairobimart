"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Shield, Bell, Mail, Trash2, Eye, Loader2 } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);
    const [prefs, setPrefs] = useState({
        orderEmails: true,
        promotionalEmails: false,
        smsNotifications: true,
        whatsappUpdates: true,
    });

    const toggle = (key: keyof typeof prefs) => {
        setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const savePrefs = async () => {
        setSaving(true);
        try {
            // Save preferences via API
            await fetch("/api/account/privacy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(prefs),
            });
            toast({ title: "Preferences Saved", description: "Your notification settings have been updated." });
        } catch {
            toast({ title: "Error", description: "Failed to save preferences.", variant: "destructive" });
        } finally {
            setSaving(false);
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
                            <Eye className="h-8 w-8 text-purple-500" /> Privacy & Notifications
                        </h1>
                        <p className="text-muted-foreground mt-1">Manage how NairobiMart contacts you and uses your data.</p>
                    </div>

                    {/* Notification Preferences */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Bell className="h-5 w-5 text-primary" /> Notification Preferences
                            </CardTitle>
                            <CardDescription>Choose which notifications you want to receive.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {[
                                {
                                    key: "orderEmails" as const,
                                    icon: <Mail className="h-4 w-4 text-blue-500" />,
                                    label: "Order Confirmation Emails",
                                    desc: "Receive email updates when you place or track an order.",
                                },
                                {
                                    key: "promotionalEmails" as const,
                                    icon: <Mail className="h-4 w-4 text-purple-500" />,
                                    label: "Promotional Emails",
                                    desc: "Get notified about deals, flash sales, and new arrivals.",
                                },
                                {
                                    key: "smsNotifications" as const,
                                    icon: <Bell className="h-4 w-4 text-green-500" />,
                                    label: "SMS Notifications",
                                    desc: "Receive order updates and delivery alerts via SMS.",
                                },
                                {
                                    key: "whatsappUpdates" as const,
                                    icon: <Bell className="h-4 w-4 text-emerald-600" />,
                                    label: "WhatsApp Updates",
                                    desc: "Get order tracking and support via WhatsApp.",
                                },
                            ].map(({ key, icon, label, desc }) => (
                                <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-transparent hover:border-muted transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-white shadow-sm">
                                            {icon}
                                        </div>
                                        <div>
                                            <Label htmlFor={key} className="font-semibold text-sm cursor-pointer">{label}</Label>
                                            <p className="text-xs text-muted-foreground">{desc}</p>
                                        </div>
                                    </div>
                                    <Switch
                                        id={key}
                                        checked={prefs[key]}
                                        onCheckedChange={() => toggle(key)}
                                    />
                                </div>
                            ))}

                            <Button onClick={savePrefs} disabled={saving} className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold mt-2">
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Preferences
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Data & Privacy */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Shield className="h-5 w-5 text-primary" /> Your Data
                            </CardTitle>
                            <CardDescription>Control how your personal data is stored and used.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-xl bg-muted/40 text-sm text-muted-foreground">
                                NairobiMart only collects data necessary to process your orders and improve your shopping experience. Your data is never sold to third parties.
                            </div>
                            <Button
                                variant="outline"
                                className="w-full h-11 text-red-600 border-red-200 hover:bg-red-50 font-bold flex items-center gap-2"
                                onClick={() => toast({ title: "Request Submitted", description: "We will process your data deletion request within 30 days." })}
                            >
                                <Trash2 className="h-4 w-4" /> Request Account Deletion
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
