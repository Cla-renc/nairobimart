"use client";

import { useEffect, useState } from "react";
import { useCurrencyStore } from "@/store/currencyStore";

export function useCurrency() {
    const { currency, exchangeRates, setCurrency, setExchangeRates } = useCurrencyStore();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // Fetch exchange rates and IP country on first load if not cached recently
        const initCurrency = async () => {
            try {
                // 1. Fetch live rates
                const rateRes = await fetch("https://open.er-api.com/v6/latest/KES");
                if (rateRes.ok) {
                    const data = await rateRes.json();
                    if (data.rates) {
                        setExchangeRates({
                            KES: 1,
                            UGX: data.rates.UGX || 28.5,
                            TZS: data.rates.TZS || 20.2,
                        });
                    }
                }

                // 2. Fetch User IP country (using free ipapi.co)
                // Only if they haven't explicitly set currency, but here we can just set it once.
                // To avoid overriding user preference, we might check if they have a saved preference.
                // Since this runs on mount, if there's no saved currency in localStorage, it sets it.
                // Zustand persist saves it, so we can check if it's the default 'KES' and this is the first visit.
                const hasVisited = localStorage.getItem("hasVisitedNairobiMart");
                if (!hasVisited) {
                    const ipRes = await fetch("https://ipapi.co/json/");
                    if (ipRes.ok) {
                        const ipData = await ipRes.json();
                        if (ipData.country_code === "UG") setCurrency("UGX");
                        else if (ipData.country_code === "TZ") setCurrency("TZS");
                        else setCurrency("KES");
                    }
                    localStorage.setItem("hasVisitedNairobiMart", "true");
                }
            } catch (err) {
                console.warn("Failed to fetch currency details", err);
            }
        };

        initCurrency();
    }, [setCurrency, setExchangeRates]);

    // Format price from Base (KES) to selected currency
    const formatPrice = (basePriceInKes: number) => {
        if (!isMounted) return `KES ${basePriceInKes.toLocaleString()}`; // SSR fallback

        const rate = exchangeRates[currency] || 1;
        const convertedPrice = basePriceInKes * rate;
        
        // UGX and TZS usually don't have decimals, KES sometimes does but we keep it clean
        const roundedPrice = Math.round(convertedPrice);
        
        return `${currency} ${roundedPrice.toLocaleString()}`;
    };

    return { currency, setCurrency, formatPrice, isMounted, exchangeRates };
}
