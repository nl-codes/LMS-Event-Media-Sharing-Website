"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CalendarDays } from "lucide-react";
import {
    AdminShell,
    EmptyState,
    LoadingBlock,
    PageHeader,
    SearchField,
} from "@/components/admin/AdminShared";
import { listEvents, suspendEvent } from "@/lib/adminApi";
import type { AdminEvent } from "@/types/Admin";
import { openConfirmationDialog } from "@/components/confirm/openConfirmationDialog";
import { AdminEventCard } from "./AdminEventCard";

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
                        <AdminEventCard
                            key={event._id}
                            event={event}
                            onSuspend={onSuspend}
                        />
                    ))}
                </div>
            )}
        </AdminShell>
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
