"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
    listNotifications,
    markAllNotificationsRead,
    markNotificationRead,
} from "@/lib/reportApi";
import { type Notification } from "@/types/Notification";

const formatRelative = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "just now";
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    return `${day}d ago`;
};

export default function NotificationBell() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const { notifications: list, unreadCount: count } =
                await listNotifications();
            setNotifications(list);
            setUnreadCount(count);
        } catch {
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        const interval = window.setInterval(load, 60000);
        return () => window.clearInterval(interval);
    }, [load]);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const handleNotificationClick = async (n: Notification) => {
        try {
            if (!n.isRead) {
                await markNotificationRead(n._id);
                setNotifications((prev) =>
                    prev.map((item) =>
                        item._id === n._id ? { ...item, isRead: true } : item,
                    ),
                );
                setUnreadCount((c) => Math.max(0, c - 1));
            }
        } catch (err) {
            console.error("Failed to mark read", err);
        } finally {
            setOpen(false);
            if (n.link) router.push(n.link);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, isRead: true })),
            );
            setUnreadCount(0);
            toast.success("All notifications marked as read");
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to mark all read",
            );
        }
    };

    return (
        <div ref={wrapperRef} className="relative">
            <button
                type="button"
                onClick={() => {
                    setOpen((prev) => !prev);
            if (!open) void load();
                }}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-cusblue shadow-sm transition"
                aria-label="Notifications">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-2 w-96 max-w-[90vw] overflow-hidden rounded-3xl border border-cusblue/10 bg-white shadow-2xl">
                    <div className="flex items-center justify-between bg-linear-to-r from-cusblue to-cusviolet px-4 py-3 text-white">
                        <h3 className="text-sm font-black">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={handleMarkAllRead}
                                className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[11px] font-bold transition hover:bg-white/25">
                                <Check className="h-3 w-3" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto">
                        {loading ? (
                            <p className="p-6 text-center text-sm font-semibold text-slate-500">
                                Loading...
                            </p>
                        ) : notifications.length === 0 ? (
                            <p className="p-6 text-center text-sm font-semibold text-slate-500">
                                You have no notifications.
                            </p>
                        ) : (
                            notifications.map((n) => (
                                <button
                                    type="button"
                                    key={n._id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={`flex w-full flex-col items-start gap-1 border-b border-cusblue/5 px-4 py-3 text-left transition hover:bg-cuscream/40 ${
                                        n.isRead ? "bg-white" : "bg-cusviolet/5"
                                    }`}>
                                    <div className="flex w-full items-start justify-between gap-2">
                                        <p
                                            className={`text-sm leading-snug ${
                                                n.isRead
                                                    ? "font-medium text-slate-700"
                                                    : "font-extrabold text-cusblue"
                                            }`}>
                                            {n.message}
                                        </p>
                                        {!n.isRead && (
                                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cusviolet" />
                                        )}
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        {formatRelative(n.createdAt)}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
