"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CalendarDays, Eye, PauseCircle } from "lucide-react";
import {
    AdminShell,
    EmptyState,
    LoadingBlock,
    PageHeader,
    SearchField,
    StatusBadge,
    formatDateTime,
} from "@/components/admin/AdminShared";
import { listEvents, suspendEvent } from "@/lib/adminApi";
import type { AdminEvent, AdminEventHost } from "@/types/Admin";
import { openConfirmationDialog } from "@/components/confirm/openConfirmationDialog";

function getHostLabel(host?: string | AdminEventHost) {
    if (!host) return "Unknown host";
    if (typeof host === "string") return host;
    return host.userName || host.email || "Unknown host";
}

export default function AdminEventsPage() {
    const [events, setEvents] = useState<AdminEvent[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    const loadEvents = useCallback(async () => {
        try {
            setLoading(true);
            setEvents(await listEvents(search));
        } catch (error) {
            toast.error((error as Error).message);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            void loadEvents();
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [loadEvents]);

    const counts = useMemo(
        () => ({
            active: events.filter((event) => event.status === "Active").length,
            completed: events.filter((event) => event.status === "Completed")
                .length,
            cancelled: events.filter((event) => event.status === "Cancelled")
                .length,
        }),
        [events],
    );

    const onSuspend = (event: AdminEvent) => {
        openConfirmationDialog({
            title: "Suspend event?",
            message: `${event.eventName} will be marked as cancelled and uploads will no longer be accepted.`,
            confirmText: "Suspend Event",
            cancelText: "Keep Event",
            isDanger: true,
            onConfirm: async () => {
                const toastId = toast.loading("Suspending event...");
                try {
                    await suspendEvent(event._id);
                    await loadEvents();
                    toast.success("Event suspended", { id: toastId });
                } catch (error) {
                    toast.error((error as Error).message, { id: toastId });
                    throw error;
                }
            },
        });
    };

    return (
        <AdminShell>
            <PageHeader
                eyebrow="Event moderation"
                title="Events"
                description="Review events across the platform and open detailed moderation views without gallery content."
                action={
                    <SearchField
                        value={search}
                        onChange={setSearch}
                        placeholder="Search events"
                    />
                }
            />

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
                <StatPill label="Active" value={counts.active} />
                <StatPill label="Completed" value={counts.completed} />
                <StatPill label="Suspended" value={counts.cancelled} />
            </div>

            {loading ? (
                <LoadingBlock label="Loading events..." />
            ) : events.length === 0 ? (
                <EmptyState
                    icon={<CalendarDays className="h-8 w-8" />}
                    title="No events found"
                    description="Try a different event name or clear the search field."
                />
            ) : (
                <div className="grid gap-5 lg:grid-cols-2">
                    {events.map((event) => (
                        <article
                            key={event._id}
                            className="rounded-3xl border border-cusblue/10 bg-white/60 p-5 shadow-xl shadow-cusblue/5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h2 className="text-xl font-extrabold text-cusblue">
                                            {event.eventName}
                                        </h2>
                                        <StatusBadge status={event.status} />
                                    </div>
                                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-cusviolet/70">
                                        {event.description ||
                                            "No description provided."}
                                    </p>
                                </div>
                                <span className="rounded-full bg-cusviolet/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-cusviolet">
                                    {event.tier || "free"}
                                </span>
                            </div>

                            <div className="mt-5 grid gap-3 text-sm text-cusviolet/75 sm:grid-cols-2">
                                <Info
                                    label="Host"
                                    value={getHostLabel(event.hostId)}
                                />
                                <Info
                                    label="Participants"
                                    value={String(event.participantCount || 0)}
                                />
                                <Info
                                    label="Starts"
                                    value={formatDateTime(event.startTime)}
                                />
                                <Info
                                    label="Ends"
                                    value={formatDateTime(event.endTime)}
                                />
                            </div>

                            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                                <Link
                                    href={`/admin/events/${event._id}`}
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cusblue px-4 py-3 text-sm font-bold text-cuscream transition-all hover:brightness-110">
                                    <Eye className="h-4 w-4" />
                                    View Details
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => onSuspend(event)}
                                    disabled={event.status === "Cancelled"}
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600 transition-all hover:bg-rose-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-rose-50 disabled:hover:text-rose-600">
                                    <PauseCircle className="h-4 w-4" />
                                    Suspend
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </AdminShell>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-cusblue/5 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-cusviolet/45">
                {label}
            </p>
            <p className="mt-1 font-bold text-cusblue">{value}</p>
        </div>
    );
}

function StatPill({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-2xl border border-cusblue/10 bg-white/50 px-5 py-4">
            <p className="text-xs font-black uppercase tracking-widest text-cusviolet/55">
                {label}
            </p>
            <p className="mt-1 text-2xl font-extrabold text-cusblue">{value}</p>
        </div>
    );
}
