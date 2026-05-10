import Image from "next/image";

interface BrandLogoProps {
    compact?: boolean;
    className?: string;
}

const logoSrc = "/images/nairobimart-logo.svg";

export default function BrandLogo({ compact = false, className = "" }: BrandLogoProps) {
    return (
        <div className={`flex items-center ${className}`}>
            <div className="relative inline-flex h-11 w-11 overflow-hidden rounded-3xl bg-slate-950 text-white shadow-lg shadow-slate-950/10">
                <Image src={logoSrc} alt="NairobiMart logo" fill className="object-cover" />
            </div>
            {!compact && (
                <div className="ml-3 leading-tight">
                    <div className="flex items-end gap-1">
                        <span className="text-xl font-extrabold text-slate-950">Nairobi</span>
                        <span className="text-xl font-extrabold text-amber-400">Mart</span>
                    </div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500 mt-0.5">
                        Shop Smart. Shop Kenya.
                    </p>
                </div>
            )}
        </div>
    );
}
