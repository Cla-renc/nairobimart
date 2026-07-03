"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
    Bell, Check, ShoppingBag, Star, Package, MessageSquare,
    AlertTriangle, Info, CheckCircle2, X, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    link?: string;
    createdAt: string;
}

function getNotifStyle(type: string) {
    switch (type) {
        case "new_order":
            return { icon: ShoppingBag, bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500", iconColor: "text-blue-600" };
        case "new_review":
            return { icon: Star, bg: "bg-yellow-50", border: "border-yellow-200", dot: "bg-yellow-500", iconColor: "text-yellow-600" };
        case "low_stock":
            return { icon: AlertTriangle, bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500", iconColor: "text-red-600" };
        case "contact_form":
            return { icon: MessageSquare, bg: "bg-purple-50", border: "border-purple-200", dot: "bg-purple-500", iconColor: "text-purple-600" };
        case "stock_update":
            return { icon: Package, bg: "bg-green-50", border: "border-green-200", dot: "bg-green-500", iconColor: "text-green-600" };
        default:
            return { icon: Info, bg: "bg-gray-50", border: "border-gray-200", dot: "bg-gray-400", iconColor: "text-gray-600" };
    }
}

export default function AdminNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    const fetchNotifications = useCallback(async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        try {
            const res = await fetch("/api/admin/notifications");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setRefreshing(false);
        }
    }, []);

    // Poll every 15 seconds for live updates
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(() => fetchNotifications(), 15000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Close when clicking outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (
                panelRef.current && !panelRef.current.contains(e.target as Node) &&
                triggerRef.current && !triggerRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    const markAllAsRead = async () => {
        setLoading(true);
        try {
            await fetch("/api/admin/notifications/mark-read", { method: "POST" });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await fetch(`/api/admin/notifications/${id}/mark-read`, { method: "POST" });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    };

    return (
        <div className="relative">
            {/* Bell Trigger Button */}
            <button
                ref={triggerRef}
                onClick={() => {
                    setOpen(o => !o);
                    if (!open) fetchNotifications();
                }}
                className="relative flex items-center justify-center h-11 w-11 rounded-xl bg-muted/60 hover:bg-muted border border-border/50 hover:border-primary/20 transition-all duration-200 hover:shadow-md group"
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5 text-foreground/70 group-hover:text-primary transition-colors" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Panel */}
            {open && (
                <div
                    ref={panelRef}
                    className="absolute right-0 top-14 w-96 max-h-[520px] flex flex-col rounded-2xl border border-border/60 bg-white shadow-2xl shadow-black/10 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
                        <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4 text-primary" />
                            <h3 className="font-bold text-sm text-foreground">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => fetchNotifications(true)}
                                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                                title="Refresh"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${refreshing ? "animate-spin" : ""}`} />
                            </button>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    disabled={loading}
                                    className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 px-2 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
                                >
                                    <CheckCircle2 className="h-3 w-3" />
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1.5 rounded-lg hover:bg-muted transition-colors ml-1"
                            >
                                <X className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="flex-1 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
                                    <Bell className="h-6 w-6 text-muted-foreground opacity-40" />
                                </div>
                                <p className="font-semibold text-sm text-foreground">All caught up!</p>
                                <p className="text-xs text-muted-foreground mt-1">No notifications yet. New orders and alerts will appear here.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/40">
                                {notifications.map((notif) => {
                                    const style = getNotifStyle(notif.type);
                                    const Icon = style.icon;

                                    const content = (
                                        <div
                                            className={`flex gap-3 px-4 py-3.5 transition-colors hover:bg-muted/30 ${!notif.isRead ? style.bg : "bg-white"} cursor-pointer`}
                                            onClick={() => !notif.isRead && markAsRead(notif.id)}
                                        >
                                            {/* Icon */}
                                            <div className={`flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center ${!notif.isRead ? style.bg : "bg-muted"} border ${style.border}`}>
                                                <Icon className={`h-4 w-4 ${style.iconColor}`} />
                                            </div>
                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={`text-[13px] font-semibold leading-tight ${!notif.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                                                        {notif.title}
                                                    </p>
                                                    {!notif.isRead && (
                                                        <span className={`flex-shrink-0 h-2 w-2 rounded-full mt-1 ${style.dot}`} />
                                                    )}
                                                </div>
                                                <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                                                    {notif.message}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground/70 mt-1.5">
                                                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                    );

                                    return (
                                        <div key={notif.id}>
                                            {notif.link ? (
                                                <a href={notif.link} className="block" onClick={() => !notif.isRead && markAsRead(notif.id)}>
                                                    {content}
                                                </a>
                                            ) : (
                                                content
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-3 border-t bg-muted/20">
                            <p className="text-[11px] text-muted-foreground text-center">
                                Showing last {notifications.length} notifications · Auto-refreshes every 15s
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
