"use client";

import type { Event } from "@/types/Event";
import EventDetailsLayout from "@/components/events/EventDetailsLayout";
import GalleryAccessHandler from "./GalleryAccessHandler";

interface EventDetailsPublicPageProps {
    event: Event;
    checking: boolean;
    gateResult: { msg: string; success: boolean } | null;
    onCheckUpload: () => Promise<void>;
}

export default function EventDetailsPublicPage({
    event,
    checking,
    gateResult,
    onCheckUpload,
}: EventDetailsPublicPageProps) {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 profile-card-animate">
            <EventDetailsLayout event={event}>
                <GalleryAccessHandler
                    event={event}
                    checking={checking}
                    gateResult={gateResult}
                    onCheckUpload={onCheckUpload}
                />
            </EventDetailsLayout>
        </div>
    );
}
