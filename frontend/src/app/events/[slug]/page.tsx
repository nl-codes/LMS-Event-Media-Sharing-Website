"use client";

import { useEffect, useState } from "react";
import { getEventBySlug, joinAsGuest, verifyEventAccess } from "@/lib/eventApi";
import { joinEvent } from "@/lib/membershipApi";
import type { Event } from "@/types/Event";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import EventDetailsPublicPage from "./EventDetailsPublicPage";
import { useIdentity } from "@/context/IdentityContext";

type ScopedGuestCookie = {
    guestId: string;
    userName: string;
    eventId: string;
};

function getScopedGuestCookie(eventSlug: string): ScopedGuestCookie | null {
    if (typeof document === "undefined" || !eventSlug) return null;

    const cookieKey = `guest_${eventSlug}`;
    const cookieValue = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${cookieKey}=`))
        ?.split("=")[1];

    if (!cookieValue) return null;

    try {
        const parsed = JSON.parse(decodeURIComponent(cookieValue));
        if (
            parsed &&
            typeof parsed.guestId === "string" &&
            typeof parsed.userName === "string" &&
            typeof parsed.eventId === "string"
        ) {
            return parsed as ScopedGuestCookie;
        }
    } catch {
        return null;
    }

    return null;
}

function UsernameModal({
    open,
    value,
    loading,
    onClose,
    onChange,
    onSubmit,
}: {
    open: boolean;
    value: string;
    loading: boolean;
    onClose: () => void;
    onChange: (value: string) => void;
    onSubmit: () => void;
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-cusblue mb-2">
                    Continue as guest
                </h3>
                <p className="text-sm text-cusviolet/80 mb-4">
                    Enter a display name for your uploads.
                </p>

                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Your name"
                    className="w-full border border-cusblue/20 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-cusblue/40"
                    maxLength={32}
                />

                <div className="mt-4 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl border border-cusblue/20 text-cusblue hover:bg-cusblue/5 disabled:opacity-50">
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={loading || !value.trim()}
                        className="px-4 py-2 rounded-xl bg-cusblue text-cuscream hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            "Continue"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

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

            <UsernameModal
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
