"use client";
import type { Event } from "@/types/Event";
import { MapPin, Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function JoinedEventSmallCard({ event }: { event: Event }) {
    return (
        <Link href={`/home/events/${event._id}`}>
            <div className="group flex items-center gap-4 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md hover:border-cusblue/20 hover:-translate-y-1 active:scale-[0.98]">
                {/* Small Thumbnail */}
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {event.thumbnail ? (
                        <Image
                            src={event.thumbnail}
                            alt={`${event.eventName} thumbnail`}
                            fill
                            sizes="64px"
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    ) : (
                        <div className="h-full w-full bg-linear-to-r from-cusblue/15 to-cusviolet/15" />
                    )}
                </div>

                {/* Event Info */}
                <div className="flex flex-col min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-cusblue truncate group-hover:text-cusviolet transition-colors">
                        {event.eventName}
                    </h4>

                    <div className="flex flex-col gap-0.5 mt-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <Calendar className="w-3 h-3 text-cusblue/60" />
                            <span>
                                {new Date(event.startTime).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <MapPin className="w-3 h-3 text-cusblue/60" />
                            <span className="truncate">
                                {event.location || "Online"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
