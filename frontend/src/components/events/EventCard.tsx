"use client";

import Link from "next/link";
import { useState } from "react";
import type { Event } from "@/types/Event";
import QRModal from "@/components/events/QRModal";
import {
    Calendar,
    MapPin,
    Globe,
    Trash2,
    Edit3,
    Eye,
    QrCode,
} from "lucide-react";

type EventCardProps = {
    event: Event;
    onDelete?: (id: string) => void;
    isHost?: boolean;
};

export default function EventCard({
    event,
    onDelete,
    isHost = true,
}: EventCardProps) {
    const [showQR, setShowQR] = useState(false);

    return (
        <>
            {showQR && (
                <QRModal
                    slug={event.uniqueSlug}
                    eventName={event.eventName}
                    onClose={() => setShowQR(false)}
                />
            )}

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-cusblue/5 flex flex-col transition-all hover:scale-[1.02] profile-card-animate">
                {/* Header: Title & Premium Badge */}
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-cusblue leading-tight">
                        {event.eventName}
                    </h3>
                    {event.isPremium && (
                        <span className="bg-custeal/20 text-custeal text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md border border-custeal/30">
                            Premium
                        </span>
                    )}
                </div>

                {/* Event Details */}
                <div className="space-y-2 mb-6 grow">
                    <div className="flex items-center text-cusviolet/80 text-sm">
                        <MapPin className="w-4 h-4 mr-2 shrink-0" />
                        <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center text-cusviolet/80 text-sm">
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
                    <div className="flex items-center text-cusblue/60 text-xs font-mono mt-3 pt-2 border-t border-cusblue/5">
                        <Globe className="w-3 h-3 mr-2" />
                        <span>{event.uniqueSlug}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                    <Link
                        href={`/home/events/${event._id}`}
                        className="flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg bg-cusblue text-cuscream hover:opacity-90 transition-opacity">
                        <Eye className="w-3 h-3" /> View
                    </Link>

                    {isHost && (
                        <Link
                            href={`/home/events/${event._id}/edit`}
                            className="flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg border border-cusblue text-cusblue hover:bg-cusblue/5 transition-colors">
                            <Edit3 className="w-3 h-3" /> Edit
                        </Link>
                    )}

                    {isHost && (
                        <button
                            type="button"
                            onClick={() => setShowQR(true)}
                            className="col-span-2 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg border border-cusblue/30 text-cusblue hover:bg-cusblue hover:text-cuscream transition-all">
                            <QrCode className="w-3 h-3" /> View QR Code
                        </button>
                    )}

                    <Link
                        href={`/events/${event.uniqueSlug}`}
                        className="col-span-1 flex items-center justify-center py-2 text-xs font-semibold text-cusviolet hover:underline">
                        Public Page
                    </Link>

                    {isHost && onDelete && (
                        <button
                            type="button"
                            onClick={() => onDelete(event._id)}
                            className="col-span-1 flex items-center justify-center gap-1 py-2 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors cursor-pointer">
                            <Trash2 className="w-3 h-3" /> Delete
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
