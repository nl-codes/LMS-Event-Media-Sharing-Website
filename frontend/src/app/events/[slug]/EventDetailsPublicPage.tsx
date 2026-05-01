"use client";

import {
    MapPin,
    ShieldCheck,
    Lock,
    Loader2,
    User,
    Sparkles,
    Image as ImageIcon,
    Play,
    CheckCircle2,
} from "lucide-react";
import type { Event } from "@/types/Event";
import BackButton from "@/components/navigation/BackButton";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import EventStatusLabel from "@/components/events/EventStatusLabel";

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

    const isFinished = new Date(event.endTime) < new Date();

    return (
        <main className="min-h-screen bg-cuscream selection:bg-custeal selection:text-white pb-20">
            {isInitialized && user && (
                <div className="max-w-6xl mx-auto px-6 pt-8">
                    <BackButton label="Back" />
                </div>
            )}

            <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 profile-card-animate">
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
                            <div className="mb-4">
                                <EventStatusLabel
                                    startTime={event.startTime}
                                    endTime={event.endTime}
                                />
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
                        <div className="bg-slate-50 border border-slate-100 rounded-4xl p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-2xl text-cusblue shadow-sm shrink-0">
                                        <Play
                                            size={24}
                                            className="fill-cusblue"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Start
                                        </p>
                                        <p className="text-base font-bold text-cusblue">
                                            {formatDate(event.startTime)}
                                        </p>
                                        <p className="text-sm font-medium text-slate-500">
                                            {formatTime(event.startTime)}
                                        </p>
                                    </div>
                                </div>

                                {/* End Timing */}
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-2xl text-cusblue shadow-sm shrink-0">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            End
                                        </p>
                                        <p className="text-base font-bold text-cusblue">
                                            {formatDate(event.endTime)}
                                        </p>
                                        <p className="text-sm font-medium text-slate-500">
                                            {formatTime(event.endTime)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Action Section */}
                        <div className="pt-4">
                            {isFinished || gateResult?.success ? (
                                <button
                                    onClick={() =>
                                        router.push(
                                            `/events/${event.uniqueSlug}/gallery`,
                                        )
                                    }
                                    className="w-full md:w-auto px-8 py-4 bg-cusblue text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-cusblue/20">
                                    <ImageIcon className="w-5 h-5" />
                                    View Event Gallery
                                </button>
                            ) : !gateResult ? (
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
                                <div className="p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-red-50 border border-red-200">
                                    <div className="flex items-start gap-3">
                                        <Lock className="w-5 h-5 text-red-600 shrink-0" />
                                        <p className="text-sm font-bold leading-tight text-red-800">
                                            {gateResult.msg}
                                        </p>
                                    </div>
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
