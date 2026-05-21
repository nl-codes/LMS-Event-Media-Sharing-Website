const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;

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

export const isEventFinished = (event) => {
    if (!event) return false;
    if (event.status === "Completed" || event.status === "Cancelled") {
        return true;
    }
    const end = new Date(event.endTime).getTime();
    return Number.isFinite(end) && end < Date.now();
};
