import mongoose from "mongoose";
import { User } from "../models/userModel.js";
import { Event } from "../models/eventModel.js";
import { EventMembership } from "../models/eventMembershipModel.js";
import { Guest } from "../models/guestModel.js";
import Media from "../models/mediaModel.js";
import { attachAvatars } from "../utils/attachAvatars.js";

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
const fillGaps = (buckets, days, granularity) => {
    const map = new Map(buckets.map((b) => [b.date, b.count]));
    const out = [];
    const cursor = startOfRange(days);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (granularity === "month") {
        // Walk by month from the start until we pass "today".
        const c = new Date(
            Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), 1),
        );
        while (c <= today) {
            const key = `${c.getUTCFullYear()}-${String(c.getUTCMonth() + 1).padStart(2, "0")}`;
            out.push({ date: key, count: map.get(key) || 0 });
            c.setUTCMonth(c.getUTCMonth() + 1);
        }
        return out;
    }

    const c = new Date(cursor);
    while (c <= today) {
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

export const getUserGrowth = (range) =>
    aggregateCountsOverTime(User, range, { role: "user" });
export const getEventGrowth = (range) => aggregateCountsOverTime(Event, range);
export const getMediaGrowth = (range) => aggregateCountsOverTime(Media, range);

const aggregateMembershipsForEvent = async (eventId, range) => {
    const { days, granularity } = resolveRange(range);
    const since = startOfRange(days);
    const eventObjectId = new mongoose.Types.ObjectId(String(eventId));
    const format = granularity === "month" ? "%Y-%m" : "%Y-%m-%d";

    const bucketStage = (dateField) => [
        { $match: { eventId: eventObjectId, [dateField]: { $gte: since } } },
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
        range,
        data: fillGaps(rows, days, granularity),
    };
};

export const getEventInsights = async (eventId, range) => {
    const event = await Event.findById(eventId)
        .select("eventName hostId startTime endTime status tier")
        .populate("hostId", "userName email");
    if (!event) {
        const err = new Error("Event not found");
        err.status = 404;
        throw err;
    }

    const eventWithAvatar = await attachAvatars(event, ["hostId"]);

    const [members, media, registeredCount, guestCount, totalMedia] =
        await Promise.all([
            aggregateMembershipsForEvent(eventId, range),
            aggregateCountsOverTime(Media, range, {
                eventId: new mongoose.Types.ObjectId(String(eventId)),
            }),
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
        members,
        media,
    };
};
