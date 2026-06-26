"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface BrandLogoProps {
    compact?: boolean;
    className?: string;
}

export default function BrandLogo({ compact = false, className = "" }: BrandLogoProps) {
    const [settings, setSettings] = useState<Record<string, string> | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await fetch('/api/site-settings');
                if (!res.ok) return;
                const data = await res.json();
                if (mounted) setSettings(data);
            } catch (e) {
                // ignore
            }
        })();
        return () => { mounted = false };
    }, []);

    const logoSrc = settings?.logo_url || "/images/nairobimart-logo.svg";
    const storeName = settings?.store_name || 'NairobiMart';
    const tagline = settings?.store_tagline || 'Shop Smart. Shop Kenya.';

    const parts = storeName.split(/\s+/);
    const first = parts.slice(0, -1).join(' ') || storeName;
    const second = parts.slice(-1).join(' ');

    return (
        <div className={`flex items-center ${className}`}>
            <div className="relative inline-flex h-11 w-11 overflow-hidden rounded-3xl bg-slate-950 text-white shadow-lg shadow-slate-950/10">
                <Image src={logoSrc} alt={`${storeName} logo`} fill className="object-cover" />
            </div>
            {!compact && (
                <div className="ml-3 leading-tight">
                    <div className="flex items-end gap-1">
                        <span className="text-xl font-extrabold text-slate-950">{first}</span>
                        <span className="text-xl font-extrabold text-amber-400">{second}</span>
                    </div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500 mt-0.5">
                        {tagline}
                    </p>
                </div>
            )}
        </div>
    );
}
