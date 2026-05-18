"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getEventById } from "@/lib/eventApi";
import { confirmStripeCheckoutSession } from "@/lib/stripe";
import type { Event } from "@/types/Event";
import { useParams, useSearchParams } from "next/navigation";
import QRModal from "@/components/events/QRModal";
import toast from "react-hot-toast";
import { Loader2, XCircle, ExternalLink } from "lucide-react";
import Button from "@/components/buttons/Button";
import EventDetailsLayout from "@/components/events/EventDetailsLayout";
import EventHostActionButtons from "./EventHostActionButtons";

export default function EventDetailsPage() {
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showQR, setShowQR] = useState(false);
    const lastHandledPaymentRef = useRef<string | null>(null);

    const params = useParams();
    const searchParams = useSearchParams();
    const eventId = typeof params?.id === "string" ? params.id : "";
    const paymentStatus = searchParams.get("payment");
    const sessionId = searchParams.get("session_id");

    useEffect(() => {
        if (!paymentStatus || paymentStatus === lastHandledPaymentRef.current)
            return;

        const run = async () => {
            if (paymentStatus === "success" && sessionId) {
                try {
                    await confirmStripeCheckoutSession(sessionId);
                    const data = await getEventById(eventId);
                    setEvent(data);
                    toast.success(
                        "Payment successful. Your event is upgraded.",
                    );
                } catch (error) {
                    console.log(error);
                    toast.error("Failed to confirm payment");
                }
            } else if (paymentStatus === "cancel") {
                toast.error("Payment canceled.");
            }
            lastHandledPaymentRef.current = paymentStatus;
        };
        void run();
    }, [eventId, paymentStatus, sessionId]);

    useEffect(() => {
        const run = async () => {
            try {
                const data = await getEventById(eventId);
                setEvent(data);
            } catch (e) {
                setError((e as Error).message);
            } finally {
                setLoading(false);
            }
        };
        void run();
    }, [eventId]);

    if (loading) {
        return (
            <main className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-10 h-10 animate-spin text-cusblue opacity-50" />
            </main>
        );
    }

    if (error || !event) {
        return (
            <main className="max-w-4xl mx-auto px-6 py-20 text-center text-cusblue">
                <div className="bg-red-50 border border-red-100 p-8 rounded-2xl">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Oops!</h2>
                    <p className="text-cusviolet mb-6">
                        {error || "Event not found."}
                    </p>
                    <Link
                        href="/home/events"
                        className="font-semibold underline">
                        Return to Events
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 profile-card-animate">
            <main>
                {showQR && (
                    <QRModal
                        slug={event.uniqueSlug}
                        eventName={event.eventName}
                        onClose={() => setShowQR(false)}
                    />
                )}

                <EventHostActionButtons event={event} setShowQR={setShowQR} />

                <EventDetailsLayout event={event}>
                    <Link
                        href={`/events/${event.uniqueSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="contents" // Prevents the link from breaking the button layout
                    >
                        <Button>
                            <ExternalLink size={14} /> Open Public Preview
                        </Button>
                    </Link>
                </EventDetailsLayout>
            </main>
        </div>
    );
}
