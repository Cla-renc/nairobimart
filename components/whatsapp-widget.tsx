"use client";


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

    // Real support number
    const phoneNumber = "254759193674"; 
    const message = "Hello NairobiMart, I am interested in a product...";

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
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
                    <path d="M12.031 0C5.385 0 0 5.388 0 12.033c0 2.126.554 4.195 1.61 6.01L.224 23.4l5.495-1.442a12.012 12.012 0 0 0 6.312 1.782h.005c6.645 0 12.032-5.388 12.032-12.032C24.067 5.388 18.675 0 12.031 0zm.005 21.722h-.003a10.026 10.026 0 0 1-5.111-1.393l-.367-.217-3.799.997 1.018-3.702-.238-.378a9.988 9.988 0 0 1-1.528-5.26C1.984 6.273 6.471 1.788 12.036 1.788c5.566 0 10.05 4.484 10.05 10.052s-4.484 10.052-10.05 10.052zm5.518-7.534c-.302-.152-1.792-.885-2.07-.988-.278-.103-.48-.152-.682.152-.202.304-.783.988-.96 1.19-.177.202-.353.228-.656.076-.303-.152-1.28-.472-2.439-1.506-.902-.806-1.51-1.802-1.687-2.106-.177-.304-.019-.468.132-.619.136-.136.303-.354.455-.53.152-.178.202-.304.303-.507.101-.202.05-.38-.025-.531-.076-.152-.682-1.644-.934-2.253-.245-.591-.495-.51-.682-.519-.177-.008-.38-.01-.582-.01-.202 0-.53.076-.808.38-.278.303-1.06 1.037-1.06 2.53s1.086 2.934 1.237 3.136c.152.202 2.137 3.262 5.176 4.57 1.666.719 2.532.793 3.393.754.67-.03 2.07-.846 2.361-1.664.29-.818.29-1.519.202-1.665-.088-.147-.302-.236-.604-.388z"/>
                </svg>
                <span className="sr-only">Chat on WhatsApp</span>
            </Link>
        </div>
    );
}
