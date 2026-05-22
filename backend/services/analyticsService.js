import mongoose from "mongoose";
import { User } from "../models/userModel.js";
import { Event } from "../models/eventModel.js";
import { EventMembership } from "../models/eventMembershipModel.js";
import { Guest } from "../models/guestModel.js";
import Media from "../models/mediaModel.js";
import { attachAvatars } from "../utils/attachAvatars.js";

/**
 * @module services/analyticsService
 * @description Powers platform-wide growth charts and per-event host
 * insights. All bucketing is UTC; `fillGaps` ensures dense series for the
 * chart.
 */

const RANGE_CONFIG = {
    last7days: { days: 7, granularity: "day" },
    last30days: { days: 30, granularity: "day" },
    last90days: { days: 90, granularity: "day" },
    lastYear: { days: 365, granularity: "month" },
};

const DEFAULT_RANGE = "last30days";

const resolveRange = (range) =>
    RANGE_CONFIG[range] || RANGE_CONFIG[DEFAULT_RANGE];

const startOfRange = (days) => {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - days + 1);
    return d;
};

// Build the $group stage for either day or month bucketing. $dateToString is
// used so the output is a plain string and serializes cleanly to JSON.
const buildGroupStage = (granularity) => {
    const format = granularity === "month" ? "%Y-%m" : "%Y-%m-%d";
    return {
        $group: {
            _id: {
                $dateToString: { format, date: "$createdAt", timezone: "UTC" },
            },
            count: { $sum: 1 },
        },
    };
};

// Fill missing buckets with zero so the chart line doesn't visually skip days.
const fillGaps = (buckets, daysOrWindow, granularity) => {
    const map = new Map(buckets.map((b) => [b.date, b.count]));
    const out = [];

    let from;
    let to;
    if (typeof daysOrWindow === "number") {
        from = startOfRange(daysOrWindow);
        to = new Date();
        to.setUTCHours(0, 0, 0, 0);
    } else {
        from = new Date(daysOrWindow.from);
        from.setUTCHours(0, 0, 0, 0);
        to = new Date(daysOrWindow.to);
        to.setUTCHours(0, 0, 0, 0);
    }

    if (granularity === "month") {
        const c = new Date(
            Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1),
        );
        while (c <= to) {
            const key = `${c.getUTCFullYear()}-${String(c.getUTCMonth() + 1).padStart(2, "0")}`;
            out.push({ date: key, count: map.get(key) || 0 });
            c.setUTCMonth(c.getUTCMonth() + 1);
        }
        return out;
    }

    const c = new Date(from);
    while (c <= to) {
        const key = c.toISOString().slice(0, 10);
        out.push({ date: key, count: map.get(key) || 0 });
        c.setUTCDate(c.getUTCDate() + 1);
    }
    return out;
};

const aggregateCountsOverTime = async (Model, range, filter = {}) => {
    const { days, granularity } = resolveRange(range);
    const since = startOfRange(days);

    const rows = await Model.aggregate([
        { $match: { createdAt: { $gte: since }, ...filter } },
        buildGroupStage(granularity),
        { $project: { _id: 0, date: "$_id", count: 1 } },
        { $sort: { date: 1 } },
    ]);

    return {
        granularity,
        range,
        data: fillGaps(rows, days, granularity),
    };
};

/**
 * Platform-wide user-growth chart.
 * @param {keyof typeof RANGE_CONFIG} range
 * @returns {Promise<{ granularity: string, range: string, data: Array<{date: string, count: number}> }>}
 */
export const getUserGrowth = (range) =>
    aggregateCountsOverTime(User, range, { role: "user" });

/**
 * Platform-wide event-growth chart.
 * @param {keyof typeof RANGE_CONFIG} range
 * @returns {Promise<{ granularity: string, range: string, data: Array<{date: string, count: number}> }>}
 */
export const getEventGrowth = (range) => aggregateCountsOverTime(Event, range);

/**
 * Platform-wide media-growth chart.
 * @param {keyof typeof RANGE_CONFIG} range
 * @returns {Promise<{ granularity: string, range: string, data: Array<{date: string, count: number}> }>}
 */
export const getMediaGrowth = (range) => aggregateCountsOverTime(Media, range);

// Pick daily buckets for short windows, monthly for long ones (>90 days),
// matching the thresholds used by the platform-wide ranges.
const pickGranularityForWindow = (fromDate, toDate) => {
    const ms = toDate.getTime() - fromDate.getTime();
    const days = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
    return days > 90 ? "month" : "day";
};

