// Media retention is separate from the upload-window duration: it controls
// how long uploaded media stays in storage after the event has ended.
//
// Retention starts at event.endTime (NOT host-finish time) so a host who
// finishes early doesn't accidentally accelerate deletion. The warning
// window opens close to the deletion deadline so hosts have time to
// download anything they want to keep.

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Days from endTime to deletion. Premium/Pro use calendar-month addition
// downstream — only Free is expressible as a fixed-day duration.
export const FREE_RETENTION_DAYS = 7;

// Hours of warning the host gets before deletion lands.
const WARNING_HOURS_BY_TIER = {
    free: 24,
    premium: 48,
    pro: 72,
};

const addCalendarMonths = (date, months) => {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
};

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

export const getMediaRetentionWarningStartsAt = (event) => {
    const deleteAt = getMediaRetentionDeleteAt(event);
    if (!deleteAt) return null;

    const tier = event.tier || "free";
    const warningHours =
        WARNING_HOURS_BY_TIER[tier] ?? WARNING_HOURS_BY_TIER.free;
    return new Date(deleteAt.getTime() - warningHours * 60 * 60 * 1000);
};

export const isMediaRetentionExpired = (event, now = new Date()) => {
    const deleteAt = getMediaRetentionDeleteAt(event);
    if (!deleteAt) return false;
    return now.getTime() >= deleteAt.getTime();
};
