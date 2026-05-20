"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, ShieldAlert, Users, Images } from "lucide-react";
import toast from "react-hot-toast";
import BackButton from "@/components/navigation/BackButton";
import UserAvatar from "@/components/common/UserAvatar";
import InsightsChart from "@/components/admin/InsightsChart";
import { useUser } from "@/context/UserContext";
import { getEventById } from "@/lib/eventApi";
import {
    getEventInsights,
    type EventInsightsResponse,
} from "@/lib/analyticsApi";

type GateState = "checking" | "authorized" | "unauthorized" | "not_found";

const formatWindow = (fromIso: string, toIso: string) => {
    const opts: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    };
    const f = new Date(fromIso).toLocaleString("en-US", opts);
    const t = new Date(toIso).toLocaleString("en-US", opts);
    return `${f} → ${t}`;
};

export default function EventInsightsPage() {
    const params = useParams<{ id: string }>();
    const eventId = params?.id ?? "";
    const { user, isInitialized } = useUser();
    const [gate, setGate] = useState<GateState>("checking");
    const [data, setData] = useState<EventInsightsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check host ownership before fetching anything sensitive. Admins/super-
    // admins are also allowed (matches the server's authorization rule).
    useEffect(() => {
        if (!isInitialized || !eventId) return;
        let cancelled = false;
        (async () => {
            try {
                const ev = await getEventById(eventId);
                if (cancelled) return;
                const hostIdStr =
                    typeof ev.hostId === "string"
                        ? ev.hostId
                        : ev.hostId?._id || "";
                const isHost = !!user && hostIdStr === user._id;
                const isAdmin =
                    user?.role === "admin" || user?.role === "superadmin";
                setGate(isHost || isAdmin ? "authorized" : "unauthorized");
            } catch {
                if (!cancelled) setGate("not_found");
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [eventId, user, isInitialized]);

    const load = useCallback(async () => {
        if (!eventId || gate !== "authorized") return;
        setIsLoading(true);
        try {
            const res = await getEventInsights(eventId);
            setData(res);
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : "Failed to load event insights",
            );
            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, [eventId, gate]);

    useEffect(() => {
        void load();
    }, [load]);

    if (gate === "checking") {
        return (
            <main className="min-h-screen bg-cuscream px-4 py-8 sm:px-8">
                <div className="mx-auto max-w-5xl">
                    <BackButton label="Back to Event" />
                    <div className="mt-10 flex items-center justify-center gap-3 text-cusviolet/75">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="text-sm font-bold">
                            Checking access...
                        </span>
                    </div>
                </div>
            </main>
        );
    }

    if (gate !== "authorized") {
        return (
            <main className="min-h-screen bg-cuscream px-4 py-8 sm:px-8">
                <div className="mx-auto max-w-5xl">
                    <BackButton label="Back to Event" />
                    <div className="mt-10 flex flex-col items-center justify-center gap-3 rounded-3xl border border-white/40 bg-white/60 px-6 py-12 text-center shadow-xl shadow-cusblue/5 backdrop-blur-md">
                        <ShieldAlert className="h-10 w-10 text-cusviolet/60" />
                        <h2 className="text-2xl font-extrabold text-cusblue">
                            {gate === "not_found"
                                ? "Event not found"
                                : "You're not the host"}
                        </h2>
                        <p className="max-w-md text-sm text-cusviolet/75">
                            {gate === "not_found"
                                ? "This event no longer exists or you don't have access to it."
                                : "Only the event host can view these insights."}
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-cuscream px-4 py-8 sm:px-8">
            <div className="mx-auto max-w-5xl">
                <BackButton label="Back to Event" />

                <header className="mt-5">
                    <p className="text-xs font-black uppercase tracking-widest text-cusviolet/70">
                        Event insights
                    </p>
                    <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-cusblue sm:text-4xl">
                        {data?.event.eventName ?? "Loading..."}
                    </h1>
                    {data?.window && (
                        <p className="mt-2 text-sm font-bold text-cusviolet/70">
                            {formatWindow(data.window.from, data.window.to)}
                        </p>
                    )}
                </header>

                <section className="mt-6 grid gap-4 md:grid-cols-3">
                    <HostCard host={data?.host} loading={isLoading} />
                    <TotalCard
                        icon={<Users className="h-5 w-5" />}
                        label="Total members"
                        value={data?.totals.members}
                        loading={isLoading}
                    />
                    <TotalCard
                        icon={<Images className="h-5 w-5" />}
                        label="Total media"
                        value={data?.totals.media}
                        loading={isLoading}
                    />
                </section>

                <ChartCard
                    title="Members joined"
                    subtitle="New members over time"
                    isLoading={isLoading}
                    isEmpty={!data || data.members.data.length === 0}
                    chart={
                        data && (
                            <InsightsChart
                                label="Members"
                                points={data.members.data}
                                granularity={data.members.granularity}
                            />
                        )
                    }
                />

                <ChartCard
                    title="Media uploaded"
                    subtitle="New uploads over time"
                    isLoading={isLoading}
                    isEmpty={!data || data.media.data.length === 0}
                    chart={
                        data && (
                            <InsightsChart
                                label="Media"
                                points={data.media.data}
                                granularity={data.media.granularity}
                            />
                        )
                    }
                />
            </div>
        </main>
    );
}

function HostCard({
    host,
    loading,
}: {
    host: EventInsightsResponse["host"] | undefined;
    loading: boolean;
}) {
    return (
        <div className="rounded-3xl border border-white/40 bg-white/60 p-5 shadow-xl shadow-cusblue/5 backdrop-blur-md">
            <p className="text-xs font-black uppercase tracking-widest text-cusviolet/70">
                Hosted by
            </p>
            {loading ? (
                <div className="mt-3 h-12 animate-pulse rounded-xl bg-cusblue/10" />
            ) : host ? (
                <div className="mt-3 flex items-center gap-3">
                    <UserAvatar
                        src={host.profilePicture}
                        name={host.userName || host.email}
                        size="medium"
                    />
                    <div className="min-w-0">
                        <p className="truncate text-lg font-extrabold text-cusblue">
                            {host.userName || "Unknown"}
                        </p>
                        {host.email && (
                            <p className="truncate text-sm text-cusviolet/70">
                                {host.email}
                            </p>
                        )}
                    </div>
                </div>
            ) : (
                <p className="mt-3 text-sm text-cusviolet/60">
                    Host info unavailable.
                </p>
            )}
        </div>
    );
}

function TotalCard({
    icon,
    label,
    value,
    loading,
}: {
    icon: React.ReactNode;
    label: string;
    value: number | undefined;
    loading: boolean;
}) {
    return (
        <div className="rounded-3xl border border-white/40 bg-white/60 p-5 shadow-xl shadow-cusblue/5 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cusviolet/70">
                {icon}
                {label}
            </div>
            {loading ? (
                <div className="mt-3 h-9 w-20 animate-pulse rounded-lg bg-cusblue/10" />
            ) : (
                <p className="mt-2 text-3xl font-extrabold text-cusblue">
                    {(value ?? 0).toLocaleString()}
                </p>
            )}
        </div>
    );
}

function ChartCard({
    title,
    subtitle,
    isLoading,
    isEmpty,
    chart,
}: {
    title: string;
    subtitle: string;
    isLoading: boolean;
    isEmpty: boolean;
    chart: React.ReactNode;
}) {
    return (
        <div className="mt-6 rounded-3xl border border-white/40 bg-white/60 p-6 shadow-xl shadow-cusblue/5 backdrop-blur-md">
            <div className="mb-4">
                <p className="text-xs font-black uppercase tracking-widest text-cusviolet/70">
                    {title}
                </p>
                <p className="mt-1 text-sm text-cusviolet/60">{subtitle}</p>
            </div>
            {isLoading ? (
                <div className="flex h-72 flex-col items-center justify-center gap-3 sm:h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-cusblue/60" />
                    <p className="text-sm font-bold text-cusviolet/75">
                        Fetching data...
                    </p>
                </div>
            ) : isEmpty ? (
                <div className="flex h-72 items-center justify-center sm:h-96">
                    <p className="text-sm font-bold text-cusviolet/60">
                        No data for the selected range.
                    </p>
                </div>
            ) : (
                chart
            )}
        </div>
    );
}
