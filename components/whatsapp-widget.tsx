"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function WhatsAppWidget() {
    const [isVisible, setIsVisible] = useState(false);

    // Show widget after a slight delay to not distract immediately
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    if (!isVisible) return null;

    // TODO: Replace with the actual support number from SiteSettings or environment variables
    const phoneNumber = "254700000000"; 
    const message = "Hello NairobiMart, I need some help with...";

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white px-4 py-2 rounded-2xl shadow-lg border text-sm font-medium mb-3 mr-2 animate-bounce">
                Need help? Chat with us! 👋
            </div>
            <Link 
                href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25D366] hover:bg-[#1ebe57] text-white p-4 rounded-full shadow-xl transition-transform hover:scale-110 flex items-center justify-center"
            >
                <MessageCircle className="h-8 w-8" />
                <span className="sr-only">Chat on WhatsApp</span>
            </Link>
        </div>
    );
}
