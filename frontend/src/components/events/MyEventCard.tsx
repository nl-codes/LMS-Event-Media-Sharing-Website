"use client";

import Link from "next/link";
import { useState } from "react";
import type { Event } from "@/types/Event";
import QRModal from "@/components/events/QRModal";
import EventCardBase from "@/components/events/EventCardBase";
import { Trash2, Edit3, Eye, QrCode } from "lucide-react";

type MyEventCardProps = {
    event: Event;
    onDelete?: (id: string) => void;
};

export default function MyEventCard({ event, onDelete }: MyEventCardProps) {
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

            <EventCardBase event={event}>
                <Link
                    href={`/home/events/${event._id}`}
                    className="flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg bg-cusblue text-cuscream hover:opacity-90 transition-opacity">
                    <Eye className="w-3 h-3" /> View
                </Link>

                <Link
                    href={`/home/events/${event._id}/edit`}
                    className="flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg border border-cusblue text-cusblue hover:bg-cusblue/5 transition-colors">
                    <Edit3 className="w-3 h-3" /> Edit
                </Link>

                <button
                    type="button"
                    onClick={() => setShowQR(true)}
                    className="col-span-2 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg border border-cusblue/30 text-cusblue hover:bg-cusblue hover:text-cuscream transition-all">
                    <QrCode className="w-3 h-3" /> View QR Code
                </button>

                <Link
                    href={`/events/${event.uniqueSlug}`}
                    className="col-span-1 flex items-center justify-center py-2 text-xs font-semibold text-cusviolet hover:underline">
                    Public Page
                </Link>

                {onDelete && (
                    <button
                        type="button"
                        onClick={() => onDelete(event._id)}
                        className="col-span-1 flex items-center justify-center gap-1 py-2 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors cursor-pointer">
                        <Trash2 className="w-3 h-3" /> Delete
                    </button>
                )}
            </EventCardBase>
        </>
    );
}
