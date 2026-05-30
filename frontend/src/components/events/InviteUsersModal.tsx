"use client";

import { type MouseEvent, useEffect, useRef, useState } from "react";
import { Search, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Button from "@/components/buttons/Button";
import UserAvatar from "@/components/common/UserAvatar";
import {
    type EventInviteUser,
    searchEventInviteUsers,
    sendEventInvite,
} from "@/lib/eventApi";
import type { Event } from "@/types/Event";

type InviteUsersModalProps = {
    event: Event;
    onClose: () => void;
};

export default function InviteUsersModal({
    event,
    onClose,
}: InviteUsersModalProps) {
    const router = useRouter();
    const modalRef = useRef<HTMLDivElement>(null);
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState<EventInviteUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [sendingUserId, setSendingUserId] = useState<string | null>(null);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    useEffect(() => {
        let cancelled = false;
        const timeout = window.setTimeout(async () => {
            try {
                setLoading(true);
                const results = await searchEventInviteUsers(event._id, search);
                if (!cancelled) setUsers(results);
            } catch (err) {
                if (!cancelled) {
                    setUsers([]);
                    toast.error(
                        err instanceof Error
                            ? err.message
                            : "Failed to load users",
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, 250);

        return () => {
            cancelled = true;
            window.clearTimeout(timeout);
        };
    }, [event._id, search]);

    const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    const handleSendInvite = async (user: EventInviteUser) => {
        if (sendingUserId) return;

        setSendingUserId(user._id);
        try {
            await sendEventInvite(event._id, user._id);
            toast.success(`Invite sent to ${user.userName}`);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to send invite",
            );
        } finally {
            setSendingUserId(null);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-cusblue/40 px-4 py-6 backdrop-blur-sm"
            onMouseDown={handleBackdropClick}>
            <div
                ref={modalRef}
                className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/50 bg-white/80 shadow-2xl shadow-cusblue/20 backdrop-blur-xl"
                onMouseDown={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between gap-4 border-b border-cusblue/10 px-5 py-4">
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-cusviolet/70">
                            Invite guests
                        </p>
                        <h2 className="text-xl font-black text-cusblue">
                            {event.eventName}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-cusviolet transition hover:bg-cusblue/10 hover:text-cusblue"
                        aria-label="Close invite modal">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4 p-5">
                    <label className="relative block">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cusviolet/60" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by username"
                            className="w-full rounded-2xl border border-cusblue/10 bg-white/75 py-3 pl-11 pr-4 text-sm font-semibold text-cusblue outline-none transition placeholder:text-cusviolet/45 focus:border-cusviolet/40 focus:ring-4 focus:ring-cusviolet/10"
                        />
                    </label>

                    <div className="max-h-[55vh] overflow-y-auto rounded-2xl border border-cusblue/10 bg-white/55">
                        {loading ? (
                            <p className="px-4 py-8 text-center text-sm font-bold text-cusviolet/70">
                                Loading users...
                            </p>
                        ) : users.length === 0 ? (
                            <p className="px-4 py-8 text-center text-sm font-bold text-cusviolet/70">
                                No registered users found.
                            </p>
                        ) : (
                            <ul className="divide-y divide-cusblue/10">
                                {users.map((user) => (
                                    <li
                                        key={user._id}
                                        className="flex items-center gap-3 px-4 py-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onClose();
                                                router.push(
                                                    `/home/profile/${user._id}/others`,
                                                );
                                            }}
                                            className="flex min-w-0 flex-1 items-center gap-3 text-left">
                                            <UserAvatar
                                                src={user.profilePicture}
                                                name={user.userName}
                                                size="small"
                                            />
                                            <span className="block truncate text-sm font-black text-cusblue transition hover:text-cusviolet">
                                                {user.userName}
                                            </span>
                                        </button>
                                        <Button
                                            className="shrink-0 rounded-xl px-3 py-2 text-xs"
                                            loading={sendingUserId === user._id}
                                            disabled={
                                                Boolean(sendingUserId) &&
                                                sendingUserId !== user._id
                                            }
                                            onClick={() =>
                                                handleSendInvite(user)
                                            }>
                                            <Send className="h-3.5 w-3.5" />
                                            Send Invite
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
