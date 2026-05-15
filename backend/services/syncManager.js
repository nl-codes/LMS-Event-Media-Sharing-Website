import mongoose from "mongoose";
import { Event } from "../models/eventModel.js";
import { EventMembership } from "../models/eventMembershipModel.js";
import { Guest } from "../models/guestModel.js";
import Media from "../models/mediaModel.js";

const DEFAULT_FREE_EVENT_LIMIT = 100;

const toObjectId = (value) => {
    if (!value) return null;
    new mongoose.Types.ObjectId(String(value));
};

export const syncCompletedEvents = async (now = new Date()) => {
    const result = await Event.updateMany(
        {
            status: "Active",
            endTime: { $lt: now },
        },
        {
            $set: {
                status: "Completed",
            },
        },
    );

    return {
        name: "completedEvents",
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
    };
};

export const syncExpiredEventUpgrades = async (now = new Date()) => {
    const result = await Event.updateMany(
        {
            isPremium: true,
            expiresAt: { $lt: now },
        },
        {
            $set: {
                isPremium: false,
                tier: "free",
                expiresAt: null,
                uploadLimit: DEFAULT_FREE_EVENT_LIMIT,
            },
        },
    );

    return {
        name: "expiredEventUpgrades",
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
    };
};

const getCountsByEvent = async (Model) => {
    const counts = await Model.aggregate([
        {
            $group: {
                _id: "$eventId",
                count: { $sum: 1 },
            },
        },
    ]);

    return counts.reduce((map, item) => {
        map.set(String(item._id), item.count);
        return map;
    }, new Map());
};

export const syncEventParticipantCounts = async () => {
    const [memberCounts, guestCounts] = await Promise.all([
        getCountsByEvent(EventMembership),
        getCountsByEvent(Guest),
    ]);

    const eventIds = new Set([...memberCounts.keys(), ...guestCounts.keys()]);
    const operations = [...eventIds].map((eventId) => ({
        updateOne: {
            filter: { _id: toObjectId(eventId) },
            update: {
                $set: {
                    participantCount:
                        (memberCounts.get(eventId) || 0) +
                        (guestCounts.get(eventId) || 0),
                },
            },
        },
    }));

    const bulkResult =
        operations.length > 0
            ? await Event.bulkWrite(operations, { ordered: false })
            : null;

    const ids = [...eventIds].map(toObjectId);
    const zeroResult = await Event.updateMany(
        ids.length > 0
            ? { _id: { $nin: ids }, participantCount: { $ne: 0 } }
            : { participantCount: { $ne: 0 } },
        { $set: { participantCount: 0 } },
    );

    return {
        name: "eventParticipantCounts",
        matchedCount: (bulkResult?.matchedCount || 0) + zeroResult.matchedCount,
        modifiedCount:
            (bulkResult?.modifiedCount || 0) + zeroResult.modifiedCount,
    };
};

export const syncMediaLikesCounts = async () => {
    const result = await Media.updateMany({}, [
        {
            $set: {
                likesCount: {
                    $size: {
                        $ifNull: ["$likedBy", []],
                    },
                },
            },
        },
    ]);

    return {
        name: "mediaLikesCounts",
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
    };
};

export const runStartupSync = async () => {
    const now = new Date();
    const results = [];

    results.push(await syncCompletedEvents(now));
    results.push(await syncExpiredEventUpgrades(now));
    results.push(await syncEventParticipantCounts());
    results.push(await syncMediaLikesCounts());

    console.table(results);
    return results;
};
