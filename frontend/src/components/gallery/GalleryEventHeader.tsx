"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, MapPin } from "lucide-react";
import type { Event } from "@/types/Event";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import UserAvatar from "@/components/common/UserAvatar";
import { useUser } from "@/context/UserContext";
import EventStatusLabel from "../events/EventStatusLabel";

interface GalleryEventHeaderProps {
    event: Pick<
        Event,
        | "eventName"
        | "description"
        | "location"
        | "startTime"
        | "endTime"
        | "isLive"
        | "thumbnail"
        | "hostId"
        | "status"
    >;
    subtitle?: string;
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
}: GalleryEventHeaderProps) {
    const [now, setNow] = useState(() => Date.now());
    const [expandedDescription, setExpandedDescription] = useState(false);

    const { user } = useUser();

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
                countdownLabel: "",
                countdownText: "--:--:--",
            };
        }

        const finishedByStatus =
            event.status === "Completed" || event.status === "Cancelled";

        if (finishedByStatus) {
            return {
                countdownLabel: "",
                countdownText: "Ended",
            };
        }

        const isOngoing = now >= start.getTime() && now <= end.getTime();
        const shouldShowLive = Boolean(event.isLive) || isOngoing;

        if (now < start.getTime()) {
            const remainingSeconds = Math.floor((start.getTime() - now) / 1000);
            const { days, hours, minutes, seconds } =
                formatCountdownParts(remainingSeconds);

            return {
                countdownLabel: "Starts in",
                countdownText: `${days}d ${hours}h ${minutes}m ${seconds}s`,
            };
        }

        if (shouldShowLive && now <= end.getTime()) {
            const remainingSeconds = Math.floor((end.getTime() - now) / 1000);
            const { days, hours, minutes, seconds } =
                formatCountdownParts(remainingSeconds);

            return {
                countdownLabel: "Ends in",
                countdownText: `${days}d ${hours}h ${minutes}m ${seconds}s`,
            };
        }

        return {
            countdownLabel: "",
            countdownText: "Ended",
        };
    }, [event.endTime, event.isLive, event.startTime, event.status, now]);

    const description =
        event.description?.trim() ||
        "Upload and relive the best moments from this event.";
    const shouldTruncate = description.length > DESCRIPTION_TRUNCATE_LENGTH;
    const shortDescription = `${description.slice(0, DESCRIPTION_TRUNCATE_LENGTH).trim()}...`;

    const hostClassName = clsx(
        "inline-flex items-center gap-2 rounded-full border border-cusblue bg-white/70 px-3 py-1.5 shadow-sm backdrop-blur-md transition",
        user ? "hover:bg-white cursor-pointer" : "cursor-default",
    );

    const host =
        typeof event.hostId === "object" && event.hostId !== null
            ? event.hostId
            : null;
    if (!host) return null;
    const HostContent = (
        <>
            <UserAvatar
                src={host.profilePicture}
                name={host.userName}
                size="small"
            />
            <span className="text-xs font-bold text-cusblue">
                Hosted by {host.userName || "Anonymous"}
            </span>
        </>
    );

    return (
        <section className="rounded-3xl bg-cuscream p-5 sm:p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-120 flex flex-col gap-4">
                    <EventStatusLabel
                        startTime={event.startTime}
                        endTime={event.endTime}
                        status={event.status}
                    />

                    <h1 className="text-3xl font-bold tracking-tight leading-tight w-full wrap-break-word text-cusblue md:text-4xl">
                        {event.eventName || "Event Gallery"}
                    </h1>

                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm text-cusviolet/80">{subtitle}</p>

                        {/* Host */}
                        {host &&
                            (user ? (
                                <Link
                                    href={`/home/profile/${host._id}/others`}
                                    className={hostClassName}>
                                    {HostContent}
                                </Link>
                            ) : (
                                <div className={hostClassName}>
                                    {HostContent}
                                </div>
                            ))}
                    </div>

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
                            className="text-sm font-semibold text-cusblue hover:text-custeal transition-colors">
                            {expandedDescription ? "Read less" : "Read more"}
                        </button>
                    )}
                </div>

                <div className="w-full max-w-100 rounded-2xl p-px">
                    <div className="rounded-2xl p-2 backdrop-blur-sm">
                        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-cuscream">
                            {event.thumbnail ? (
                                <Image
                                    src={event.thumbnail}
                                    alt={`${event.eventName} thumbnail`}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className="object-cover"
                                />
                            ) : (
                                <div className="h-full w-full bg-linear-to-r from-cusblue/10 to-cusviolet/10" />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Location Card */}
                <div className="flex items-center gap-4 rounded-2xl border border-white bg-white/60 p-5 shadow-sm backdrop-blur-md min-w-0">
                    <div className="shrink-0 rounded-xl bg-cusblue/5 p-3 text-cusblue">
                        <MapPin className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-cusviolet/60">
                            Where
                        </p>
                        <p className="font-semibold text-cusblue wrap-break-word line-clamp-2 leading-tight">
                            {event.location || "Location TBD"}
                        </p>
                    </div>
                </div>

                {/* Starts Card */}
                <div className="flex items-center gap-4 rounded-2xl border border-white bg-white/60 p-5 shadow-sm backdrop-blur-md">
                    <div className="shrink-0 rounded-xl bg-cusblue/5 p-3 text-cusblue">
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

                {/* Status Card */}
                <div className="flex items-center gap-4 rounded-2xl border border-white bg-white/60 p-5 shadow-sm backdrop-blur-md">
                    <div className="shrink-0 rounded-xl bg-cusblue/5 p-3 text-cusblue">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-cusviolet/60">
                            {timeline.countdownLabel || "Status"}
                        </p>
                        <p className="font-semibold text-cusblue wrap-break-word">
                            {timeline.countdownText}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
