"use client";

import {
    Calendar,
    MapPin,
    ShieldCheck,
    Lock,
    Loader2,
    Camera,
} from "lucide-react";
import type { Event } from "@/types/Event";
import BackButton from "@/components/navigation/BackButton";
import { useUser } from "@/context/UserContext";
import Button from "@/components/buttons/Button";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
    const { user, isInitialized } = useUser();
    const router = useRouter();

    return (
        <main className="min-h-screen bg-cuscream selection:bg-custeal selection:text-white pb-20">
            {isInitialized && user && (
                <div className="max-w-4xl mx-auto px-6 pt-8">
                    <BackButton label="Back" />
                </div>
            )}

            {/* Minimal Public Header */}
            <div className="max-w-4xl mx-auto px-6 pt-12 text-center profile-card-animate">
                <div className="mb-8 rounded-3xl border border-transparent bg-linear-to-r from-cusblue to-cusviolet p-px shadow-xl shadow-cusblue/10">
                    <div className="relative h-72 w-full rounded-3xl overflow-hidden bg-cuscream">
                        {event.thumbnail ? (
                            <Image
                                src={event.thumbnail}
                                alt={`${event.eventName} thumbnail`}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover"
                            />
                        ) : (
                            <div className="h-full w-full bg-linear-to-r from-cusblue/15 to-cusviolet/15" />
                        )}
                    </div>
                </div>

                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white shadow-sm border border-cusblue/5 mb-6">
                    <span
                        className={`w-2 h-2 rounded-full ${event.isLive ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
                    />
                    <span className="text-xs font-bold text-cusblue uppercase tracking-widest">
                        {event.isLive ? "Live Event" : "Upcoming Event"}
                    </span>
                </div>

                <h1 className="text-4xl md:text-6xl font-bold text-cusblue mb-6 tracking-tight">
                    {event.eventName}
                </h1>

                <p className="text-lg md:text-xl text-cusviolet/80 max-w-2xl mx-auto leading-relaxed mb-10">
                    {event.description ||
                        "Join us for this exclusive event experience."}
                </p>

                {/* Event Meta Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-12">
                    <div className="bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-white flex items-center gap-4 shadow-sm">
                        <div className="bg-cusblue/5 p-3 rounded-xl text-cusblue shrink-0">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <div className="text-left overflow-hidden">
                            <p className="text-[10px] font-bold text-cusviolet uppercase tracking-wider opacity-60">
                                Where
                            </p>
                            <p className="text-cusblue font-semibold wrap-break-word whitespace-normal">
                                {event.location}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-white flex items-center gap-4 shadow-sm">
                        <div className="bg-cusblue/5 p-3 rounded-xl text-cusblue">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-bold text-cusviolet uppercase tracking-wider opacity-60">
                                When
                            </p>
                            <p className="text-cusblue font-semibold">
                                {new Date(event.startTime).toLocaleDateString(
                                    [],
                                    {
                                        month: "short",
                                        day: "numeric",
                                    },
                                )}{" "}
                                @{" "}
                                {new Date(event.startTime).toLocaleTimeString(
                                    [],
                                    {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    },
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Gate/Action Section */}
                <div className="max-w-md mx-auto bg-cusblue rounded-[2.5rem] p-8 md:p-10 shadow-2xl text-cuscream relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full transition-transform group-hover:scale-150 duration-700" />

                    <div className="relative z-10 text-center">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Camera className="w-8 h-8 text-cuscream" />
                        </div>

                        <h3 className="text-2xl font-bold mb-2">
                            Event Access
                        </h3>
                        <p className="text-cuscream/70 text-sm mb-8">
                            Verify your permissions to upload photos and videos
                            to this event&apos;s shared gallery.
                        </p>

                        {!gateResult ? (
                            <button
                                onClick={onCheckUpload}
                                disabled={checking}
                                className="w-full bg-cuscream text-cusblue py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white transition-all active:scale-95 disabled:opacity-50">
                                {checking ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <ShieldCheck className="w-5 h-5" />
                                        Verify Access
                                    </>
                                )}
                            </button>
                        ) : (
                            <div
                                className={`p-4 rounded-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 ${
                                    gateResult.success
                                        ? "bg-green-500/20 border border-green-500/30"
                                        : "bg-red-500/20 border border-red-500/30"
                                }`}>
                                <div className="flex items-start gap-3 text-left">
                                    {gateResult.success ? (
                                        <ShieldCheck className="w-5 h-5 shrink-0" />
                                    ) : (
                                        <Lock className="w-5 h-5 shrink-0" />
                                    )}
                                    <p className="text-sm font-medium leading-tight">
                                        {gateResult.msg}
                                    </p>
                                </div>

                                {/* New Gallery Button */}
                                <Button
                                    className="text-cuscream! p-2 rounded-lg font-bold transition-opacity"
                                    handleClick={() =>
                                        router.push(
                                            `/events/${event.uniqueSlug}/gallery`,
                                        )
                                    }>
                                    Go to Gallery
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-20 text-center">
                <p className="text-xs font-bold text-cusblue/30 uppercase tracking-[0.3em]">
                    Powered by LMS
                </p>
            </div>
        </main>
    );
}
