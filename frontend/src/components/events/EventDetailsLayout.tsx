"use client";

import Image from "next/image";
import { CheckCircle2, MapPin, Play, Sparkles, Zap } from "lucide-react";
import type { ReactNode } from "react";
import UserAvatar from "../common/UserAvatar";
import { HelperFormatDate, HelperFormatTime } from "@/utils/HelperFunctions";
import Link from "next/link";
import { Event } from "@/types/Event";

type EventDetailsLayoutProps = {
    event: Event;
    children: ReactNode;
};

export default function EventDetailsLayout({
    event,
    children,
}: EventDetailsLayoutProps) {
    return (
        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-2xl overflow-hidden flex flex-col lg:flex-row items-center">
            {/* Thumbnail */}
            <div className="w-1/2 lg:w-[50%] p-6 lg:p-8">
                <div className="relative aspect-video w-full rounded-4xl overflow-hidden bg-slate-100 shadow-inner group">
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
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                No image cover
                            </span>
                        </div>
                    )}
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

            {/* Right column */}
            <div className="flex-1 max-w-1/2 p-8 lg:p-10 lg:pl-4 space-y-8">
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
                    <h1 className="text-4xl font-black text-cusblue tracking-tight leading-tight mb-4 w-full wrap-break-word">
                        {event.eventName}
                    </h1>
                    <p className="text-slate-500 text-sm leading-relaxed max-w-xl line-clamp-4">
                        {event.description ||
                            "No description provided for this event."}
                    </p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Host Card */}
                    {(() => {
                        const host =
                            typeof event.hostId === "object" &&
                            event.hostId !== null
                                ? event.hostId
                                : null;
                        const hostName = host?.userName || "Anonymous Host";
                        const inner = (
                            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex items-start gap-3 min-w-0 shadow-sm transition-colors hover:bg-white/80">
                                <UserAvatar
                                    src={host?.profilePicture}
                                    name={hostName}
                                    size="small"
                                />
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Hosted By
                                    </p>
                                    <p className="text-sm font-bold text-cusblue truncate">
                                        {hostName}
                                    </p>
                                </div>
                            </div>
                        );
                        return host?._id ? (
                            <Link href={`/home/profile/${host._id}/others`}>
                                {inner}
                            </Link>
                        ) : (
                            inner
                        );
                    })()}

                    {/* Location Card */}
                    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex items-start gap-3 min-w-0 shadow-sm transition-colors hover:bg-white/80">
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
                                {HelperFormatDate(event.startTime)}
                            </p>
                            <div className="flex gap-4 items-center">
                                <div className="p-2 bg-white rounded-xl shadow-sm text-cusblue shrink-0">
                                    <Play size={18} className="fill-cusblue" />
                                </div>
                                <p className="text-sm text-white/70 flex items-center gap-1.5 font-medium">
                                    {HelperFormatTime(event.startTime)}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-1 md:border-l md:border-white/10 md:pl-8">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                                Ends
                            </p>
                            <p className="text-lg font-bold">
                                {HelperFormatDate(event.endTime)}
                            </p>
                            <div className="flex gap-4 items-center">
                                <div className="p-2 bg-white rounded-xl shadow-sm text-cusblue shrink-0">
                                    <CheckCircle2 size={18} />
                                </div>
                                <p className="text-sm text-white/70 flex items-center gap-1.5 font-medium">
                                    {HelperFormatTime(event.endTime)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                {children}
            </div>
        </div>
    );
}
