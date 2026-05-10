"use client"

import * as React from "react";
import {
    Globe,
    Mail,
    CreditCard,
    ShieldCheck,
    Truck,
    Save,
    CheckCircle2,
    Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { saveSiteSettings } from "./actions";

type Setting = {
    id: string;
    key: string;
    value: string;
};

export default function SettingsClient({ initialSettings }: { initialSettings: Setting[] }) {
    const [activeTab, setActiveTab] = React.useState("general");
    const [isSaving, setIsSaving] = React.useState(false);
    const [showSuccess, setShowSuccess] = React.useState(false);
    const [formData, setFormData] = React.useState<Record<string, string>>(
        initialSettings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {})
    );

    const handleInputChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        setShowSuccess(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const result = await saveSiteSettings(formData);
        setIsSaving(false);
        if (result.success) {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }
    };

    const tabs = [
        { id: "general", label: "General Details", icon: Globe },
        { id: "shipping", label: "Shipping & Tax", icon: Truck },
        { id: "payments", label: "Payment Methods", icon: CreditCard },
        { id: "email", label: "Email Notifications", icon: Mail },
        { id: "security", label: "Security & Admin", icon: ShieldCheck },
    ];

    const getVal = (key: string, fallback: string = "") => formData[key] || fallback;

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Store Settings</h1>
                    <p className="text-muted-foreground mt-1">Configure your NairobiMart store&apos;s general preferences.</p>
                </div>
                <div className="flex items-center gap-3">
                    {showSuccess && (
                        <div className="flex items-center text-green-600 text-sm font-bold bg-green-50 px-3 py-1 rounded-full animate-in fade-in zoom-in duration-300">
                            <CheckCircle2 className="mr-1.5 h-4 w-4" /> Changes Saved!
                        </div>
                    )}
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-primary hover:bg-primary/90 shadow-md min-w-[140px]"
                    >
                        {isSaving ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                        ) : (
                            <><Save className="mr-2 h-4 w-4" /> Save All Changes</>
                        )}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Navigation Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <Card className="border-none shadow-sm sticky top-6 overflow-hidden bg-white/50 backdrop-blur-md">
                        <CardContent className="p-2">
                            {tabs.map((tab) => (
                                <Button
                                    key={tab.id}
                                    variant="ghost"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "w-full justify-start rounded-xl transition-all duration-300 px-4 py-6 mb-1",
                                        activeTab === tab.id
                                            ? "text-primary font-bold bg-primary/10 shadow-sm"
                                            : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                                    )}
                                >
                                    <tab.icon className={cn("mr-3 h-5 w-5", activeTab === tab.id ? "text-accent" : "opacity-50")} />
                                    {tab.label}
                                </Button>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Settings Fields */}
                <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {activeTab === "general" && (
                        <Card className="border-none shadow-sm ring-1 ring-muted/20 overflow-hidden bg-white">
                            <CardHeader className="border-b bg-muted/5">
                                <CardTitle>General Information</CardTitle>
                                <CardDescription>Basic store identitiy and contact details.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="store_name">Store Name</Label>
                                        <Input
                                            id="store_name"
                                            value={getVal("store_name", "NairobiMart")}
                                            onChange={(e) => handleInputChange("store_name", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="store_email">Support Email</Label>
                                        <Input
                                            id="store_email"
                                            type="email"
                                            value={getVal("store_email", "support@nairobimart.com")}
                                            onChange={(e) => handleInputChange("store_email", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="store_phone">Contact Phone</Label>
                                        <Input
                                            id="store_phone"
                                            value={getVal("store_phone", "+254 700 000 000")}
                                            onChange={(e) => handleInputChange("store_phone", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="currency">Store Currency</Label>
                                        <Input
                                            id="currency"
                                            value={getVal("currency", "KES")}
                                            onChange={(e) => handleInputChange("currency", e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === "shipping" && (
                        <Card className="border-none shadow-sm ring-1 ring-muted/20 overflow-hidden bg-white">
                            <CardHeader className="border-b bg-muted/5">
                                <CardTitle>Shipping & Logistics</CardTitle>
                                <CardDescription>Configure shipping rates and delivery target regions.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-bold">Standard Delivery</Label>
                                        <p className="text-sm text-muted-foreground">Base shipping fee for all local orders.</p>
                                    </div>
                                    <Input
                                        className="w-32 text-right font-bold"
                                        value={getVal("shipping_fee", "350")}
                                        onChange={(e) => handleInputChange("shipping_fee", e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-bold">Free Shipping Threshold</Label>
                                        <p className="text-sm text-muted-foreground">Order total required for free delivery.</p>
                                    </div>
                                    <Input
                                        className="w-32 text-right font-bold"
                                        value={getVal("free_shipping_min", "5000")}
                                        onChange={(e) => handleInputChange("free_shipping_min", e.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === "payments" && (
                        <Card className="border-none shadow-sm ring-1 ring-muted/20 overflow-hidden bg-white">
                            <CardHeader className="border-b bg-muted/5">
                                <CardTitle>Payment Gateways</CardTitle>
                                <CardDescription>Manage your store&apos;s accepted payment methods.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="flex items-center justify-between p-4 rounded-xl border-l-4 border-green-500 bg-green-50/30">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-bold text-green-700">M-PESA Integration</Label>
                                        <p className="text-sm text-green-600/80">Active and processing payments via Daraja API.</p>
                                    </div>
                                    <Switch
                                        checked={getVal("mpesa_enabled", "true") === "true"}
                                        onCheckedChange={(c) => handleInputChange("mpesa_enabled", c.toString())}
                                    />
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl border-l-4 border-primary bg-primary/5">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-bold text-primary">PesaPal (Visa/Mastercard)</Label>
                                        <p className="text-sm text-muted-foreground">Enable Visa and Mastercard processing.</p>
                                    </div>
                                    <Switch
                                        checked={getVal("pesapal_enabled", "false") === "true"}
                                        onCheckedChange={(c) => handleInputChange("pesapal_enabled", c.toString())}
                                    />
                                </div>

                            </CardContent>
                        </Card>
                    )}

                    {activeTab === "email" && (
                        <Card className="border-none shadow-sm ring-1 ring-muted/20 overflow-hidden bg-white">
                            <CardHeader className="border-b bg-muted/5">
                                <CardTitle>Email Notifications</CardTitle>
                                <CardDescription>Manage how the store communicates with you and your customers.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-primary uppercase tracking-wider">Admin Alerts</h4>
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20">
                                        <div className="space-y-0.5">
                                            <Label className="text-base font-bold">New Order Notifications</Label>
                                            <p className="text-sm text-muted-foreground">Receive an email whenever a customer places a new order.</p>
                                        </div>
                                        <Switch
                                            checked={getVal("email_new_order", "true") === "true"}
                                            onCheckedChange={(c) => handleInputChange("email_new_order", c.toString())}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20">
                                        <div className="space-y-0.5">
                                            <Label className="text-base font-bold">Stock Alerts</Label>
                                            <p className="text-sm text-muted-foreground">Get notified when a product is low or out of stock.</p>
                                        </div>
                                        <Switch
                                            checked={getVal("email_low_stock", "true") === "true"}
                                            onCheckedChange={(c) => handleInputChange("email_low_stock", c.toString())}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-6 border-t font-medium">
                                    <h4 className="text-sm font-bold text-primary uppercase tracking-wider">Customer Experience</h4>
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20">
                                        <div className="space-y-0.5">
                                            <Label className="text-base font-bold">Order Confirmations</Label>
                                            <p className="text-sm text-muted-foreground">Send an automated email to customers after a successful purchase.</p>
                                        </div>
                                        <Switch
                                            checked={getVal("email_customer_conf", "true") === "true"}
                                            onCheckedChange={(c) => handleInputChange("email_customer_conf", c.toString())}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Operational Settings - Always visible or scoped to tabs? Let's scope the rest as per UI mock */}
                    {(activeTab === "general" || activeTab === "security" || activeTab === "shipping") && (
                        <Card className="border-none shadow-sm ring-1 ring-muted/20 overflow-hidden bg-white">
                            <CardHeader className="border-b bg-muted/5">
                                <CardTitle>Inventory & Access</CardTitle>
                                <CardDescription>Global store behavioral settings.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-bold">Enable Guest Checkout</Label>
                                        <p className="text-sm text-muted-foreground italic">Allow customers to buy without an account.</p>
                                    </div>
                                    <Switch checked={getVal("guest_checkout", "false") === "true"} onCheckedChange={(c) => handleInputChange("guest_checkout", c.toString())} />
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-bold">Low Stock Alerts</Label>
                                        <p className="text-sm text-muted-foreground italic">Notify admins when product stock is below 5 units.</p>
                                    </div>
                                    <Switch checked={getVal("low_stock_alerts", "true") === "true"} onCheckedChange={(c) => handleInputChange("low_stock_alerts", c.toString())} />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === "security" && (
                        <Card className={cn(
                            "border-2 shadow-sm overflow-hidden transition-colors duration-300",
                            getVal("maintenance_mode", "false") === "true"
                                ? "border-amber-200 bg-amber-50/20"
                                : "border-red-100 bg-red-50/20"
                        )}>
                            <CardHeader className={cn(
                                "border-b",
                                getVal("maintenance_mode", "false") === "true" ? "border-amber-100" : "border-red-100"
                            )}>
                                <CardTitle className={getVal("maintenance_mode", "false") === "true" ? "text-amber-600" : "text-red-600"}>
                                    Maintenance Mode
                                </CardTitle>
                                <CardDescription className={getVal("maintenance_mode", "false") === "true" ? "text-amber-500/70" : "text-red-500/70"}>
                                    Take the store offline for updates.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <p className={cn(
                                        "text-sm font-medium max-w-xs",
                                        getVal("maintenance_mode", "false") === "true" ? "text-amber-600/80" : "text-red-600/80"
                                    )}>
                                        {getVal("maintenance_mode", "false") === "true"
                                            ? "Store is currently in maintenance mode. Only administrators can access the storefront."
                                            : "Activating this will block all customer access except for authorized administrators."}
                                    </p>
                                    <Button
                                        variant={getVal("maintenance_mode", "false") === "true" ? "outline" : "destructive"}
                                        className="font-bold min-w-[160px]"
                                        onClick={() => handleInputChange("maintenance_mode", getVal("maintenance_mode", "false") === "true" ? "false" : "true")}
                                    >
                                        {getVal("maintenance_mode", "false") === "true" ? "Disable Maintenance" : "Enable Maintenance"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
