/**
 * @module utils/mediaRetention
 * @description Tier-based media retention deadlines + warning windows.
 *
 * Retention is separate from the upload-window duration: it's how long
 * uploaded media stays in storage AFTER the event has ended. Retention
 * starts at `event.endTime` (not at host-finish time) so a host who
 * finishes early doesn't accidentally accelerate deletion.
 */

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Free-tier retention is a fixed 7 days from endTime; Premium/Pro use
 *  calendar-month addition (downstream) instead. */
export const FREE_RETENTION_DAYS = 7;

/** Per-tier warning lead time before deletion lands. Drives both the
 *  host UI banner and the API-exposed virtual on Event. */
const WARNING_HOURS_BY_TIER = {
    free: 24,
    premium: 48,
    pro: 72,
};

/**
 * Add N calendar months to a Date. `setMonth(+1)` handles short months
 * + DST properly (vs a naïve fixed-day arithmetic).
 * @param {Date} date
 * @param {number} months
 * @returns {Date}
 */
const addCalendarMonths = (date, months) => {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
};

/**
 * Tier → media-deletion deadline. Free is `endTime + 7d`; Premium is
 * `endTime + 1 month`; Pro is `endTime + 3 months`.
 * @param {{ endTime?: Date|string, tier?: string }} event
 * @returns {Date|null} Null if endTime is missing or invalid.
 */
export const getMediaRetentionDeleteAt = (event) => {
    if (!event?.endTime) return null;
    const end = new Date(event.endTime);
    if (Number.isNaN(end.getTime())) return null;

    const tier = event.tier || "free";
    if (tier === "premium") {
        return addCalendarMonths(end, 1);
    }
    if (tier === "pro") {
        return addCalendarMonths(end, 3);
    }
    return new Date(end.getTime() + FREE_RETENTION_DAYS * ONE_DAY_MS);
};

/**
 * When the host warning banner should start showing (24h before deletion
 * for free, 48h premium, 72h pro).
 * @param {{ endTime?: Date|string, tier?: string }} event
 * @returns {Date|null}
 */
export const getMediaRetentionWarningStartsAt = (event) => {
    const deleteAt = getMediaRetentionDeleteAt(event);
    if (!deleteAt) return null;

    const tier = event.tier || "free";
    const warningHours =
        WARNING_HOURS_BY_TIER[tier] ?? WARNING_HOURS_BY_TIER.free;
    return new Date(deleteAt.getTime() - warningHours * 60 * 60 * 1000);
};

/**
 * True when the tier-derived deletion deadline has already passed.
 * @param {{ endTime?: Date|string, tier?: string }} event
 * @param {Date} [now=new Date()]
 * @returns {boolean}
 */
export const isMediaRetentionExpired = (event, now = new Date()) => {
    const deleteAt = getMediaRetentionDeleteAt(event);
    if (!deleteAt) return false;
    return now.getTime() >= deleteAt.getTime();
};
