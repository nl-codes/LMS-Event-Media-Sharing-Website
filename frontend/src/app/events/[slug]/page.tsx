"use client";

import { useEffect, useState } from "react";
import { getEventBySlug, requestUploadSignature } from "@/lib/eventApi";
import type { Event } from "@/types/Event";
import { useParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import EventDetailsPublicPage from "./EventDetailsPublicPage";

export default function PublicEventPage() {
    const [event, setEvent] = useState<Event | null>(null);
    const [error, setError] = useState("");
    const [gateResult, setGateResult] = useState<{
        msg: string;
        success: boolean;
    } | null>(null);
    const [checking, setChecking] = useState(false);

    const params = useParams();
    const slug = typeof params?.slug === "string" ? params.slug : "";

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
        setChecking(true);
        try {
            await requestUploadSignature(slug);
            setGateResult({
                msg: "You are authorized to upload media!",
                success: true,
            });
        } catch (e) {
            setGateResult({ msg: (e as Error).message, success: false });
        } finally {
            setChecking(false);
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
        <EventDetailsPublicPage
            event={event}
            checking={checking}
            gateResult={gateResult}
            onCheckUpload={handleCheckUpload}
        />
    );
}