const aggregateMembershipsInWindow = async (eventId, from, to, granularity) => {
    const eventObjectId = new mongoose.Types.ObjectId(String(eventId));
    const format = granularity === "month" ? "%Y-%m" : "%Y-%m-%d";

    const bucketStage = (dateField) => [
        {
            $match: {
                eventId: eventObjectId,
                [dateField]: { $gte: from, $lte: to },
            },
        },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format,
                        date: `$${dateField}`,
                        timezone: "UTC",
                    },
                },
                count: { $sum: 1 },
            },
        },
        { $project: { _id: 0, date: "$_id", count: 1 } },
    ];

    const [memberRows, guestRows] = await Promise.all([
        EventMembership.aggregate(bucketStage("joinedAt")),
        Guest.aggregate(bucketStage("createdAt")),
    ]);

    const combined = new Map();
    for (const row of [...memberRows, ...guestRows]) {
        combined.set(row.date, (combined.get(row.date) || 0) + row.count);
    }
    const rows = Array.from(combined, ([date, count]) => ({ date, count }));

    return {
        granularity,
        data: fillGaps(rows, { from, to }, granularity),
    };
};

const aggregateMediaInWindow = async (eventId, from, to, granularity) => {
    const eventObjectId = new mongoose.Types.ObjectId(String(eventId));
    const format = granularity === "month" ? "%Y-%m" : "%Y-%m-%d";

    const rows = await Media.aggregate([
        {
            $match: {
                eventId: eventObjectId,
                createdAt: { $gte: from, $lte: to },
            },
        },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format,
                        date: "$createdAt",
                        timezone: "UTC",
                    },
                },
                count: { $sum: 1 },
            },
        },
        { $project: { _id: 0, date: "$_id", count: 1 } },
        { $sort: { date: 1 } },
    ]);

    return {
        granularity,
        data: fillGaps(rows, { from, to }, granularity),
    };
};

/**
 * Per-event host insights: total members + media plus daily/monthly
 * timeseries for the event's start→end window (clamped to now if live).
 * @param {string} eventId
 * @returns {Promise<{ event: object, host: object|null, totals: { members: number, media: number }, window: { from: string, to: string, granularity: string }, members: object, media: object }>}
 * @throws {Error} 404 if event missing.
 */
export const getEventInsights = async (eventId) => {
    const event = await Event.findById(eventId)
        .select("eventName hostId startTime endTime status tier")
        .populate("hostId", "userName email");
    if (!event) {
        const err = new Error("Event not found");
        err.status = 404;
        throw err;
    }

    const eventWithAvatar = await attachAvatars(event, ["hostId"]);

    // Chart window: event.startTime → min(event.endTime, now).
    // If the event hasn't started yet, the upper bound clamps to startTime so
    // we still return a valid (single-bucket) window.
    const now = new Date();
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const from = start;
    const to = end <= now ? end : now;
    const effectiveTo = to < from ? from : to;
    const granularity = pickGranularityForWindow(from, effectiveTo);

    const [members, media, registeredCount, guestCount, totalMedia] =
        await Promise.all([
            aggregateMembershipsInWindow(
                eventId,
                from,
                effectiveTo,
                granularity,
            ),
            aggregateMediaInWindow(eventId, from, effectiveTo, granularity),
            EventMembership.countDocuments({ eventId }),
            Guest.countDocuments({ eventId }),
            Media.countDocuments({ eventId }),
        ]);
    const totalMembers = registeredCount + guestCount;

    const host =
        eventWithAvatar.hostId && typeof eventWithAvatar.hostId === "object"
            ? {
                  _id: String(eventWithAvatar.hostId._id),
                  userName: eventWithAvatar.hostId.userName,
                  email: eventWithAvatar.hostId.email,
                  profilePicture: eventWithAvatar.hostId.profilePicture,
              }
            : null;

    return {
        event: {
            _id: String(event._id),
            eventName: event.eventName,
            status: event.status,
            tier: event.tier,
            startTime: event.startTime,
            endTime: event.endTime,
        },
        host,
        totals: {
            members: totalMembers,
            media: totalMedia,
        },
        window: {
            from: from.toISOString(),
            to: effectiveTo.toISOString(),
            granularity,
        },
        members,
        media,
    };
};
