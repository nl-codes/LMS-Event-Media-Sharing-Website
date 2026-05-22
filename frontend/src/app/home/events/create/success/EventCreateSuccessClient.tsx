"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Loader2, XCircle } from "lucide-react";
import { confirmEventCreationCheckout } from "@/lib/stripe";

// Stripe redirects here after a successful Premium/Pro event-create checkout.
// We exchange the session_id for the freshly-created Event and forward the
// host into its detail page. confirmEventCreationCheckout is idempotent on
// the backend, so a refresh of this page is safe.
export default function PaidEventCreateSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const handledRef = useRef(false);

    const [confirmError, setConfirmError] = useState<string | null>(null);
    const missingSessionId = !sessionId;
    const error = missingSessionId
        ? "Missing Stripe session id."
        : confirmError;

    useEffect(() => {
        if (handledRef.current) return;
        if (!sessionId) return;
        handledRef.current = true;

        const run = async () => {
            try {
                const event = await confirmEventCreationCheckout(sessionId);
                toast.success("Payment confirmed. Your event is live!");
                router.replace(`/home/events/${event._id}`);
            } catch (err) {
                setConfirmError(
                    err instanceof Error
                        ? err.message
                        : "Failed to confirm payment",
                );
            }
        };

        void run();
    }, [router, sessionId]);

    if (error) {
        return (
            <main className="min-h-screen flex items-center justify-center px-6">
                <div className="max-w-md w-full bg-white border border-red-100 rounded-3xl p-8 text-center shadow-xl">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-cusblue mb-2">
                        Couldn&apos;t confirm your event
                    </h2>
                    <p className="text-sm text-cusviolet/80 mb-6">{error}</p>
                    <div className="flex flex-col gap-2">
                        <Link
                            href="/home/events/create"
                            className="text-sm font-semibold text-cusblue underline">
                            Back to create event
                        </Link>
                        <Link
                            href="/home/events"
                            className="text-xs text-cusviolet/70 hover:underline">
                            Go to my events
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen flex items-center justify-center text-cusblue">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 animate-spin opacity-60" />
                <p className="text-sm font-semibold text-cusviolet/80">
                    Confirming your payment and creating the event...
                </p>
            </div>
        </main>
    );
}
