"use client";

import { useEffect, useState } from "react";
import { getEventBySlug, joinAsGuest, verifyEventAccess } from "@/lib/eventApi";
import { joinEvent } from "@/lib/membershipApi";
import type { Event } from "@/types/Event";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import EventDetailsPublicPage from "./EventDetailsPublicPage";
import { useIdentity } from "@/context/IdentityContext";
import { getScopedGuestCookie } from "@/lib/guestIdentity";
import GuestJoinModal from "@/components/events/GuestJoinModal";

export default function PublicEventPage() {
    const [event, setEvent] = useState<Event | null>(null);
    const [error, setError] = useState("");
    const [gateResult, setGateResult] = useState<{
        msg: string;
        success: boolean;
    } | null>(null);
    const [checking, setChecking] = useState(false);
    const [joining, setJoining] = useState(false);
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [guestName, setGuestName] = useState("");

    const params = useParams();
    const router = useRouter();
    const slug = typeof params?.slug === "string" ? params.slug : "";

    const { setGuestIdentity } = useIdentity();

    useEffect(() => {
        const run = async () => {
            try {
                const data = await getEventBySlug(slug);
                setEvent(data);
            } catch (e) {
                setError((e as Error).message);
            }
        };
        void run();
    }, [slug]);

    const handleCheckUpload = async () => {
        if (!event?._id) return;

        setChecking(true);
        try {
            const result = await verifyEventAccess(event._id, slug);
            const scopedGuest = getScopedGuestCookie(slug);

            const hasScopedGuestIdentity =
                !!scopedGuest && scopedGuest.eventId === event._id;

            if (result.isRegistered || hasScopedGuestIdentity) {
                if (result.isRegistered) {
                    await joinEvent(event._id);
                }
                router.push(`/events/${slug}/gallery`);
                return;
            }

            setGateResult(null);
            setShowGuestModal(true);
        } catch (e) {
            setGateResult({ msg: (e as Error).message, success: false });
        } finally {
            setChecking(false);
        }
    };

    const handleJoinGuest = async () => {
        if (!event?._id || !guestName.trim()) return;

        setJoining(true);
        try {
            const guest = await joinAsGuest({
                eventId: event._id,
                userName: guestName.trim(),
            });

            setGuestIdentity({
                guestId: guest.guest_id,
                userName: guest.userName,
            });

            const expiresAt = new Date(event.endTime).toUTCString();
            const scopedCookie = encodeURIComponent(
                JSON.stringify({
                    guestId: guest.guest_id,
                    userName: guest.userName,
                    eventId: guest.eventId,
                }),
            );
            document.cookie = `guest_${slug}=${scopedCookie}; path=/; expires=${expiresAt}; SameSite=Lax`;

            setShowGuestModal(false);
            router.push(`/events/${slug}/gallery`);
        } catch (e) {
            setGateResult({ msg: (e as Error).message, success: false });
        } finally {
            setJoining(false);
        }
    };

    if (error) {
        return (
            <main className="min-h-screen flex items-center justify-center p-6 bg-cuscream">
                <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl text-center border border-red-100">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-cusblue mb-2">
                        Event Not Found
                    </h2>
                    <p className="text-cusviolet opacity-80 mb-6">{error}</p>
                </div>
            </main>
        );
    }

    if (!event) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center bg-cuscream text-cusblue">
                <Loader2 className="w-10 h-10 animate-spin mb-4 opacity-40" />
                <p className="font-medium animate-pulse">
                    Opening invitation...
                </p>
            </main>
        );
    }

    return (
        <>
            <EventDetailsPublicPage
                event={event}
                checking={checking}
                gateResult={gateResult}
                onCheckUpload={handleCheckUpload}
            />

            <GuestJoinModal
                open={showGuestModal}
                value={guestName}
                loading={joining}
                onClose={() => setShowGuestModal(false)}
                onChange={setGuestName}
                onSubmit={handleJoinGuest}
            />
        </>
    );
}
