"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Users, CalendarDays, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";
import { AdminShell, PageHeader } from "@/components/admin/AdminShared";
import InsightsChart from "@/components/admin/InsightsChart";
import {
    getEventAnalytics,
    getMediaAnalytics,
    getUserAnalytics,
    type AnalyticsGranularity,
    type AnalyticsPoint,
    type AnalyticsRange,
} from "@/lib/analyticsApi";

type TabKey = "users" | "events" | "media";

type TabConfig = {
    key: TabKey;
    label: string;
    icon: typeof Users;
    fetcher: (range: AnalyticsRange) => Promise<{
        data: AnalyticsPoint[];
        granularity: AnalyticsGranularity;
    }>;
};

const TABS: TabConfig[] = [
    { key: "users", label: "Users", icon: Users, fetcher: getUserAnalytics },
    {
        key: "events",
        label: "Events",
        icon: CalendarDays,
        fetcher: getEventAnalytics,
    },
    {
        key: "media",
        label: "Media",
        icon: ImageIcon,
        fetcher: getMediaAnalytics,
    },
];

const RANGES: { key: AnalyticsRange; label: string }[] = [
    { key: "last7days", label: "Last 7 days" },
    { key: "last30days", label: "Last 30 days" },
    { key: "last90days", label: "Last 90 days" },
    { key: "lastYear", label: "Last year" },
];

export default function AdminInsightsPage() {
    const [activeTab, setActiveTab] = useState<TabKey>("users");
    const [range, setRange] = useState<AnalyticsRange>("last30days");
    const [points, setPoints] = useState<AnalyticsPoint[]>([]);
    const [granularity, setGranularity] = useState<AnalyticsGranularity>("day");
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async (tab: TabKey, r: AnalyticsRange) => {
        const config = TABS.find((t) => t.key === tab);
        if (!config) return;
        setIsLoading(true);
        try {
            const res = await config.fetcher(r);
            setPoints(res.data);
            setGranularity(res.granularity);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to load analytics",
            );
            setPoints([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadData(activeTab, range);
    }, [activeTab, range, loadData]);

    const activeLabel =
        TABS.find((t) => t.key === activeTab)?.label || "Records";
    const totalInRange = points.reduce((sum, p) => sum + p.count, 0);

    return (
        <AdminShell>
            <PageHeader
                eyebrow="Admin insights"
                title="Growth at a glance"
                description="Track new users, events, and uploads over time. Switch tabs to compare growth patterns."
            />

            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const active = tab.key === activeTab;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={clsx(
                                    "flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all",
                                    active
                                        ? "bg-cusblue text-cuscream shadow-lg shadow-cusblue/15"
                                        : "bg-white/60 text-cusviolet/75 hover:bg-white hover:text-cusblue",
                                )}>
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-wrap gap-2">
                    {RANGES.map((r) => {
                        const active = r.key === range;
                        return (
                            <button
                                key={r.key}
                                type="button"
                                onClick={() => setRange(r.key)}
                                className={clsx(
                                    "flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all",
                                    active
                                        ? "bg-cusviolet text-cuscream"
                                        : "bg-white/60 text-cusviolet/70 hover:bg-white",
                                )}>
                                {r.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="rounded-3xl border border-white/40 bg-white/60 p-6 shadow-xl shadow-cusblue/5 backdrop-blur-md">
                <div className="mb-4 flex items-baseline justify-between gap-4">
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-cusviolet/70">
                            New {activeLabel}
                        </p>
                        <p className="mt-1 text-3xl font-extrabold text-cusblue">
                            {totalInRange.toLocaleString()}
                        </p>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-cusviolet/50">
                        {granularity === "hour"
                            ? "Hourly"
                            : granularity === "month"
                              ? "Monthly"
                              : "Daily"}
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex h-72 flex-col items-center justify-center gap-3 sm:h-96">
                        <Loader2 className="h-8 w-8 animate-spin text-cusblue/60" />
                        <p className="max-w-sm text-center text-sm font-bold text-cusviolet/75">
                            Fetching data... This may take a while for large
                            datasets.
                        </p>
                    </div>
                ) : points.length === 0 ? (
                    <div className="flex h-72 items-center justify-center sm:h-96">
                        <p className="text-sm font-bold text-cusviolet/60">
                            No data for the selected range.
                        </p>
                    </div>
                ) : (
                    <InsightsChart
                        label={activeLabel}
                        points={points}
                        granularity={granularity}
                    />
                )}
            </div>
        </AdminShell>
    );
}
