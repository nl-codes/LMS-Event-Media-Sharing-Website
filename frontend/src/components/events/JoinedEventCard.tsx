"use client";

import Link from "next/link";
import type { Event } from "@/types/Event";
import { Calendar, MapPin, Globe, Eye, LogIn } from "lucide-react";

type JoinedEventCardProps = {
    event: Event;
};

export default function JoinedEventCard({ event }: JoinedEventCardProps) {
    return (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-cusblue/5 flex flex-col transition-all hover:scale-[1.02] profile-card-animate">
            {/* Event Name */}
            <h3 className="text-lg font-bold text-cusblue leading-tight mb-4">
                {event.eventName}
            </h3>

            {/* Minimal Details */}
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
                <div className="flex items-center text-cusblue/60 text-xs font-mono pt-2 border-t border-cusblue/5">
                    <Globe className="w-3 h-3 mr-2 shrink-0" />
                    <span className="truncate">{event.uniqueSlug}</span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
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
            </div>
        </div>
    );
}
