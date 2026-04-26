"use client";

import {
    Calendar,
    MapPin,
    ShieldCheck,
    Lock,
    Loader2,
    User,
    Sparkles,
} from "lucide-react";
import type { Event } from "@/types/Event";
import BackButton from "@/components/navigation/BackButton";
import { useUser } from "@/context/UserContext";
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

    const formatDate = (date: string | Date) =>
        new Date(date).toLocaleDateString([], {
            month: "short",
            day: "numeric",
            year: "numeric",
        });

    const formatTime = (date: string | Date) =>
        new Date(date).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });

    return (
        <main className="min-h-screen bg-cuscream selection:bg-custeal selection:text-white pb-20">
            {isInitialized && user && (
                <div className="max-w-6xl mx-auto px-6 pt-8">
                    <BackButton label="Back" />
                </div>
            )}

            <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 profile-card-animate">
                {/* Main Glass Card */}
                <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-2xl overflow-hidden flex flex-col lg:flex-row">
                    {/* Thumbnail Section */}
                    <div className="w-full lg:w-[45%] p-6 lg:p-8">
                        <div className="relative aspect-video lg:h-full w-full rounded-4xl overflow-hidden bg-slate-100 shadow-inner group">
                            {event.thumbnail ? (
                                <Image
                                    src={event.thumbnail}
                                    alt={event.eventName}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    priority
                                />
                            ) : (
                                <div className="h-full w-full flex flex-col items-center justify-center text-cusblue/20 bg-slate-50">
                                    <Sparkles className="w-12 h-12 mb-2" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                        No Preview
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Details Section */}
                    <div className="flex-1 p-8 lg:p-10 lg:pl-4 space-y-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${event.isLive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                                    <div
                                        className={`w-1.5 h-1.5 rounded-full ${event.isLive ? "bg-green-500 animate-pulse" : "bg-slate-400"}`}
                                    />
                                    {event.isLive ? "Live Now" : "Upcoming"}
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-cusblue tracking-tight leading-tight mb-4">
                                {event.eventName}
                            </h1>
                            <p className="text-slate-500 text-base leading-relaxed max-w-xl">
                                {event.description ||
                                    "Join us for this exclusive event experience."}
                            </p>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Host Card */}
                            <div className="bg-white/50 border border-slate-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                                <div className="p-2 bg-cusblue text-white rounded-xl shadow-sm shrink-0">
                                    <User size={18} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Hosted By
                                    </p>
                                    <p className="text-sm font-bold text-cusblue truncate">
                                        {(event.hostId as { userName?: string })
                                            ?.userName || "Anonymous Host"}
                                    </p>
                                </div>
                            </div>

                            {/* Location Card */}
                            <div className="bg-white/50 border border-slate-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                                <div className="p-2 bg-cusblue text-white rounded-xl shadow-sm shrink-0">
                                    <MapPin size={18} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Where
                                    </p>
                                    <p className="text-sm font-bold text-cusblue truncate wrap-break-word">
                                        {event.location}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Timing Section */}
                        <div className="bg-slate-50 border border-slate-100 rounded-4xl p-6 relative overflow-hidden">
                            <div className="flex flex-col md:flex-row md:items-center gap-8 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-2xl text-cusblue shadow-sm">
                                        <Calendar size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            When
                                        </p>
                                        <p className="text-base font-bold text-cusblue">
                                            {formatDate(event.startTime)}
                                        </p>
                                        <p className="text-sm text-slate-500 font-medium">
                                            Starts {formatTime(event.startTime)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Section */}
                        <div className="pt-4">
                            {!gateResult ? (
                                <button
                                    onClick={onCheckUpload}
                                    disabled={checking}
                                    className="w-full md:w-auto px-8 py-4 bg-cusblue text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-cusblue/20">
                                    {checking ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <ShieldCheck className="w-5 h-5" />
                                            Verify Access to Upload
                                        </>
                                    )}
                                </button>
                            ) : (
                                <div
                                    className={`p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 ${
                                        gateResult.success
                                            ? "bg-green-50 border border-green-200"
                                            : "bg-red-50 border border-red-200"
                                    }`}>
                                    <div className="flex items-start gap-3">
                                        {gateResult.success ? (
                                            <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
                                        ) : (
                                            <Lock className="w-5 h-5 text-red-600 shrink-0" />
                                        )}
                                        <p
                                            className={`text-sm font-bold leading-tight ${gateResult.success ? "text-green-800" : "text-red-800"}`}>
                                            {gateResult.msg}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() =>
                                            router.push(
                                                `/events/${event.uniqueSlug}/gallery`,
                                            )
                                        }
                                        className="bg-white text-cusblue px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-sm hover:bg-slate-50 transition-colors shrink-0">
                                        Go to Gallery
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-[10px] font-black text-cusblue/20 uppercase tracking-[0.4em]">
                        Powered by LMS
                    </p>
                </div>
            </div>
        </main>
    );
}
