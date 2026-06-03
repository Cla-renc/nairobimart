"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export default function FlashSaleCountdown({ endsAt }: { endsAt: string | Date }) {
    const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

    useEffect(() => {
        const targetDate = new Date(endsAt).getTime();

        const calculateTimeLeft = () => {
            const difference = targetDate - new Date().getTime();
            if (difference > 0) {
                return {
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                };
            }
            return { hours: 0, minutes: 0, seconds: 0 };
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [endsAt]);

    if (!timeLeft) return null;

    return (
        <div className="flex items-center space-x-2 bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-bold">
            <Clock className="w-4 h-4" />
            <span>
                {timeLeft.hours.toString().padStart(2, '0')}h : {timeLeft.minutes.toString().padStart(2, '0')}m : {timeLeft.seconds.toString().padStart(2, '0')}s
            </span>
        </div>
    );
}
