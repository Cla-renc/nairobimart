"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

export default function DeleteRecentOrderButton({ orderId }: { orderId: string }) {
    const [confirmed, setConfirmed] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirmed) {
            setConfirmed(true);
            setTimeout(() => setConfirmed(false), 3000);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
            if (res.ok) {
                router.refresh();
            } else {
                alert("Failed to delete order.");
            }
        } catch {
            alert("Something went wrong.");
        } finally {
            setLoading(false);
            setConfirmed(false);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            title={confirmed ? "Click again to confirm" : "Delete order"}
            className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold ${
                confirmed
                    ? "bg-red-100 text-red-700"
                    : "text-red-400 hover:bg-red-50 hover:text-red-600"
            }`}
        >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            {confirmed && <span>Confirm?</span>}
        </button>
    );
}
