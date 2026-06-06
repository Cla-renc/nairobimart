"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/lib/button-variants";

export default function DeleteOrderButton({ orderId }: { orderId: string }) {
    const [loading, setLoading] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirmed) {
            setConfirmed(true);
            // Auto-reset confirmation after 3s
            setTimeout(() => setConfirmed(false), 3000);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
            if (res.ok) {
                router.refresh();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to delete order.");
            }
        } catch {
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
            setConfirmed(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "rounded-xl text-xs font-bold flex items-center gap-1",
                confirmed
                    ? "bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                    : "text-red-400 hover:text-red-600 hover:bg-red-50"
            )}
            title={confirmed ? "Click again to confirm deletion" : "Delete this order"}
        >
            {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
                <Trash2 className="h-3 w-3" />
            )}
            {confirmed ? "Confirm?" : "Delete"}
        </button>
    );
}
