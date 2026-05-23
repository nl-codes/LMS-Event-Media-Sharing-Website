"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
    MapPin,
    Calendar,
    Globe,
    Users,
    CalendarDays,
    Ticket,
} from "lucide-react";
import ReactCountryFlag from "react-country-flag";
import { Country } from "country-state-city";
import { getPublicProfile, type PublicProfile } from "@/lib/profileApi";
import type { Event } from "@/types/Event";
import clsx from "clsx";
import BackButton from "@/components/buttons/BackButton";
import ReportMenu from "@/components/report/ReportMenu";
import { useUser } from "@/context/UserContext";
import {
    HelperFormatDate,
    HelperFormatMonthYear,
} from "@/utils/HelperFunctions";
import UserAvatar from "@/components/common/UserAvatar";

function EventPill({ event, href }: { event: Event; href: string }) {
    return (
        <Link href={href}>
            <div className="group flex items-center gap-3 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/80 p-3 shadow-sm transition-all hover:shadow-md hover:border-cusblue/20 hover:-translate-y-0.5">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {event.thumbnail ? (
                        <Image
                            src={event.thumbnail}
                            alt={event.eventName}
                            fill
                            sizes="56px"
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    ) : (
                        <div className="h-full w-full bg-linear-to-r from-cusblue/15 to-cusviolet/15" />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-cusblue group-hover:text-cusviolet transition-colors">
                        {event.eventName}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-500">
                        <Calendar className="w-3 h-3 text-cusblue/50 shrink-0" />
                        <span>{HelperFormatDate(event.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-500">
                        <MapPin className="w-3 h-3 text-cusblue/50 shrink-0" />
                        <span className="truncate">
                            {event.location || "Online"}
                        </span>
                    </div>
                </div>
                {event.isPremium && (
                    <span className="shrink-0 rounded-md border border-teal-300/40 bg-teal-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-teal-600">
                        Premium
                    </span>
                )}
            </div>
        </Link>
    );
}

function EmptyEvents({ label }: { label: string }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cusblue/20 bg-white/40 py-8 text-center">
            <CalendarDays className="mb-2 h-7 w-7 text-cusblue/30" />
            <p className="text-sm font-semibold text-cusblue/50">{label}</p>
        </div>
    );
}

function SectionHeader({
    icon,
    title,
}: {
    icon: React.ReactNode;
    title: string;
}) {
    return (
        <div className="mb-4 flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-2xl bg-linear-to-r from-cusblue to-cusviolet px-4 py-2 text-white shadow-sm">
                {icon}
                <span className="text-xs font-black uppercase tracking-widest">
                    {title}
                </span>
            </div>
        </div>
    );
}

export default function OthersProfilePage() {
    const { id } = useParams<{ id: string }>();
    const { user: currentUser } = useUser();
    const [data, setData] = useState<PublicProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        getPublicProfile(id)
            .then(setData)
            .catch((err: unknown) =>
                setError(err instanceof Error ? err.message : "Not found"),
            )
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-cuscream">
                <p className="animate-pulse text-lg font-bold text-cusblue">
                    Loading profile...
                </p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-cuscream">
                <p className="text-lg font-bold text-rose-500">
                    {error ?? "Profile not found"}
                </p>
                <Link
                    href="/home"
                    className="rounded-2xl bg-cusblue px-6 py-2.5 text-sm font-bold text-white shadow hover:opacity-90 transition-opacity">
                    Go home
                </Link>
            </div>
        );
    }

    const { user, profile, createdEvents, joinedEvents } = data;

    const fullName =
        [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
        user.userName;

    const canReport = Boolean(currentUser) && currentUser?._id !== user._id;

    const countryName = profile?.country
        ? (Country.getCountryByCode(profile.country)?.name ?? profile.country)
        : null;

    return (
        <main className="min-h-screen bg-cuscream px-4 sm:px-6 py-6 sm:py-10">
            <div className="mx-auto max-w-5xl">
                <div className="mb-6 flex flex-row items-center gap-4">
                    <BackButton label="Back" />
                </div>
                {/* ── Top gradient banner card ── */}
                <div className="mb-6 overflow-hidden rounded-3xl bg-white shadow-xl">
                    <div className="h-28 bg-linear-to-r from-cusblue to-cusviolet" />

                    <div className="relative px-5 sm:px-8 pb-6 sm:pb-8">
                        {/* Avatar */}
                        <div className="relative -top-14 -mb-6 flex flex-wrap items-end justify-between gap-3">
                            <UserAvatar
                                src={profile?.profilePicture}
                                name={fullName}
                                size="large"
                            />
                            {/* Member since badge + Report menu */}
                            <div className="mb-1 flex items-center gap-2 flex-wrap">
                                <span className="rounded-2xl border border-cusblue/10 bg-cusblue/5 px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold text-cusblue/70">
                                    Member since{" "}
                                    {HelperFormatMonthYear(user.createdAt)}
                                </span>
                                {canReport && (
                                    <ReportMenu
                                        targetId={user._id}
                                        targetType="User"
                                        targetLabel={user.userName}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Name & username */}
                        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-800 wrap-break-word">
                            {fullName}
                        </h1>
                        <p className="text-sm font-medium text-cusblue">
                            @{user.userName}
                        </p>

                        {/* Bio */}
                        {profile?.bio && (
                            <p className="mt-4 text-sm leading-relaxed text-gray-600 italic">
                                {profile.bio}
                            </p>
                        )}
                    </div>
                </div>

                {/* ── Two-column layout ── */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left column — personal info */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="rounded-3xl bg-white/60 backdrop-blur-sm border border-white/80 shadow-sm p-5 sm:p-6 space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-cusviolet/50">
                                Personal Info
                            </p>

                            {/* Gender */}
                            {profile?.gender && (
                                <div className="flex items-center gap-3">
                                    <div
                                        className={clsx(
                                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                                            {
                                                "bg-blue-50 text-blue-400":
                                                    profile.gender?.toLowerCase() ===
                                                    "male",
                                                "bg-pink-50 text-pink-400":
                                                    profile.gender?.toLowerCase() ===
                                                    "female",
                                            },
                                        )}>
                                        <Users size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                            Gender
                                        </p>
                                        <p className="text-sm font-semibold capitalize text-gray-700">
                                            {profile.gender}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Country */}
                            {countryName && profile?.country && (
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                                        <Globe size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                            Country
                                        </p>
                                        <p className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                            <ReactCountryFlag
                                                countryCode={profile.country}
                                                svg
                                                style={{
                                                    width: "1.2em",
                                                    height: "1.2em",
                                                    borderRadius: "2px",
                                                }}
                                            />
                                            {countryName}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Joined date */}
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-400">
                                    <CalendarDays size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                        Joined
                                    </p>
                                    <p className="text-sm font-semibold text-gray-700">
                                        {HelperFormatMonthYear(user.createdAt)}
                                    </p>
                                </div>
                            </div>

                            {/* Event stats */}
                            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-gray-50 pt-4">
                                <div className="rounded-2xl bg-cusblue/5 p-3 text-center">
                                    <p className="text-xl font-black text-cusblue">
                                        {createdEvents.length}
                                    </p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-cusblue/60">
                                        Hosted
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-cusviolet/5 p-3 text-center">
                                    <p className="text-xl font-black text-cusviolet">
                                        {joinedEvents.length}
                                    </p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-cusviolet/60">
                                        Joined
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right column — events */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Created events */}
                        <div>
                            <SectionHeader
                                icon={<CalendarDays className="h-4 w-4" />}
                                title="Events Hosted"
                            />
                            {createdEvents.length === 0 ? (
                                <EmptyEvents label="No events hosted yet" />
                            ) : (
                                <div className="space-y-3">
                                    {createdEvents.map((event) => (
                                        <EventPill
                                            key={event._id}
                                            event={event}
                                            href={`/events/${event.uniqueSlug}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Joined events */}
                        <div>
                            <SectionHeader
                                icon={<Ticket className="h-4 w-4" />}
                                title="Events Joined"
                            />
                            {joinedEvents.length === 0 ? (
                                <EmptyEvents label="No events joined yet" />
                            ) : (
                                <div className="space-y-3">
                                    {joinedEvents.map((event) => (
                                        <EventPill
                                            key={event._id}
                                            event={event}
                                            href={`/events/${event.uniqueSlug}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
