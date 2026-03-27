"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Calendar, Clock, MapPin } from "lucide-react";
import type { Event } from "@/types/Event";

interface GalleryEventHeaderProps {
    event: Pick<
        Event,
        | "eventName"
        | "description"
        | "location"
        | "startTime"
        | "endTime"
        | "isLive"
    >;
    subtitle?: string;
    actionSlot?: ReactNode;
}

const DESCRIPTION_TRUNCATE_LENGTH = 170;

function formatCountdownParts(totalSeconds: number) {
    const clamped = Math.max(0, totalSeconds);
    const days = Math.floor(clamped / 86400);
    const hours = Math.floor((clamped % 86400) / 3600);
    const minutes = Math.floor((clamped % 3600) / 60);
    const seconds = clamped % 60;

    return { days, hours, minutes, seconds };
}

function formatTimeLabel(dateValue: string) {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return `${date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
    })} @ ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    })}`;
}

export default function GalleryEventHeader({
    event,
    subtitle = "Shared Event Gallery",
    actionSlot,
}: GalleryEventHeaderProps) {
    const [now, setNow] = useState(() => Date.now());
    const [expandedDescription, setExpandedDescription] = useState(false);

    useEffect(() => {
        const interval = window.setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => {
            window.clearInterval(interval);
        };
    }, []);

    const timeline = useMemo(() => {
        const start = new Date(event.startTime);
        const end = new Date(event.endTime);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            return {
                statusText: "Schedule unavailable",
                statusClass: "bg-gray-400",
                countdownLabel: "",
                countdownText: "--:--:--",
            };
        }

        const isOngoing = now >= start.getTime() && now <= end.getTime();
        const shouldShowLive = Boolean(event.isLive) || isOngoing;

        if (now < start.getTime()) {
            const remainingSeconds = Math.floor((start.getTime() - now) / 1000);
            const { days, hours, minutes, seconds } =
                formatCountdownParts(remainingSeconds);

            return {
                statusText: "Upcoming Event",
                statusClass: "bg-gray-400",
                countdownLabel: "Starts in",
                countdownText: `${days}d ${hours}h ${minutes}m ${seconds}s`,
            };
        }

        if (shouldShowLive && now <= end.getTime()) {
            const remainingSeconds = Math.floor((end.getTime() - now) / 1000);
            const { days, hours, minutes, seconds } =
                formatCountdownParts(remainingSeconds);

            return {
                statusText: "Live Event",
                statusClass: "bg-green-500 animate-pulse",
                countdownLabel: "Ends in",
                countdownText: `${days}d ${hours}h ${minutes}m ${seconds}s`,
            };
        }

        return {
            statusText: "Event Ended",
            statusClass: "bg-gray-400",
            countdownLabel: "",
            countdownText: "Ended",
        };
    }, [event.endTime, event.isLive, event.startTime, now]);

    const description =
        event.description?.trim() ||
        "Upload and relive the best moments from this event.";
    const shouldTruncate = description.length > DESCRIPTION_TRUNCATE_LENGTH;
    const shortDescription = `${description.slice(0, DESCRIPTION_TRUNCATE_LENGTH).trim()}...`;

    return (
        <section className="mb-8 rounded-3xl bg-cuscream p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cusblue/5 bg-white px-4 py-1.5 shadow-sm">
                        <span
                            className={`h-2 w-2 rounded-full ${timeline.statusClass}`}
                        />
                        <span className="text-xs font-bold uppercase tracking-widest text-cusblue">
                            {timeline.statusText}
                        </span>
                    </div>

                    <h1 className="mb-2 text-3xl font-bold tracking-tight text-cusblue md:text-4xl">
                        {event.eventName || "Event Gallery"}
                    </h1>
                    <p className="mb-4 text-sm text-cusviolet/80">{subtitle}</p>

                    <p className="max-w-2xl text-base leading-relaxed text-cusviolet/85">
                        {shouldTruncate && !expandedDescription
                            ? shortDescription
                            : description}
                    </p>

                    {shouldTruncate && (
                        <button
                            type="button"
                            onClick={() =>
                                setExpandedDescription((prev) => !prev)
                            }
                            className="mt-2 text-sm font-semibold text-cusblue hover:text-custeal transition-colors">
                            {expandedDescription ? "Read less" : "Read more"}
                        </button>
                    )}
                </div>

                {actionSlot && (
                    <div className="w-full lg:w-auto">{actionSlot}</div>
                )}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="flex items-center gap-4 rounded-2xl border border-white bg-white/60 p-5 shadow-sm backdrop-blur-md">
                    <div className="rounded-xl bg-cusblue/5 p-3 text-cusblue">
                        <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-cusviolet/60">
                            Where
                        </p>
                        <p className="font-semibold text-cusblue">
                            {event.location || "Location TBD"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-white bg-white/60 p-5 shadow-sm backdrop-blur-md">
                    <div className="rounded-xl bg-cusblue/5 p-3 text-cusblue">
                        <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-cusviolet/60">
                            Starts
                        </p>
                        <p className="font-semibold text-cusblue">
                            {formatTimeLabel(event.startTime)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-white bg-white/60 p-5 shadow-sm backdrop-blur-md">
                    <div className="rounded-xl bg-cusblue/5 p-3 text-cusblue">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-cusviolet/60">
                            {timeline.countdownLabel || "Status"}
                        </p>
                        <p className="font-semibold text-cusblue">
                            {timeline.countdownText}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
