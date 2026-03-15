"use client";

import { useEffect, useState } from "react";
import { getEventBySlug, requestUploadSignature } from "@/lib/eventApi";
import type { Event } from "@/types/Event";
import { useParams } from "next/navigation";
import {
    Calendar,
    MapPin,
    ShieldCheck,
    Lock,
    Loader2,
    AlertCircle,
    Camera,
} from "lucide-react";

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

    const checkUpload = async () => {
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
        <main className="min-h-screen bg-cuscream selection:bg-custeal selection:text-white pb-20">
            {/* Minimal Public Header */}
            <div className="max-w-4xl mx-auto px-6 pt-12 text-center profile-card-animate">
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
                        <div className="bg-cusblue/5 p-3 rounded-xl text-cusblue">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-bold text-cusviolet uppercase tracking-wider opacity-60">
                                Where
                            </p>
                            <p className="text-cusblue font-semibold truncate">
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
                                    { month: "short", day: "numeric" },
                                )}{" "}
                                @{" "}
                                {new Date(event.startTime).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" },
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Gate/Action Section */}
                <div className="max-w-md mx-auto bg-cusblue rounded-[2.5rem] p-8 md:p-10 shadow-2xl text-cuscream relative overflow-hidden group">
                    {/* Decorative Circle */}
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
                                onClick={checkUpload}
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
                                className={`p-4 rounded-2xl flex items-start gap-3 text-left animate-in fade-in slide-in-from-bottom-2 ${
                                    gateResult.success
                                        ? "bg-green-500/20 border border-green-500/30"
                                        : "bg-red-500/20 border border-red-500/30"
                                }`}>
                                {gateResult.success ? (
                                    <ShieldCheck className="w-5 h-5 shrink-0" />
                                ) : (
                                    <Lock className="w-5 h-5 shrink-0" />
                                )}
                                <p className="text-sm font-medium leading-tight">
                                    {gateResult.msg}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Branding */}
            <div className="mt-20 text-center">
                <p className="text-xs font-bold text-cusblue/30 uppercase tracking-[0.3em]">
                    Powered by LMS
                </p>
            </div>
        </main>
    );
}
