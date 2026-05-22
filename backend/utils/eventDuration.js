/**
 * @module utils/eventDuration
 * @description Tier → upload-window duration. The backend is the single
 * source of truth for `Event.endTime`; this helper is what derives it.
 * The frontend has a mirror at frontend/src/lib/eventDuration for
 * display-only previews.
 */

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;

/**
 * Compute `endTime` from `startTime + tier window`:
 * free → +24h, premium → +1 week, pro → +1 month (calendar month, via
 * `setMonth(+1)` so DST and varying month lengths are respected).
 * @param {Date|string} startTime
 * @param {"free"|"premium"|"pro"|string} tier Unknown tiers fall through to free.
 * @returns {Date}
 * @throws {Error} If `startTime` is not parseable.
 */
export const calculateEventEndTime = (startTime, tier) => {
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

/**
 * True when an event is "over", either the host marked it
 * Completed/Cancelled OR the calculated `endTime` has passed. Manual
 * status wins over wall-clock so a host-driven Finish takes effect
 * immediately.
 * @param {{ status?: string, endTime?: Date|string }|null|undefined} event
 * @returns {boolean}
 */
export const isEventFinished = (event) => {
    if (!event) return false;
    if (event.status === "Completed" || event.status === "Cancelled") {
        return true;
    }
    const end = new Date(event.endTime).getTime();
    return Number.isFinite(end) && end < Date.now();
};
