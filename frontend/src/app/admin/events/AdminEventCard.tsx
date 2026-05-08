"use client";

import Link from "next/link";
import { Eye, PauseCircle } from "lucide-react";
import { StatusBadge, formatDateTime } from "@/components/admin/AdminShared";
import type { AdminEvent, AdminEventHost } from "@/types/Admin";

interface AdminEventCardProps {
    event: AdminEvent;
    onSuspend: (event: AdminEvent) => void;
}

function getHostLabel(host?: string | AdminEventHost) {
    if (!host) return "Unknown host";
    if (typeof host === "string") return host;
    return host.userName || host.email || "Unknown host";
}

export function AdminEventCard({ event, onSuspend }: AdminEventCardProps) {
    return (
        <article className="rounded-3xl border border-cusblue/10 bg-white/60 p-5 shadow-xl shadow-cusblue/5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-extrabold text-cusblue">
                            {event.eventName}
                        </h2>
                        <StatusBadge status={event.status} />
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-cusviolet/70">
                        {event.description || "No description provided."}
                    </p>
                </div>
                <span className="rounded-full bg-cusviolet/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-cusviolet">
                    {event.tier || "free"}
                </span>
            </div>

            <div className="mt-5 grid gap-3 text-sm text-cusviolet/75 sm:grid-cols-2">
                <Info label="Host" value={getHostLabel(event.hostId)} />
                <Info
                    label="Participants"
                    value={String(event.participantCount || 0)}
                />
                <Info label="Starts" value={formatDateTime(event.startTime)} />
                <Info label="Ends" value={formatDateTime(event.endTime)} />
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
