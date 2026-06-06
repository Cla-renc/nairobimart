"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

interface AdminDeleteOrderButtonProps {
    orderId: string;
    onDeleted: () => void;
}

export default function AdminDeleteOrderButton({ orderId, onDeleted }: AdminDeleteOrderButtonProps) {
    const [confirmed, setConfirmed] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        if (!confirmed) {
            setConfirmed(true);
            setTimeout(() => setConfirmed(false), 3000);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/orders/${orderId}`, { method: "DELETE" });
            if (res.ok) {
                onDeleted();
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
            className={`flex items-center w-full px-2 py-1.5 text-sm rounded cursor-pointer ${
                confirmed ? "text-red-700 font-bold bg-red-50" : "text-red-600"
            }`}
        >
            {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Trash2 className="mr-2 h-4 w-4" />
            )}
            {confirmed ? "Confirm Delete?" : "Delete Order"}
        </button>
    );
}
