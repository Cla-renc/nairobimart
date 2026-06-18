"use client";

import { useState, useEffect } from "react";
import { trackEvent, getGaClientId } from "@/lib/analyticsClient";
import {
    CreditCard,
    MapPin,
    Truck,
    CheckCircle2,
    ChevronRight,
    ArrowLeft,
    Smartphone,
    Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/store/cartStore";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const steps = ["Delivery", "Payment", "Review"];

export default function CheckoutPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [deliveryInfo, setDeliveryInfo] = useState({
        firstName: "",
        lastName: "",
        email: "",
        country: "Kenya",
        phone: "",
        tillNumber: "",
        address: "",
        city: "",
        county: "Nairobi",
    });
    const [paymentMethod, setPaymentMethod] = useState("");
    const [paymentType, setPaymentType] = useState<"FULL" | "LAYBY" | "COMMITMENT">("FULL");

    const [deliveryMethod, setDeliveryMethod] = useState<"door" | "pickup">("door");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [deliveryOptions, setDeliveryOptions] = useState<{ zones: any[], stations: any[] }>({ zones: [], stations: [] });
    const [selectedStationId, setSelectedStationId] = useState<string>("");
    const [courierFee, setCourierFee] = useState<number | null>(null);
    const [isCalculatingCourier, setIsCalculatingCourier] = useState(false);
    const [estimatedDays, setEstimatedDays] = useState<string | null>(null);

    const countryPlaceholders: Record<string, { phone: string; city: string; address: string; county?: string }> = {
        Kenya: {
            phone: "+254 700 000 000",
            city: "Nairobi",
            address: "Nairobi West, Apartment 4B",
            county: "Nairobi",
        },
        Uganda: {
            phone: "+256 700 000 000",
            city: "Kampala",
            address: "Kampala Central, Plot 12",
        },
        Tanzania: {
            phone: "+255 700 000 000",
            city: "Dar es Salaam",
            address: "Dar es Salaam, Oyster Bay",
        },
    };

    const getPhonePlaceholder = () => countryPlaceholders[deliveryInfo.country]?.phone || "+254 700 000 000";
    const getCityPlaceholder = () => countryPlaceholders[deliveryInfo.country]?.city || "Nairobi";
    const getAddressPlaceholder = () => countryPlaceholders[deliveryInfo.country]?.address || "Nairobi West, Apartment 4B";
    const [isMounted, setIsMounted] = useState(false);
    const [couponCode, setCouponCode] = useState("");
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [couponMessage, setCouponMessage] = useState<string | null>(null);
    const [showStkInitiated, setShowStkInitiated] = useState(false);
    const [stkOrderId, setStkOrderId] = useState<string | null>(null);
    const [stkPollingSeconds, setStkPollingSeconds] = useState(0);

    const { items, getTotalPrice, clearCart } = useCartStore();
    const router = useRouter();
    const totalPrice = getTotalPrice();
    const visibleTotalPrice = isMounted ? totalPrice : 0;
    
    const shippingFee = (() => {
        if (deliveryMethod === "door") {
            return courierFee ?? 500;
        }
        if (deliveryMethod === "pickup" && selectedStationId) {
            const station = deliveryOptions.stations.find(s => s.id === selectedStationId);
            return station ? station.fee : 50;
        }
        return 500;
    })();

    const isMpesaAvailable = deliveryInfo.country === "Kenya";

    const finalTotal = visibleTotalPrice + shippingFee - couponDiscount;
    const laybyDeposit = Math.round(finalTotal * 0.3);
    const laybyBalance = finalTotal - laybyDeposit;
    const commitmentDeposit = shippingFee > 0 ? shippingFee : 500;
    const commitmentBalance = finalTotal - commitmentDeposit;

    useEffect(() => {
        setIsMounted(true);
        // GA: begin_checkout
        try {
            trackEvent('begin_checkout', {
                value: totalPrice,
                currency: 'KES',
                items: items.map(i => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity }))
            });
        } catch (e) {
            console.warn('begin_checkout track failed', e);
        }

        // Default to pesapal (Visa) if no payment method has been chosen yet
        setPaymentMethod((prev) => prev || "pesapal");

        fetch("/api/delivery-options")
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setDeliveryOptions({ zones: data.zones, stations: data.stations });
                    if (data.stations.length > 0) setSelectedStationId(data.stations[0].id);
                }
            })
            .catch(err => console.error("Failed to load delivery options", err));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Dynamic Courier Fee Calculation
    useEffect(() => {
        if (deliveryMethod === "door" && deliveryInfo.county && deliveryInfo.city && deliveryInfo.country) {
            setIsCalculatingCourier(true);
            fetch("/api/delivery-options/quote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    country: deliveryInfo.country,
                    county: deliveryInfo.county,
                    city: deliveryInfo.city,
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setCourierFee(data.fee);
                    setEstimatedDays(data.estimatedDays);
                }
            })
            .catch(err => console.error("Failed to fetch courier rate", err))
            .finally(() => setIsCalculatingCourier(false));
        }
    }, [deliveryMethod, deliveryInfo.county, deliveryInfo.city, deliveryInfo.country]);

    useEffect(() => {
        if (deliveryInfo.country !== "Kenya" && paymentMethod === "mpesa_till") {
            setPaymentMethod("pesapal");
        }
    }, [deliveryInfo.country, paymentMethod]);

    const [checkoutError, setCheckoutError] = useState<string | null>(null);

    const applyCoupon = async () => {
        setCouponMessage(null);
        if (!couponCode.trim()) {
            setCouponMessage("Enter a coupon code to apply.");
            return;
        }

        try {
            const response = await fetch("/api/coupons/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: couponCode.trim(), subtotal: totalPrice }),
            });

            const data = await response.json();
            if (!data.success) {
                setCouponDiscount(0);
                setCouponMessage(data.message || "Invalid coupon code.");
                return;
            }

            setCouponDiscount(data.amount);
            setCouponMessage(`Coupon applied: -KES ${data.amount.toLocaleString()}`);
        } catch (error) {
            setCouponDiscount(0);
            setCouponMessage("Failed to validate coupon. Try again later.");
            console.error("Coupon apply failed:", error);
        }
    };

    const handleConfirmOrder = async () => {
        setCheckoutError(null);
        if (!paymentMethod) {
            setCheckoutError("Please select a payment method before proceeding.");
            return;
        }
        if (!items.length) {
            setCheckoutError("Your cart is empty. Add items before checking out.");
            return;
        }
        if (!deliveryInfo.firstName || !deliveryInfo.lastName || !deliveryInfo.email || !deliveryInfo.phone || !deliveryInfo.address) {
            setCheckoutError("Please fill in all required delivery information.");
            return;
        }
        setIsProcessing(true);
        try {
            console.log("Submitting checkout with payment method:", paymentMethod);
            console.log("Items being sent:", items);

            const response = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items,
                    totalPrice,
                    deliveryInfo,
                    paymentMethod,
                    paymentType,
                    deliveryMethod,
                    pickupStationId: deliveryMethod === "pickup" ? selectedStationId : null,
                    shippingFee, // send calculated fee to verify
                    couponCode: couponCode.trim(),
                    gaClientId: getGaClientId(),
                }),
            });

            const data = await response.json();
            console.log("Checkout response:", data);

            if (data.success) {
                if (data.type === "pesapal" && data.url) {
                    console.log("Redirecting to PesaPal URL:", data.url);
                    window.location.href = data.url;
                } else if (paymentMethod === "mpesa_till") {
                    // For M-Pesa STK push, show waiting message and poll for payment
                    console.log("STK push initiated. Waiting for payment confirmation...");
                    setStkOrderId(data.orderId);
                    setShowStkInitiated(true);
                    setStkPollingSeconds(0);
                } else {
                    console.log("Redirecting to order success page");
                    clearCart();
                    router.push(`/order-success?id=${data.orderId}&payment=${paymentMethod}`);
                }
            } else {
                const message = data.message || "Order failed. Please try again.";
                const fullMessage = data.details ? `${message}\n\nDetails: ${data.details}` : message;
                setCheckoutError(fullMessage);
                console.error("Order failed", message);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unexpected error occurred.";
            setCheckoutError(message);
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    // Poll for payment status when STK is initiated
    useEffect(() => {
        if (!showStkInitiated || !stkOrderId) return;

        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/orders/${stkOrderId}/payment-status`);
                const data = await response.json();

                if (data.isPaid) {
                    // Payment confirmed, redirect to success page
                    clearInterval(pollInterval);
                    setShowStkInitiated(false);
                    setStkOrderId(null);
                    clearCart();
                    router.push(`/order-success?id=${stkOrderId}&payment=mpesa_till`);
                }
            } catch (error) {
                console.error("Error polling payment status:", error);
            }

            setStkPollingSeconds(prev => prev + 1);
        }, 2000); // Poll every 2 seconds

        // Timeout after 5 minutes if no payment received
        const timeout = setTimeout(() => {
            clearInterval(pollInterval);
            setShowStkInitiated(false);
            setStkOrderId(null);
            setCheckoutError("Payment timeout. Please contact support if payment was deducted from your account.");
        }, 5 * 60 * 1000);

        return () => {
            clearInterval(pollInterval);
            clearTimeout(timeout);
        };
    }, [showStkInitiated, stkOrderId, clearCart, router]);

    return (
        <div className="container px-4 py-12 max-w-6xl">
            <div className="flex flex-col lg:flex-row gap-12">
                {/* Main Content */}
                <div className="flex-1 space-y-8">
                    {/* Stepper */}
                    <div className="flex items-center justify-between mb-8 max-w-md mx-auto md:mx-0">
                        {steps.map((step, idx) => (
                            <div key={step} className="flex items-center">
                                <div className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold ${idx <= currentStep ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                                    }`}>
                                    {idx < currentStep ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
                                </div>
                                <span className={`ml-2 text-sm font-medium ${idx <= currentStep ? "text-primary" : "text-muted-foreground"
                                    }`}>
                                    {step}
                                </span>
                                {idx < steps.length - 1 && (
                                    <div className={`mx-4 h-[2px] w-8 md:w-16 ${idx < currentStep ? "bg-accent" : "bg-muted"
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>

                    <Card className="border-none shadow-sm bg-muted/30">
                        <CardContent className="pt-8">
                            {currentStep === 0 && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-primary flex items-center">
                                        <MapPin className="mr-2 h-6 w-6 text-accent" /> Delivery Information
                                    </h2>

                                    {deliveryInfo.country === "Kenya" && (
                                        <div className="bg-white p-4 rounded-xl border border-input mb-6">
                                            <Label className="text-base font-bold mb-3 block">Choose Delivery Method</Label>
                                            <RadioGroup
                                                value={deliveryMethod}
                                                onValueChange={(val: "door" | "pickup") => setDeliveryMethod(val)}
                                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                            >
                                                <div className={`flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-colors ${deliveryMethod === "door" ? "border-primary bg-primary/5" : "hover:border-accent"}`}>
                                                    <RadioGroupItem value="door" id="door" />
                                                    <Label htmlFor="door" className="cursor-pointer font-bold flex-1">Door Delivery</Label>
                                                </div>
                                                <div className={`flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-colors ${deliveryMethod === "pickup" ? "border-primary bg-primary/5" : "hover:border-accent"}`}>
                                                    <RadioGroupItem value="pickup" id="pickup" />
                                                    <Label htmlFor="pickup" className="cursor-pointer font-bold flex-1">Pick-up Station</Label>
                                                </div>
                                            </RadioGroup>

                                            {deliveryMethod === "door" && (
                                                <div className="mt-4 pt-4 border-t space-y-2">
                                                    <Label>DHL Express Delivery</Label>
                                                    {isCalculatingCourier ? (
                                                        <p className="text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Calculating dynamic rate for {deliveryInfo.city}...</p>
                                                    ) : courierFee !== null ? (
                                                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                                            <p className="text-sm font-bold text-green-800 flex justify-between">
                                                                <span>Door-to-Door Fee:</span>
                                                                <span>KES {courierFee}</span>
                                                            </p>
                                                            {estimatedDays && <p className="text-xs text-green-600 mt-1">Estimated delivery: {estimatedDays}</p>}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground">Please fill in your Country, County, and City below to calculate shipping.</p>
                                                    )}
                                                </div>
                                            )}

                                            {deliveryMethod === "pickup" && deliveryOptions.stations.length > 0 && (
                                                <div className="mt-4 pt-4 border-t space-y-2">
                                                    <Label htmlFor="station">Select a Pick-up Station</Label>
                                                    <select
                                                        id="station"
                                                        value={selectedStationId}
                                                        onChange={(e) => setSelectedStationId(e.target.value)}
                                                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                                                    >
                                                        {deliveryOptions.stations.map(station => (
                                                            <option key={station.id} value={station.id}>
                                                                {station.name} - {station.city} (KES {station.fee})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="country">Country</Label>
                                            <select
                                                id="country"
                                                value={deliveryInfo.country}
                                                onChange={(e) => setDeliveryInfo({
                                                    ...deliveryInfo,
                                                    country: e.target.value,
                                                    city: "",
                                                    address: "",
                                                })}
                                                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                                            >
                                                <option value="Kenya">Kenya</option>
                                                <option value="Uganda">Uganda</option>
                                                <option value="Tanzania">Tanzania</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">First Name</Label>
                                            <Input
                                                id="firstName"
                                                placeholder="John"
                                                value={deliveryInfo.firstName}
                                                onChange={(e) => setDeliveryInfo({ ...deliveryInfo, firstName: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Last Name</Label>
                                            <Input
                                                id="lastName"
                                                placeholder="Doe"
                                                value={deliveryInfo.lastName}
                                                onChange={(e) => setDeliveryInfo({ ...deliveryInfo, lastName: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="john@example.com"
                                                value={deliveryInfo.email}
                                                onChange={(e) => setDeliveryInfo({ ...deliveryInfo, email: e.target.value })}
                                            />
                                        </div>
                                        {deliveryInfo.country === "Kenya" && (
                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="phone">Phone Number</Label>
                                                <Input
                                                    id="phone"
                                                    placeholder="+254 700 000 000"
                                                    value={deliveryInfo.phone}
                                                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, phone: e.target.value })}
                                                />
                                                <p className="text-xs text-muted-foreground">Used for delivery coordination and M-Pesa payments on Pesapal</p>
                                            </div>
                                        )}

                                        {deliveryInfo.country !== "Kenya" && (
                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="phone">Phone Number</Label>
                                                <Input
                                                    id="phone"
                                                    placeholder={getPhonePlaceholder()}
                                                    value={deliveryInfo.phone}
                                                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, phone: e.target.value })}
                                                />
                                                <p className="text-xs text-muted-foreground">For delivery coordination</p>
                                            </div>
                                        )}

                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="address">Full Address (Building, Street)</Label>
                                            <Input
                                                id="address"
                                                placeholder={getAddressPlaceholder()}
                                                value={deliveryInfo.address}
                                                onChange={(e) => setDeliveryInfo({ ...deliveryInfo, address: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="city">City</Label>
                                            <Input
                                                id="city"
                                                placeholder={getCityPlaceholder()}
                                                value={deliveryInfo.city}
                                                onChange={(e) => setDeliveryInfo({ ...deliveryInfo, city: e.target.value })}
                                            />
                                        </div>
                                        {/* Show County universally for the courier api, unless it's a country without states */}
                                        <div className="space-y-2">
                                            <Label htmlFor="county">County / Region / District</Label>
                                            <Input
                                                id="county"
                                                placeholder="e.g. Nairobi, Dar es Salaam, Kampala"
                                                value={deliveryInfo.county}
                                                onChange={(e) => setDeliveryInfo({ ...deliveryInfo, county: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 1 && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-primary flex items-center">
                                        <CreditCard className="mr-2 h-6 w-6 text-accent" /> Payment Method
                                    </h2>

                                    <div className="bg-white p-4 rounded-xl border border-input mb-6">
                                        <Label className="text-base font-bold mb-3 block">Payment Plan</Label>
                                        <RadioGroup
                                            value={paymentType}
                                            onValueChange={(val: "FULL" | "LAYBY" | "COMMITMENT") => setPaymentType(val)}
                                            className="grid grid-cols-1 md:grid-cols-3 gap-4"
                                        >
                                            <div
                                                onClick={() => setPaymentType("FULL")}
                                                className={`relative flex items-center space-x-3 border-2 rounded-lg p-3 cursor-pointer transition-all ${
                                                    paymentType === "FULL"
                                                        ? "border-primary bg-primary/5 shadow-sm"
                                                        : "border-border hover:border-accent"
                                                }`}>
                                                <RadioGroupItem value="FULL" id="FULL" />
                                                <Label htmlFor="FULL" className="cursor-pointer font-bold flex-1">Pay in Full</Label>
                                                {paymentType === "FULL" && (
                                                    <span className="absolute top-2 right-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">✓ Selected</span>
                                                )}
                                            </div>
                                            <div
                                                onClick={() => setPaymentType("LAYBY")}
                                                className={`relative flex flex-col border-2 rounded-lg p-3 cursor-pointer transition-all ${
                                                    paymentType === "LAYBY"
                                                        ? "border-primary bg-primary/5 shadow-sm"
                                                        : "border-border hover:border-accent"
                                                }`}>
                                                <div className="flex items-center space-x-3">
                                                    <RadioGroupItem value="LAYBY" id="LAYBY" />
                                                    <Label htmlFor="LAYBY" className="cursor-pointer font-bold flex-1">Lipa Mdogo Mdogo</Label>
                                                    {paymentType === "LAYBY" && (
                                                        <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">✓ Selected</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-2 ml-7">Lock your order with a 30% deposit.</p>
                                            </div>
                                            <div
                                                onClick={() => setPaymentType("COMMITMENT")}
                                                className={`relative flex flex-col border-2 rounded-lg p-3 cursor-pointer transition-all ${
                                                    paymentType === "COMMITMENT"
                                                        ? "border-primary bg-primary/5 shadow-sm"
                                                        : "border-border hover:border-accent"
                                                }`}>
                                                <div className="flex items-center space-x-3">
                                                    <RadioGroupItem value="COMMITMENT" id="COMMITMENT" />
                                                    <Label htmlFor="COMMITMENT" className="cursor-pointer font-bold flex-1">Pay on Delivery</Label>
                                                    {paymentType === "COMMITMENT" && (
                                                        <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">✓ Selected</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-2 ml-7">Pay shipping now, item cost on delivery.</p>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    <Label className="text-base font-bold mb-3 block mt-6">Select Payment Channel</Label>
                                    <RadioGroup
                                        value={paymentMethod}
                                        onValueChange={(val) => setPaymentMethod(val)}
                                        className="grid grid-cols-1 gap-4"
                                    >
                                        {isMpesaAvailable && (
                                            <>
                                                <div
                                                    onClick={() => {
                                                        setPaymentMethod("mpesa_till");
                                                        setDeliveryInfo({ ...deliveryInfo, tillNumber: "3510645" });
                                                    }}
                                                    className={`relative flex items-center space-x-4 border-2 rounded-xl p-4 bg-white transition-all cursor-pointer ${
                                                        paymentMethod === "mpesa_till"
                                                            ? "border-green-500 bg-green-50 shadow-sm"
                                                            : "border-border hover:border-green-300"
                                                    }`}>
                                                    <RadioGroupItem value="mpesa_till" id="mpesa_till" />
                                                    <Label htmlFor="mpesa_till" className="flex-1 cursor-pointer">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="bg-green-100 p-2 rounded-lg">
                                                                    <Smartphone className="h-6 w-6 text-green-600" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold">M-Pesa Till 3510645</p>
                                                                    <p className="text-xs text-muted-foreground">Pay via M-Pesa using till number 3510645. Prompt appears on your phone.</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {paymentMethod === "mpesa_till" && (
                                                                    <span className="text-xs uppercase font-bold text-white bg-green-500 px-2 py-1 rounded-full">✓ Selected</span>
                                                                )}
                                                                <span className="text-xs uppercase font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">Preferred</span>
                                                            </div>
                                                        </div>
                                                    </Label>
                                                </div>
                                            </>
                                        )}
                                        <div
                                            onClick={() => setPaymentMethod("wallet")}
                                            className={`relative flex items-center space-x-4 border-2 rounded-xl p-4 bg-white transition-all cursor-pointer ${
                                                paymentMethod === "wallet"
                                                    ? "border-purple-500 bg-purple-50 shadow-sm"
                                                    : "border-border hover:border-purple-300"
                                            }`}>
                                            <RadioGroupItem value="wallet" id="wallet" />
                                            <Label htmlFor="wallet" className="flex-1 cursor-pointer">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="bg-purple-100 p-2 rounded-lg">
                                                            <Wallet className="h-6 w-6 text-purple-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold">NairobiMart Wallet</p>
                                                            <p className="text-xs text-muted-foreground">Instant zero-fee checkout using your wallet balance.</p>
                                                            <Link href="/account/wallet" className="text-xs text-accent font-bold mt-1 inline-block hover:underline">
                                                                Go to Wallet Dashboard
                                                            </Link>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {paymentMethod === "wallet" && (
                                                            <span className="text-xs uppercase font-bold text-white bg-purple-500 px-2 py-1 rounded-full">✓ Selected</span>
                                                        )}
                                                        <span className="text-xs uppercase font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Instant</span>
                                                    </div>
                                                </div>
                                            </Label>
                                        </div>
                                        <div
                                            onClick={() => setPaymentMethod("pesapal")}
                                            className={`relative flex items-center space-x-4 border-2 rounded-xl p-4 bg-white transition-all cursor-pointer ${
                                                paymentMethod === "pesapal"
                                                    ? "border-blue-500 bg-blue-50 shadow-sm"
                                                    : "border-border hover:border-blue-300"
                                            }`}>
                                            <RadioGroupItem value="pesapal" id="pesapal" />
                                            <Label htmlFor="pesapal" className="flex-1 cursor-pointer">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="bg-blue-100 p-2 rounded-lg">
                                                            <CreditCard className="h-6 w-6 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold">Visa / Mastercard</p>
                                                            <p className="text-xs text-muted-foreground">Pay with card on Pesapal&apos;s secure checkout</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {paymentMethod === "pesapal" && (
                                                            <span className="text-xs uppercase font-bold text-white bg-blue-500 px-2 py-1 rounded-full">✓ Selected</span>
                                                        )}
                                                        <span className="text-xs uppercase font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Global</span>
                                                    </div>
                                                </div>
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-primary flex items-center">
                                        <Truck className="mr-2 h-6 w-6 text-accent" /> Review Order
                                    </h2>
                                    <div className="space-y-4">
                                        <p className="text-muted-foreground">Please review your order carefully before confirmation. Items will be shipped from our verified suppliers in 15-30 business days.</p>
                                        <div className="bg-white rounded-xl p-6 border space-y-4">
                                            <div className="flex justify-between">
                                                <span className="font-bold">Country:</span>
                                                <span className="text-right">{deliveryInfo.country}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-bold">Delivery to:</span>
                                                <span className="text-right">{deliveryInfo.firstName} {deliveryInfo.lastName}, {deliveryInfo.city}...</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-bold">Method:</span>
                                                <span className="text-right">
                                                    {deliveryMethod === "pickup" 
                                                        ? `Pick-up Station (${deliveryOptions.stations.find(s => s.id === selectedStationId)?.name})` 
                                                        : `DHL Express Door-to-Door Delivery`}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-bold">Payment Plan:</span>
                                                <span className="text-right">
                                                    {paymentType === "FULL" ? "Pay in Full" : 
                                                     paymentType === "LAYBY" ? "Lipa Mdogo Mdogo (30% Deposit)" : 
                                                     "Pay on Delivery (Shipping Commitment)"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-bold">Payment Method:</span>
                                                <span className="text-right">
                                                    {paymentMethod === "mpesa_till" ? "M-Pesa (Till 3510645) via Pay Hero" :
                                                        paymentMethod === "wallet" ? "NairobiMart Wallet" :
                                                        paymentMethod === "pesapal" ? "Card (Visa/Mastercard) via Pesapal" : "Unknown"}
                                                </span>
                                            </div>
                                            {paymentMethod === "mpesa_till" && deliveryInfo.country === "Kenya" && (
                                                <div className="flex justify-between">
                                                    <span className="font-bold">M-Pesa Contact:</span>
                                                    <span className="text-right">{paymentMethod === "mpesa_till" ? `Till: 3510645` : (deliveryInfo.tillNumber ? `Till: ${deliveryInfo.tillNumber}` : `Phone: ${deliveryInfo.phone}`)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="pt-8 pb-8">
                            {checkoutError && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
                                    {checkoutError}
                                </div>
                            )}
                            <div className="flex items-center justify-between w-full">
                                {currentStep > 0 ? (
                                    <Button variant="ghost" onClick={() => setCurrentStep(currentStep - 1)}>
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                    </Button>
                                ) : (
                                    <div />
                                )}
                                <Button
                                    className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 h-12 text-lg font-bold"
                                    disabled={isProcessing}
                                    onClick={() => {
                                        if (currentStep < steps.length - 1) {
                                            setCurrentStep(currentStep + 1);
                                        } else {
                                            handleConfirmOrder();
                                        }
                                    }}
                                >
                                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {currentStep === steps.length - 1 ? "Confirm Order" : "Continue"} <ChevronRight className="ml-2 h-5 w-5" />
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </div>

                {/* Order Summary Sidebar */}
                <div className="w-full lg:w-96 space-y-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="max-h-64 overflow-y-auto space-y-4 pr-2">
                                {items.map((item) => (
                                    <div key={item.id} className="flex space-x-3">
                                        <div className="relative h-16 w-16 rounded overflow-hidden flex-shrink-0 bg-muted">
                                            <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-semibold line-clamp-1">{item.name}</h4>
                                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                            <p className="text-sm font-bold mt-1">KES {(item.price * item.quantity).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal</span>
                                    <span className="font-medium">KES {visibleTotalPrice.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Shipping Fee</span>
                                    <span className="font-medium">KES {shippingFee.toLocaleString()}</span>
                                </div>
                                {couponDiscount > 0 && (
                                    <div className="flex justify-between text-sm text-green-700">
                                        <span>Coupon Discount</span>
                                        <span className="font-medium">- KES {couponDiscount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                    <span>Total</span>
                                    <span className="text-accent">KES {finalTotal.toLocaleString()}</span>
                                </div>
                                {paymentType === "LAYBY" && (
                                    <>
                                        <div className="flex justify-between text-sm pt-2">
                                            <span>Required Deposit (30%)</span>
                                            <span className="font-bold text-orange-600">KES {laybyDeposit.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Balance Due</span>
                                            <span className="font-medium">KES {laybyBalance.toLocaleString()}</span>
                                        </div>
                                    </>
                                )}
                                {paymentType === "COMMITMENT" && (
                                    <>
                                        <div className="flex justify-between text-sm pt-2">
                                            <span>Commitment Fee (Due Now)</span>
                                            <span className="font-bold text-orange-600">KES {commitmentDeposit.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Balance Due on Delivery</span>
                                            <span className="font-medium">KES {commitmentBalance.toLocaleString()}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="pt-4">
                                <Input
                                    placeholder="Coupon code"
                                    className="mb-2"
                                    value={couponCode}
                                    onChange={(event) => setCouponCode(event.target.value)}
                                />
                                <Button
                                    variant="outline"
                                    className="w-full text-xs"
                                    onClick={applyCoupon}
                                >
                                    Apply Coupon
                                </Button>
                                {couponMessage && (
                                    <p className={couponDiscount > 0 ? "text-xs mt-2 text-green-700" : "text-xs mt-2 text-red-600"}>
                                        {couponMessage}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="text-[11px] text-muted-foreground bg-muted/20 p-4 rounded-lg">
                        <p className="text-center">By confirming, you agree to NairobiMart&apos;s <strong>Terms of Service</strong> and acknowledge the <strong>15-30 Business Day shipping timeline</strong>.</p>
                    </div>
                </div>
            </div>

            {/* STK Push Initiated Modal */}
            {showStkInitiated && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center">
                            <div className="flex justify-center mb-4">
                                <Smartphone className="h-12 w-12 text-accent animate-pulse" />
                            </div>
                            <CardTitle>STK Push Initiated</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center space-y-2">
                                <p className="text-sm font-medium">
                                    A payment prompt has been sent to your phone.
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Enter your M-Pesa PIN to confirm the payment of <strong>KES {finalTotal.toLocaleString()}</strong>
                                </p>
                            </div>
                            
                            <div className="bg-muted p-4 rounded-lg text-center">
                                <p className="text-xs text-muted-foreground mb-2">Waiting for payment confirmation...</p>
                                <div className="flex justify-center items-center space-x-1">
                                    <div className="h-2 w-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
                                    <div className="h-2 w-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                                    <div className="h-2 w-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">({stkPollingSeconds}s elapsed)</p>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-xs text-blue-900">
                                    <strong>Tip:</strong> If you don't see the prompt, check that your phone is not in airplane mode and has enough signal.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => {
                                    setShowStkInitiated(false);
                                    setStkOrderId(null);
                                    setCheckoutError("Payment cancelled. You can return to checkout to try again.");
                                }}
                            >
                                Cancel & Go Back
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    );
}
