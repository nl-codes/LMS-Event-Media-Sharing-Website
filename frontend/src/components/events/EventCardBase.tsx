"use client";

import Image from "next/image";
import { Calendar, Globe, ImageOff, MapPin } from "lucide-react";
import type { Event } from "@/types/Event";
import type { ReactNode } from "react";
import clsx from "clsx";

type EventCardBaseProps = {
    event: Event;
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
                        <div className="h-full w-full flex items-center justify-center text-cusblue">
                            <ImageOff className="h-6 w-6" />
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
                    <span
                        className={clsx(
                            "shrink-0 text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md border ml-2 transition-all",
                            {
                                // Free: Subtle, muted, professional
                                "bg-slate-500/10 text-slate-500 border-slate-500":
                                    event.tier === "free",

                                // Premium: Deep, rich indigo/blue
                                "bg-indigo-600/15 text-indigo-500 border-indigo-600":
                                    event.tier === "premium",

                                // Pro: Warm gold with a soft glow
                                "bg-amber-500/15 text-amber-600 border-amber-500":
                                    event.tier === "pro",
                            },
                        )}>
                        {event.tier}
                    </span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">{children}</div>
        </div>
    );
}
