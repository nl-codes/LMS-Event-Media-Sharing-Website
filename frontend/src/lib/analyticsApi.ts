import { backend_url } from "@/config/backend";

export type AnalyticsRange =
    | "last7days"
    | "last30days"
    | "last90days"
    | "lastYear";

export type AnalyticsGranularity = "hour" | "day" | "month";

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
    const res = await fetch(url, {
        credentials: "include",
    });
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

export type EventInsightsHost = {
    _id: string;
    userName?: string;
    email?: string;
    profilePicture?: string;
};

export type EventInsightsResponse = {
    success: boolean;
    event: {
        _id: string;
        eventName: string;
        status: string;
        tier: string;
        startTime: string;
        endTime: string;
    };
    host: EventInsightsHost | null;
    totals: { members: number; media: number };
    window: {
        from: string;
        to: string;
        granularity: AnalyticsGranularity;
    };
    members: {
        data: AnalyticsPoint[];
        granularity: AnalyticsGranularity;
    };
    media: {
        data: AnalyticsPoint[];
        granularity: AnalyticsGranularity;
    };
    message?: string;
};

export async function getEventInsights(
    eventId: string,
): Promise<EventInsightsResponse> {
    const url = `${backend_url}/events/${eventId}/insights`;
    const res = await fetch(url, {
        credentials: "include",
    });
    const json = (await res.json().catch(() => ({}))) as EventInsightsResponse;
    if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to load event insights");
    }
    return json;
}
