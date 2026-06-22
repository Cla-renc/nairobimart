"use client";

import { useState, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
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

export default function AdminNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/admin/notifications");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const markAllAsRead = async () => {
        try {
            await fetch("/api/admin/notifications/mark-read", { method: "POST" });
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await fetch(`/api/admin/notifications/${id}/mark-read`, { method: "POST" });
            setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    };

    return (
        <Sheet>
            <SheetTrigger render={
                <Button variant="ghost" size="icon" className="relative group">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 flex h-3 w-3 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white border-2 border-white">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            } />
            <SheetContent side="right" className="w-full sm:w-[400px] flex flex-col p-0">
                <SheetHeader className="p-4 border-b">
                    <div className="flex items-center justify-between">
                        <SheetTitle>Notifications</SheetTitle>
                        {unreadCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8 text-xs text-muted-foreground hover:text-primary">
                                <Check className="h-3 w-3 mr-1" />
                                Mark all as read
                            </Button>
                        )}
                    </div>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {notifications.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No notifications yet.</p>
                        </div>
                    ) : (
                        notifications.map((notif) => {
                            const Content = (
                                <div className={`p-4 rounded-lg border ${notif.isRead ? 'bg-muted/30 border-transparent' : 'bg-blue-50/50 border-blue-100'} transition-colors hover:shadow-sm`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`text-sm font-semibold ${notif.isRead ? 'text-foreground' : 'text-primary'}`}>{notif.title}</h4>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{notif.message}</p>
                                </div>
                            );

                            return (
                                <div key={notif.id} onClick={() => !notif.isRead && markAsRead(notif.id)} className="cursor-pointer">
                                    {notif.link ? (
                                        <a href={notif.link} className="block">
                                            {Content}
                                        </a>
                                    ) : (
                                        Content
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
