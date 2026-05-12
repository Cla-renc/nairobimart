"use client";

import { useState, useEffect } from "react";
import {
    CreditCard,
    MapPin,
    Truck,
    CheckCircle2,
    ChevronRight,
    ArrowLeft,
    Smartphone
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

    const { items, getTotalPrice, clearCart } = useCartStore();
    const router = useRouter();
    const totalPrice = getTotalPrice();
    const visibleTotalPrice = isMounted ? totalPrice : 0;
    const shippingFee = 500; // Mock shipping fee

    const isMpesaAvailable = deliveryInfo.country === "Kenya";

    useEffect(() => {
        setIsMounted(true);
        // Default to pesapal (Visa) if no payment method has been chosen yet
        setPaymentMethod((prev) => prev || "pesapal");
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (deliveryInfo.country !== "Kenya" && paymentMethod === "mpesa") {
            setPaymentMethod("pesapal");
        }
    }, [deliveryInfo.country, paymentMethod]);

    const [checkoutError, setCheckoutError] = useState<string | null>(null);

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
        if (paymentMethod === "mpesa" && deliveryInfo.country === "Kenya" && !deliveryInfo.phone && !deliveryInfo.tillNumber) {
            setCheckoutError("For M-Pesa payments, please provide either a phone number or till number.");
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
                }),
            });

            const data = await response.json();
            console.log("Checkout response:", data);

            if (data.success) {
                if (data.type === "pesapal" && data.url) {
                    console.log("Redirecting to PesaPal URL:", data.url);
                    window.location.href = data.url;
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
                                                <Label htmlFor="phone">Phone Number (M-Pesa)</Label>
                                                <Input
                                                    id="phone"
                                                    placeholder="+254 700 000 000"
                                                    value={deliveryInfo.phone}
                                                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, phone: e.target.value })}
                                                />
                                                <p className="text-xs text-muted-foreground">Required for M-Pesa STK Push payments</p>
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
                                        {deliveryInfo.country === "Kenya" && (
                                            <div className="space-y-2">
                                                <Label htmlFor="county">County</Label>
                                                <Input
                                                    id="county"
                                                    placeholder="Nairobi"
                                                    value={deliveryInfo.county}
                                                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, county: e.target.value })}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {currentStep === 1 && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-primary flex items-center">
                                        <CreditCard className="mr-2 h-6 w-6 text-accent" /> Payment Method
                                    </h2>
                                    <RadioGroup
                                        value={paymentMethod}
                                        onValueChange={(val) => setPaymentMethod(val)}
                                        className="grid grid-cols-1 gap-4"
                                    >
                                        {isMpesaAvailable && (
                                            <div className="flex items-center space-x-4 border rounded-xl p-4 bg-white hover:border-accent transition-colors cursor-pointer">
                                                <RadioGroupItem value="mpesa" id="mpesa" />
                                                <Label htmlFor="mpesa" className="flex-1 cursor-pointer">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="bg-green-100 p-2 rounded-lg">
                                                                <Smartphone className="h-6 w-6 text-green-600" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold">M-Pesa</p>
                                                                <p className="text-xs text-muted-foreground">Pay via STK Push prompt on your phone</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs uppercase font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">Preferred</span>
                                                    </div>
                                                </Label>
                                            </div>
                                        )}
                                        <div className="flex items-center space-x-4 border rounded-xl p-4 bg-white hover:border-accent transition-colors cursor-pointer">
                                            <RadioGroupItem value="pesapal" id="pesapal" />
                                            <Label htmlFor="pesapal" className="flex-1 cursor-pointer">
                                                <div className="flex items-center space-x-3">
                                                    <div className="bg-blue-100 p-2 rounded-lg">
                                                        <CreditCard className="h-6 w-6 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold">Visa / Mastercard</p>
                                                        <p className="text-xs text-muted-foreground">Secure card payments across East Africa</p>
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
                                                <span className="font-bold">Payment Method:</span>
                                                <span className="text-right">
                                                    {paymentMethod === "mpesa" ? "M-Pesa" :
                                                        paymentMethod === "pesapal" ? "Visa/Mastercard" : "Unknown"}
                                                </span>
                                            </div>
                                            {paymentMethod === "mpesa" && deliveryInfo.country === "Kenya" && (
                                                <div className="flex justify-between">
                                                    <span className="font-bold">M-Pesa Contact:</span>
                                                    <span className="text-right">{deliveryInfo.tillNumber ? `Till: ${deliveryInfo.tillNumber}` : `Phone: ${deliveryInfo.phone}`}</span>
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
                                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                    <span>Total</span>
                                    <span className="text-accent">KES {(visibleTotalPrice + shippingFee).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="pt-4">
                                <Input placeholder="Coupon code" className="mb-2" />
                                <Button variant="outline" className="w-full text-xs">Apply Coupon</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="text-[11px] text-muted-foreground bg-muted/20 p-4 rounded-lg">
                        <p className="text-center">By confirming, you agree to NairobiMart&apos;s <strong>Terms of Service</strong> and acknowledge the <strong>15-30 Business Day shipping timeline</strong>.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
