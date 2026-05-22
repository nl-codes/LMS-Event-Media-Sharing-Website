"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ArrowLeft, CalendarClock, MapPin, Users, Upload } from "lucide-react";
import {
    AdminShell,
    LoadingBlock,
    PageHeader,
    StatusBadge,
    formatDateTime,
} from "@/components/admin/AdminShared";
import { getAdminEventDetails } from "@/lib/adminApi";
import type { AdminEventDetails, AdminEventHost } from "@/types/Admin";

function getHostLabel(host?: string | AdminEventHost) {
    if (!host) return "Not available";
    if (typeof host === "string") return host;
    return host.userName || host.email || "Not available";
}

export default function AdminEventDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const [details, setDetails] = useState<AdminEventDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const data = await getAdminEventDetails(id);
                setDetails(data || null);
            } catch (error) {
                toast.error((error as Error).message);
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [id]);

    const event = details?.event;

    return (
        <AdminShell>
            <PageHeader
                eyebrow="Event details"
                title={event?.eventName || "Event"}
                description="Administrative event information without gallery media."
                action={
                    <Link
                        href="/admin/events"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cusblue/10 bg-white/70 px-4 py-3 text-sm font-bold text-cusblue transition-all hover:bg-white">
                        <ArrowLeft className="h-4 w-4" />
                        Back to events
                    </Link>
                }
            />

            {loading ? (
                <LoadingBlock label="Loading event details..." />
            ) : !event ? (
                <div className="rounded-3xl border border-rose-100 bg-rose-50 p-6 text-rose-700">
                    Event details could not be loaded.
                </div>
            ) : (
                <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                    <section className="rounded-3xl border border-cusblue/10 bg-white/60 p-6 shadow-xl shadow-cusblue/5">
                        <div className="flex flex-wrap items-center gap-3">
                            {event.status && (
                                <StatusBadge status={event.status} />
                            )}
                            <span className="rounded-full bg-cusviolet/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-cusviolet">
                                {event.tier || "free"}
                            </span>
                            {event.isPremium && (
                                <span className="rounded-full bg-cusblue/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-cusblue">
                                    premium
                                </span>
                            )}
                        </div>

                        <h2 className="mt-6 text-2xl font-extrabold text-cusblue">
                            {event.eventName}
                        </h2>
                        <p className="mt-3 leading-relaxed text-cusviolet/75">
                            {event.description || "No description provided."}
                        </p>

                        <div className="mt-8 grid gap-4 md:grid-cols-2">
                            <DetailItem
                                icon={<CalendarClock className="h-5 w-5" />}
                                label="Start time"
                                value={formatDateTime(event.startTime)}
                            />
                            <DetailItem
                                icon={<CalendarClock className="h-5 w-5" />}
                                label="End time"
                                value={formatDateTime(event.endTime)}
                            />
                            <DetailItem
                                icon={<MapPin className="h-5 w-5" />}
                                label="Location"
                                value={event.location || "Not provided"}
                            />
                            <DetailItem
                                icon={<Users className="h-5 w-5" />}
                                label="Host"
                                value={getHostLabel(event.hostId)}
                            />
                        </div>
                    </section>

                    <aside className="space-y-4">
                        <MetricCard
                            icon={<Users className="h-6 w-6" />}
                            label="Participants"
                            value={details.stats?.participants || 0}
                        />
                        <MetricCard
                            icon={<Upload className="h-6 w-6" />}
                            label="Uploads"
                            value={details.stats?.uploads || 0}
                        />
                        <div className="rounded-3xl border border-cusblue/10 bg-white/60 p-6 shadow-xl shadow-cusblue/5">
                            <p className="text-xs font-black uppercase tracking-widest text-cusviolet/55">
                                Upload limit
                            </p>
                            <p className="mt-2 text-3xl font-extrabold text-cusblue">
                                {event.uploadLimit || "Not set"}
                            </p>
                        </div>
                    </aside>
                </div>
            )}
        </AdminShell>
    );
}

function DetailItem({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="flex gap-4 rounded-2xl bg-cusblue/5 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-cusblue">
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-cusviolet/45">
                    {label}
                </p>
                <p className="mt-1 font-bold text-cusblue">{value}</p>
            </div>
        </div>
    );
}

function MetricCard({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
}) {
    return (
        <div className="rounded-3xl border border-cusblue/10 bg-white/60 p-6 shadow-xl shadow-cusblue/5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cusblue/10 text-cusblue">
                {icon}
            </div>
            <p className="mt-5 text-xs font-black uppercase tracking-widest text-cusviolet/55">
                {label}
            </p>
            <p className="mt-2 text-4xl font-extrabold text-cusblue">{value}</p>
        </div>
    );
}
