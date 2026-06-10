"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

// EAT is UTC+3. The server stores flashSaleEndsAt in UTC.
// new Date() on the client is already in local time, so JavaScript handles the 
// UTC-to-local conversion automatically. However, we surface the EAT label
// to avoid any confusion from server-side rendering in UTC.

export default function FlashSaleCountdown({ endsAt }: { endsAt: string | Date }) {
    const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; ended: boolean } | null>(null);

    useEffect(() => {
        // Parse the ISO string. JavaScript always treats this as UTC and
        // converts to the local clock — so this is correct whether the
        // client is in EAT, UTC, or any other timezone.
        const targetDate = new Date(endsAt).getTime();

        const calculateTimeLeft = () => {
            // Use Date.now() which is always UTC ms — safe for all timezones
            const difference = targetDate - Date.now();
            if (difference > 0) {
                return {
                    hours: Math.floor(difference / (1000 * 60 * 60)),
                    minutes: Math.floor((difference / (1000 * 60)) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                    ended: false,
                };
            }
            return { hours: 0, minutes: 0, seconds: 0, ended: true };
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            const t = calculateTimeLeft();
            setTimeLeft(t);
            if (t.ended) clearInterval(timer);
        }, 1000);

        return () => clearInterval(timer);
    }, [endsAt]);

    if (!timeLeft) return null;

    if (timeLeft.ended) {
        return (
            <div className="flex items-center space-x-2 bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-sm font-bold">
                <Clock className="w-4 h-4" />
                <span>SALE ENDED</span>
            </div>
        );
    }

    return (
        <div className="flex items-center space-x-2 bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-bold">
            <Clock className="w-4 h-4 animate-pulse" />
            <span>
                {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s (EAT)
            </span>
        </div>
    );
}

