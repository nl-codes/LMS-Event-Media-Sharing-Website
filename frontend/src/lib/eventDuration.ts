import type { Event, EventStatus } from "@/types/Event";

export type EventTier = "free" | "premium" | "pro";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;

// Display-only mirror of the backend tier→duration calculation. Persisted
// endTime is always computed server-side; this helper exists so the create/
// edit pages can show the user the eventual end time without round-tripping.
export const calculateEventEndTime = (
    startTime: string | Date,
    tier: EventTier | undefined,
): Date => {
    const start = new Date(startTime);
    if (Number.isNaN(start.getTime())) {
        throw new Error("Invalid start time");
    }

    if (tier === "premium") {
        return new Date(start.getTime() + ONE_WEEK_MS);
    }

    if (tier === "pro") {
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);
        return end;
    }

    return new Date(start.getTime() + ONE_DAY_MS);
};

export const TIER_DURATION_LABEL: Record<EventTier, string> = {
    free: "24 hours",
    premium: "1 week",
    pro: "1 month",
};

type FinishedInput = Pick<Event, "status" | "endTime"> | {
    status?: EventStatus;
    endTime?: string;
};

// Treat an event as "over" when the host has explicitly marked it finished
// or cancelled, OR the calculated endTime has passed.
export const isEventFinished = (event: FinishedInput | null | undefined) => {
    if (!event) return false;
    if (event.status === "Completed" || event.status === "Cancelled") {
        return true;
    }
    if (!event.endTime) return false;
    const end = new Date(event.endTime).getTime();
    return Number.isFinite(end) && end < Date.now();
};
