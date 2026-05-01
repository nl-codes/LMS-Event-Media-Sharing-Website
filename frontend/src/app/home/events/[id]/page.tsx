"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { getEventById } from "@/lib/eventApi";
import { confirmStripeCheckoutSession } from "@/lib/stripe";
import type { Event } from "@/types/Event";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import QRModal from "@/components/events/QRModal";
import BackButton from "@/components/navigation/BackButton";
import toast from "react-hot-toast";
import {
    MapPin,
    Clock,
    Edit3,
    Globe,
    Loader2,
    XCircle,
    QrCode,
    Images,
    Zap,
    ExternalLink,
    Sparkles,
} from "lucide-react";
import Button from "@/components/buttons/Button";

export default function EventDetailsPage() {
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showQR, setShowQR] = useState(false);
    const lastHandledPaymentRef = useRef<string | null>(null);

    const router = useRouter();
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

    const formatDate = (date: string | Date) =>
        new Date(date).toLocaleDateString(undefined, {
            weekday: "short",
            month: "long",
            day: "numeric",
            year: "numeric",
        });

    const formatTime = (date: string | Date) =>
        new Date(date).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });

    return (
        <>
            {showQR && (
                <QRModal
                    slug={event.uniqueSlug}
                    eventName={event.eventName}
                    onClose={() => setShowQR(false)}
                />
            )}

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 profile-card-animate">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <BackButton label="Back to My Events" />
                    <div className="flex flex-wrap items-center gap-3">
                        {!event.isPremium && (
                            <Button
                                onClick={() =>
                                    router.push(
                                        `/home/events/${eventId}/upgrade`,
                                    )
                                }
                                className="flex items-center gap-2 bg-linear-to-r from-cusblue to-cusviolet text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all font-bold text-sm">
                                <Zap className="w-4 h-4 fill-current" /> Upgrade
                            </Button>
                        )}
                        <Button
                            onClick={() => setShowQR(true)}
                            className="flex items-center gap-2 bg-white border border-slate-200 text-cusblue px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-all font-bold text-sm shadow-sm">
                            <QrCode className="w-4 h-4" /> QR Code
                        </Button>
                        <Button
                            onClick={() =>
                                router.push(`/home/events/${event._id}/gallery`)
                            }
                            className="flex items-center gap-2 bg-white border border-slate-200 text-cusblue px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-all font-bold text-sm shadow-sm">
                            <Images className="w-4 h-4" /> Gallery
                        </Button>
                        <Button
                            onClick={() =>
                                router.push(`/home/events/${event._id}/edit`)
                            }
                            className="flex items-center gap-2 bg-cusblue text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition-all font-bold text-sm shadow-md">
                            <Edit3 className="w-4 h-4" /> Edit
                        </Button>
                    </div>
                </div>

                {/* Main Content: Thumbnail Left, Rest Right */}
                <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-2xl overflow-hidden flex flex-col lg:flex-row">
                    {/* LEFT: Thumbnail Section (16:9) */}
                    <div className="w-full lg:w-[45%] p-6 lg:p-8">
                        <div className="relative aspect-video lg:h-full w-full rounded-4xl overflow-hidden bg-slate-100 shadow-inner group">
                            {event.thumbnail ? (
                                <Image
                                    src={event.thumbnail}
                                    alt={event.eventName}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    priority
                                />
                            ) : (
                                <div className="h-full w-full flex flex-col items-center justify-center text-cusblue/20 bg-slate-50">
                                    <Sparkles className="w-12 h-12 mb-2" />
                                    <span className="text-xs font-black uppercase tracking-widest">
                                        No Cover Image
                                    </span>
                                </div>
                            )}
                            {/* Premium Badge Overlay */}
                            {event.isPremium && (
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
                                    <Zap className="w-3 h-3 text-cusblue fill-current" />
                                    <span className="text-[10px] font-black uppercase tracking-tighter text-cusblue">
                                        Premium
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Event Details Section */}
                    <div className="flex-1 p-8 lg:p-10 lg:pl-4 space-y-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <span
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${event.isLive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                                    <div
                                        className={`w-1.5 h-1.5 rounded-full ${event.isLive ? "bg-green-500 animate-pulse" : "bg-slate-400"}`}
                                    />
                                    {event.isLive ? "Live" : "Draft"}
                                </span>
                            </div>
                            <h1 className="text-4xl font-black text-cusblue tracking-tight leading-none mb-4">
                                {event.eventName}
                            </h1>
                            <p className="text-slate-500 text-sm leading-relaxed max-w-xl line-clamp-4">
                                {event.description ||
                                    "No description provided for this event."}
                            </p>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Location Card */}
                            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex items-start gap-3 min-w-0">
                                <div className="p-2 bg-white rounded-xl shadow-sm text-cusblue shrink-0">
                                    <MapPin size={18} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Where
                                    </p>
                                    <p className="text-sm font-bold text-cusblue wrap-break-word">
                                        {event.location}
                                    </p>
                                </div>
                            </div>

                            {/* URL Card */}
                            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex items-start gap-3 min-w-0">
                                <div className="p-2 bg-white rounded-xl shadow-sm text-cusblue shrink-0">
                                    <Globe size={18} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Public Link
                                    </p>
                                    <p className="text-sm font-bold text-cusblue truncate">
                                        {event.uniqueSlug}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Timing Section */}
                        <div className="bg-cusblue rounded-4xl p-6 lg:p-8 text-white relative overflow-hidden">
                            <Sparkles className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 rotate-12" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                                        Starts
                                    </p>
                                    <p className="text-lg font-bold">
                                        {formatDate(event.startTime)}
                                    </p>
                                    <p className="text-sm text-white/70 flex items-center gap-1.5 font-medium">
                                        <Clock size={14} />{" "}
                                        {formatTime(event.startTime)}
                                    </p>
                                </div>
                                <div className="space-y-1 md:border-l md:border-white/10 md:pl-8">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                                        Ends
                                    </p>
                                    <p className="text-lg font-bold">
                                        {formatDate(event.endTime)}
                                    </p>
                                    <p className="text-sm text-white/70 flex items-center gap-1.5 font-medium">
                                        <Clock size={14} />{" "}
                                        {formatTime(event.endTime)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <Link
                                href={`/events/${event.uniqueSlug}`}
                                target="_blank"
                                className="inline-flex items-center gap-2 text-cusblue font-black uppercase tracking-widest text-[11px] hover:gap-3 transition-all">
                                Open Public Preview <ExternalLink size={14} />
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
