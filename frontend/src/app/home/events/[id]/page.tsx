"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { getEventById } from "@/lib/eventApi";
import { confirmStripeCheckoutSession } from "@/lib/stripe";
import type { Event } from "@/types/Event";
import { useParams, useSearchParams } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import QRModal from "@/components/events/QRModal";
import BackButton from "@/components/navigation/BackButton";
import toast from "react-hot-toast";
import {
    Calendar,
    MapPin,
    Clock,
    Edit3,
    Globe,
    Loader2,
    CheckCircle2,
    XCircle,
    QrCode,
    Images,
    Zap,
} from "lucide-react";

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
        if (!paymentStatus || paymentStatus === lastHandledPaymentRef.current) {
            return;
        }

        const run = async () => {
            if (paymentStatus === "success") {
                if (!sessionId) {
                    toast.error("Missing payment session id.");
                    lastHandledPaymentRef.current = paymentStatus;
                    return;
                }

                try {
                    await confirmStripeCheckoutSession(sessionId);
                    const data = await getEventById(eventId);
                    setEvent(data);
                    toast.success(
                        "Payment successful. Your event is upgraded.",
                    );
                } catch (error) {
                    toast.error(
                        error instanceof Error
                            ? error.message
                            : "Failed to confirm payment",
                    );
                }
            }

            if (paymentStatus === "cancel") {
                toast.error("Payment canceled. No changes were made.");
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
        <>
            {showQR && (
                <QRModal
                    slug={event.uniqueSlug}
                    eventName={event.eventName}
                    onClose={() => setShowQR(false)}
                />
            )}

            <main className="max-w-5xl mx-auto px-6 py-10 profile-card-animate">
                {/* Navigation Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <BackButton label="Back to My Events" />

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Upgrade Event Button - Added Here */}
                        {!event.isPremium && (
                            <Link
                                href={`/home/events/${eventId}/upgrade`}
                                className="flex items-center gap-2 bg-linear-to-r from-cusblue to-cusviolet text-white px-5 py-2 rounded-xl hover:shadow-lg hover:shadow-cusblue/20 hover:scale-[1.02] transition-all font-bold shadow-md">
                                <Zap className="w-4 h-4 fill-current" />
                                Upgrade Event
                            </Link>
                        )}

                        {/* QR Code Toggle */}
                        <button
                            onClick={() => setShowQR(true)}
                            className="flex items-center gap-2 bg-cuscream border border-cusblue/20 text-cusblue px-5 py-2 rounded-xl hover:bg-cusblue hover:text-white transition-all shadow-sm font-medium">
                            <QrCode className="w-4 h-4" /> QR Code
                        </button>

                        {/* Event Gallery Button */}
                        <Link
                            href={`/home/events/${event._id}/gallery`}
                            className="flex items-center gap-2 bg-white border border-cusblue/20 text-cusblue px-5 py-2 rounded-xl hover:bg-custeal hover:border-custeal hover:text-white transition-all shadow-sm font-medium">
                            <Images className="w-4 h-4" /> View Gallery
                        </Link>

                        {/* Edit Button */}
                        <Link
                            href={`/home/events/${event._id}/edit`}
                            className="flex items-center gap-2 bg-white border border-cusblue/20 text-cusblue px-5 py-2 rounded-xl hover:bg-cusblue hover:text-white transition-all shadow-sm font-medium">
                            <Edit3 className="w-4 h-4" /> Edit Event
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Card */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-white">
                            <div className="mb-6 rounded-3xl border border-transparent bg-linear-to-r from-cusblue to-cusviolet p-px shadow-sm">
                                <div className="relative h-64 w-full rounded-[calc(1.5rem-1px)] overflow-hidden bg-cuscream">
                                    {event.thumbnail ? (
                                        <Image
                                            src={event.thumbnail}
                                            alt={`${event.eventName} thumbnail`}
                                            fill
                                            priority={true}
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw"
                                        />
                                    ) : (
                                        <div className="h-full w-full bg-linear-to-r from-cusblue/10 to-cusviolet/10 flex items-center justify-center text-xs font-semibold uppercase tracking-wider text-cusblue/70">
                                            Event Thumbnail
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mb-4">
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                                        event.isLive
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 text-gray-600"
                                    }`}>
                                    {event.isLive ? (
                                        <>
                                            <CheckCircle2 className="w-3 h-3" />{" "}
                                            Live Now
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-3 h-3" />{" "}
                                            Draft / Private
                                        </>
                                    )}
                                </span>
                                {event.isPremium && (
                                    <span className="bg-custeal/20 text-custeal px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                        <CheckCircle2 className="w-3 h-3 inline mr-1" />
                                        Premium
                                    </span>
                                )}
                            </div>

                            <h1 className="text-4xl font-bold text-cusblue mb-4 leading-tight">
                                {event.eventName}
                            </h1>

                            <p className="text-cusviolet/80 text-lg leading-relaxed whitespace-pre-wrap mb-8">
                                {event.description ||
                                    "No description provided for this event."}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-cusblue/5">
                                {/* Location */}
                                <div className="flex gap-4">
                                    <div className="bg-cuscream p-3 rounded-2xl h-fit">
                                        <MapPin className="w-6 h-6 text-cusblue" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-cusviolet uppercase tracking-tight">
                                            Location
                                        </p>
                                        <p className="text-cusblue font-medium wrap-break-word whitespace-normal">
                                            {event.location}
                                        </p>
                                    </div>
                                </div>
                                {/* Public URL */}
                                <div className="flex gap-4">
                                    <div className="bg-cuscream p-3 rounded-2xl h-fit">
                                        <Globe className="w-6 h-6 text-cusblue" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-cusviolet uppercase tracking-tight">
                                            Public URL
                                        </p>
                                        <p className="text-cusblue font-mono text-sm break-all">
                                            {event.uniqueSlug}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-cusblue text-cuscream p-8 rounded-3xl shadow-xl">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Calendar className="w-5 h-5" /> Schedule
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-cuscream/60 text-xs uppercase font-bold mb-1">
                                        Starts
                                    </p>
                                    <p className="text-lg font-semibold leading-tight">
                                        {new Date(
                                            event.startTime,
                                        ).toLocaleDateString(undefined, {
                                            weekday: "long",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </p>
                                    <p className="text-cuscream/80 italic flex items-center gap-1">
                                        <Clock className="w-3 h-3" />{" "}
                                        {new Date(
                                            event.startTime,
                                        ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                                <div className="border-l-2 border-cuscream/20 pl-4 py-1 ml-2">
                                    <p className="text-cuscream/60 text-xs uppercase font-bold mb-1">
                                        Ends
                                    </p>
                                    <p className="text-lg font-semibold leading-tight">
                                        {new Date(
                                            event.endTime,
                                        ).toLocaleDateString(undefined, {
                                            weekday: "short",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </p>
                                    <p className="text-cuscream/80 italic flex items-center gap-1">
                                        <Clock className="w-3 h-3" />{" "}
                                        {new Date(
                                            event.endTime,
                                        ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-8 pt-6 border-t border-cuscream/10 text-center">
                                <Link
                                    href={`/events/${event.uniqueSlug}`}
                                    className="block w-full py-3 bg-cuscream text-cusblue rounded-xl font-bold hover:scale-[1.02] transition-transform">
                                    View Public Page
                                </Link>
                            </div>
                        </div>

                        {/* Quick Info & QR Preview Card */}
                        <div className="bg-white/50 border border-cusblue/10 p-6 rounded-3xl flex flex-col items-center gap-4">
                            <h4 className="flex items-center gap-2 text-cusblue font-bold self-start">
                                <QrCode className="w-4 h-4" /> Event QR Code
                            </h4>
                            <div className="p-3 bg-white rounded-xl border border-cusblue/10 shadow-sm pointer-events-none select-none">
                                <QRCodeCanvas
                                    value={`http://localhost:8080/events/${event.uniqueSlug}`}
                                    size={96}
                                    bgColor="#ffffff"
                                    fgColor="#0f2d57"
                                    level="H"
                                    marginSize={1}
                                />
                            </div>
                            <button
                                onClick={() => setShowQR(true)}
                                className="w-full flex items-center justify-center gap-2 border border-cusblue/30 text-cusblue py-2.5 rounded-xl font-semibold hover:bg-cusblue hover:text-white transition-all text-sm">
                                View &amp; Download QR
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
