"use client";

import Image from "next/image";
import { Calendar, Globe, MapPin } from "lucide-react";
import type { Event } from "@/types/Event";
import type { ReactNode } from "react";

type EventCardBaseProps = {
    event: Event;
    /** "xl" matches the MyEventCard heading; "lg" matches JoinedEventCard. */
    titleSize?: "lg" | "xl";
    /** Optional row below the title (e.g. host pill). */
    host?: ReactNode;
    /** Action buttons rendered at the bottom — typically a grid. */
    children?: ReactNode;
};

export default function EventCardBase({
    event,
    host,
    children,
}: EventCardBaseProps) {
    const hasThumbnail = Boolean(event.thumbnail);
    console.log(event.isPremium);

    return (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-cusblue/5 flex flex-col transition-all hover:scale-[1.02] profile-card-animate">
            <div className="mb-5 rounded-2xl overflow-hidden border border-transparent bg-linear-to-r from-cusblue to-cusviolet p-px">
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-cuscream">
                    {hasThumbnail ? (
                        <Image
                            src={event.thumbnail}
                            alt={`${event.eventName} thumbnail`}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover"
                        />
                    ) : (
                        <div className="h-full w-full bg-linear-to-r from-cusblue/10 to-cusviolet/10 flex items-center justify-center text-xs font-semibold uppercase tracking-wider text-cusblue/70">
                            No Thumbnail
                        </div>
                    )}
                </div>
            </div>

            {/* Title + optional badge */}

            <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-cusblue leading-tight line-clamp-2 min-h-12">
                    {event.eventName}
                </h3>
            </div>

            {host}

            {/* Event Details */}
            <div className="space-y-2 mb-6 grow text-sm">
                <div className="flex items-center text-cusviolet/80">
                    <MapPin className="w-4 h-4 mr-2 shrink-0" />
                    <span className="truncate">{event.location}</span>
                </div>
                <div className="flex items-center text-cusviolet/80">
                    <Calendar className="w-4 h-4 mr-2 shrink-0" />
                    <span>
                        {new Date(event.startTime).toLocaleDateString(
                            undefined,
                            {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            },
                        )}
                    </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-cusblue/5">
                    <div className="flex items-center text-cusblue/60 text-xs ">
                        <Globe className="w-3 h-3 mr-2 shrink-0" />
                        <span className="truncate">{event.uniqueSlug}</span>
                    </div>
                    {event.isPremium && (
                        <span className="shrink-0 bg-custeal/20 text-custeal text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md border border-custeal/30 ml-2">
                            {event.tier}
                        </span>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">{children}</div>
        </div>
    );
}
