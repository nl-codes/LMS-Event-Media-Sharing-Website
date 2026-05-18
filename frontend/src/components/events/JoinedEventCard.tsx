"use client";

import Link from "next/link";
import type { Event } from "@/types/Event";
import { Eye, LogIn } from "lucide-react";
import UserAvatar from "@/components/common/UserAvatar";
import EventCardBase from "@/components/events/EventCardBase";

type JoinedEventCardProps = {
    event: Event;
};

export default function JoinedEventCard({ event }: JoinedEventCardProps) {
    const host =
        typeof event.hostId === "object" && event.hostId !== null
            ? event.hostId
            : null;

    const hostSlot = host ? (
        <Link
            href={`/home/profile/${host._id}/others`}
            className="mb-4 flex items-center gap-2 rounded-xl bg-cusblue/5 px-3 py-2 transition-colors hover:bg-cusblue/10">
            <UserAvatar
                src={host.profilePicture}
                name={host.userName}
                size="small"
            />
            <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-cusblue/60">
                    Host
                </p>
                <p className="truncate text-xs font-bold text-cusblue">
                    {host.userName || "Anonymous"}
                </p>
            </div>
        </Link>
    ) : null;

    return (
        <EventCardBase event={event} host={hostSlot}>
            <Link
                href={`/events/${event.uniqueSlug}`}
                className="flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg bg-cusblue text-cuscream hover:opacity-90 transition-opacity">
                <Eye className="w-3 h-3" /> View
            </Link>

            <Link
                href={`/events/${event.uniqueSlug}/gallery`}
                className="flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg border border-cusblue text-cusblue hover:bg-cusblue/5 transition-colors">
                <LogIn className="w-3 h-3" /> Gallery
            </Link>
        </EventCardBase>
    );
}
