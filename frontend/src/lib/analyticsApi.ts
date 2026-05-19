import { backend_url } from "@/config/backend";

export type AnalyticsRange =
    | "last7days"
    | "last30days"
    | "last90days"
    | "lastYear";

export type AnalyticsGranularity = "day" | "month";

export type AnalyticsPoint = {
    date: string;
    count: number;
};

export type AnalyticsResponse = {
    success: boolean;
    range: AnalyticsRange;
    granularity: AnalyticsGranularity;
    data: AnalyticsPoint[];
    message?: string;
};

async function fetchAnalytics(
    metric: "users" | "events" | "media",
    range: AnalyticsRange,
): Promise<AnalyticsResponse> {
    const url = `${backend_url}/admins/analytics/${metric}?range=${encodeURIComponent(range)}`;
    const res = await fetch(url, { credentials: "include" });
    const json = (await res.json().catch(() => ({}))) as AnalyticsResponse;
    if (!res.ok || !json.success) {
        throw new Error(json.message || `Failed to load ${metric} analytics`);
    }
    return json;
}

export const getUserAnalytics = (range: AnalyticsRange) =>
    fetchAnalytics("users", range);
export const getEventAnalytics = (range: AnalyticsRange) =>
    fetchAnalytics("events", range);
export const getMediaAnalytics = (range: AnalyticsRange) =>
    fetchAnalytics("media", range);
