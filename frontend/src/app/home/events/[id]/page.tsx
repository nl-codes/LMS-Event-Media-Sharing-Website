"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getEventById } from "@/lib/eventApi";
import type { Event } from "@/types/Event";
import { useParams } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import {
    Calendar,
    MapPin,
    Clock,
    ArrowLeft,
    Edit3,
    Globe,
    Info,
    Loader2,
    CheckCircle2,
    XCircle,
    QrCode,
    Download,
    X,
} from "lucide-react";

function QRModal({
    slug,
    eventName,
    onClose,
}: {
    slug: string;
    eventName: string;
    onClose: () => void;
}) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const qrUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/events/${slug}`;

    const handleDownload = () => {
        const canvas = canvasRef.current?.querySelector("canvas");
        if (!canvas) return;

        const padding = 24;
        const size = canvas.width;
        const total = size + padding * 2;

        const out = document.createElement("canvas");
        out.width = total;
        out.height = total + 40; // extra space for label
        const ctx = out.getContext("2d")!;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, out.width, out.height);

        ctx.drawImage(canvas, padding, padding, size, size);

        // Slug label
        ctx.fillStyle = "#1e3a5f";
        ctx.font = "bold 13px monospace";
        ctx.textAlign = "center";
        ctx.fillText(slug, total / 2, total + 24);

        const link = document.createElement("a");
        link.download = `qr-${slug}.png`;
        link.href = out.toDataURL("image/png");
        link.click();
    };

    // Close on backdrop click
    const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={handleBackdrop}
            aria-modal="true"
            role="dialog"
            aria-label="Event QR Code">
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center gap-6 animate-[fadeInScale_0.2s_ease-out]">
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-full text-cusviolet hover:bg-cusblue/10 transition-colors"
                    aria-label="Close QR modal">
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="text-center">
                    <div className="bg-cuscream w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <QrCode className="w-7 h-7 text-cusblue" />
                    </div>
                    <h2 className="text-xl font-bold text-cusblue leading-tight">
                        {eventName}
                    </h2>
                    <p className="text-xs text-cusviolet/60 mt-1">
                        Scan to open the event page
                    </p>
                </div>

                {/* QR Code */}
                <div
                    ref={canvasRef}
                    className="p-4 bg-white border-2 border-cusblue/10 rounded-2xl shadow-inner">
                    <QRCodeCanvas
                        value={qrUrl}
                        size={200}
                        bgColor="#ffffff"
                        fgColor="#0f2d57" /* matches cusblue */
                        level="H" /* High error-correction so logo overlays work */
                        marginSize={1}
                    />
                </div>

                {/* URL pill */}
                <p className="text-xs font-mono text-cusviolet/70 bg-cuscream px-4 py-2 rounded-full text-center break-all">
                    {qrUrl}
                </p>

                {/* Download */}
                <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center gap-2 bg-cusblue text-cuscream py-3 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-md">
                    <Download className="w-4 h-4" />
                    Download PNG
                </button>
            </div>
        </div>
    );
}

export default function EventDetailsPage() {
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showQR, setShowQR] = useState(false);

    const params = useParams();
    const eventId = typeof params?.id === "string" ? params.id : "";

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
            <main className="max-w-4xl mx-auto px-6 py-20 text-center">
                <div className="bg-red-50 border border-red-100 p-8 rounded-2xl">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-cusblue mb-2">
                        Oops!
                    </h2>
                    <p className="text-cusviolet mb-6">
                        {error || "Event not found."}
                    </p>
                    <Link
                        href="/home/events"
                        className="text-cusblue font-semibold underline">
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
                <div className="flex items-center justify-between mb-8">
                    <Link
                        href="/home/events"
                        className="flex items-center gap-2 text-cusviolet hover:text-cusblue transition-colors font-medium">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <div className="flex items-center gap-3">
                        {/* ── QR Code Button ── */}
                        <button
                            onClick={() => setShowQR(true)}
                            className="flex items-center gap-2 bg-cuscream border border-cusblue/20 text-cusblue px-5 py-2 rounded-xl hover:bg-cusblue hover:text-white transition-all shadow-sm font-medium">
                            <QrCode className="w-4 h-4" /> QR Code
                        </button>
                        <Link
                            href={`/home/events/${event._id}/edit`}
                            replace
                            className="flex items-center gap-2 bg-white border border-cusblue/20 text-cusblue px-5 py-2 rounded-xl hover:bg-cusblue hover:text-white transition-all shadow-sm">
                            <Edit3 className="w-4 h-4" /> Edit Event
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Card */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-white">
                            <div className="flex items-center gap-3 mb-4">
                                {/* Status Badges */}
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
                                <div className="flex gap-4">
                                    <div className="bg-cuscream p-3 rounded-2xl h-fit">
                                        <MapPin className="w-6 h-6 text-cusblue" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-cusviolet uppercase tracking-tight">
                                            Location
                                        </p>
                                        <p className="text-cusblue font-medium">
                                            {event.location}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="bg-cuscream p-3 rounded-2xl h-fit">
                                        <Globe className="w-6 h-6 text-cusblue" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-cusviolet uppercase tracking-tight">
                                            Public URL
                                        </p>
                                        <p className="text-cusblue font-mono text-sm">
                                            {event.uniqueSlug}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Info Card */}
                    <div className="space-y-6">
                        <div className="bg-cusblue text-cuscream p-8 rounded-3xl shadow-xl">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Calendar className="w-5 h-5" /> Schedule
                            </h3>

                            <div className="space-y-6">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-cuscream/60 mt-1" />
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
                                            <Clock className="w-3 h-3" />
                                            {new Date(
                                                event.startTime,
                                            ).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="border-l-2 border-cuscream/20 pl-4 py-1 ml-2">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-cuscream/60 mt-1" />
                                        <div>
                                            <p className="text-cuscream/60 text-xs uppercase font-bold mb-1">
                                                Ends
                                            </p>
                                            <p className="text-lg font-semibold leading-tight">
                                                {new Date(
                                                    event.endTime,
                                                ).toLocaleDateString(
                                                    undefined,
                                                    {
                                                        weekday: "short",
                                                        month: "long",
                                                        day: "numeric",
                                                    },
                                                )}
                                            </p>
                                            <p className="text-cuscream/80 italic flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(
                                                    event.endTime,
                                                ).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-cuscream/10 text-center">
                                <p className="text-sm font-medium opacity-80 mb-4 flex items-center justify-center gap-1">
                                    Event Status:{" "}
                                    <span className="capitalize flex items-center gap-1">
                                        <CheckCircle2 className="w-4 h-4" />
                                        {event.status}
                                    </span>
                                </p>
                                <Link
                                    href={`/events/${event.uniqueSlug}`}
                                    className="block w-full py-3 bg-cuscream text-cusblue rounded-xl font-bold hover:scale-[1.02] transition-transform">
                                    View Public Page
                                </Link>
                            </div>
                        </div>

                        {/* ── QR Code Preview Card ── */}
                        <div className="bg-white/50 border border-cusblue/10 p-6 rounded-3xl flex flex-col items-center gap-4">
                            <h4 className="flex items-center gap-2 text-cusblue font-bold self-start">
                                <QrCode className="w-4 h-4" /> Event QR Code
                            </h4>
                            {/* Tiny preview — not interactive, just visual */}
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
                                <QrCode className="w-4 h-4" /> View &amp;
                                Download
                            </button>
                        </div>

                        <div className="bg-white/50 border border-cusblue/10 p-6 rounded-3xl">
                            <h4 className="flex items-center gap-2 text-cusblue font-bold mb-2">
                                <Info className="w-4 h-4" /> Quick Info
                            </h4>
                            <ul className="text-sm text-cusviolet space-y-2">
                                <li className="flex justify-between items-center">
                                    <span>Premium Event</span>
                                    <span className="font-bold flex items-center gap-1">
                                        {event.isPremium ? (
                                            <>
                                                <CheckCircle2 className="w-4 h-4 text-custeal" />
                                                Yes
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-4 h-4 text-gray-400" />
                                                No
                                            </>
                                        )}
                                    </span>
                                </li>
                                <li className="flex justify-between items-center">
                                    <span>Live Status</span>
                                    <span className="font-bold flex items-center gap-1">
                                        {event.isLive ? (
                                            <>
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                Active
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-4 h-4 text-gray-400" />
                                                Inactive
                                            </>
                                        )}
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
