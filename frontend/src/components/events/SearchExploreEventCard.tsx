"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { CalendarDays, MapPin, ImageOff } from "lucide-react";
import type { Event } from "@/types/Event";
import clsx from "clsx";

interface SearchExploreEventCardProps {
    event: Event;
}

const formatRange = (startIso: string, endIso: string) => {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const sameDay =
        start.getUTCFullYear() === end.getUTCFullYear() &&
        start.getUTCMonth() === end.getUTCMonth() &&
        start.getUTCDate() === end.getUTCDate();

    const dateOpts: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        year: "numeric",
    };

    if (sameDay) {
        return start.toLocaleDateString(undefined, dateOpts);
    }
    return `${start.toLocaleDateString(undefined, dateOpts)} → ${end.toLocaleDateString(undefined, dateOpts)}`;
};

export default function SearchExploreEventCard({
    event,
}: SearchExploreEventCardProps) {
    const router = useRouter();
    const onOpen = () => router.push(`/events/${event.uniqueSlug}`);

    return (
        <button
            type="button"
            onClick={onOpen}
            className="group flex w-full items-stretch gap-4 rounded-2xl border border-cusblue/10 bg-white/70 p-3 text-left shadow-sm backdrop-blur-md transition-all hover:bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-cusblue/20">
            <div
                className={clsx(
                    "relative h-24 w-32 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-40",
                    {
                        "border-2 border-cusblue bg-cuscream": !event.thumbnail,
                        "bg-slate-100": event.thumbnail,
                    },
                )}>
                {event.thumbnail ? (
                    <Image
                        src={event.thumbnail}
                        alt={event.eventName}
                        fill
                        sizes="160px"
                        className="object-cover transition-transform group-hover:scale-[1.02]"
                        unoptimized
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-cusviolet/40">
                        <ImageOff className="h-6 w-6" />
                    </div>
                )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                <h3 className="truncate text-base font-extrabold text-cusblue sm:text-lg">
                    {event.eventName}
                </h3>
                <p className="flex items-center gap-1.5 text-xs font-bold text-cusviolet/70">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                        {formatRange(event.startTime, event.endTime)}
                    </span>
                </p>
                <p className="flex items-center gap-1.5 text-xs text-cusviolet/70">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{event.location}</span>
                </p>
            </div>
        </button>
    );
}
