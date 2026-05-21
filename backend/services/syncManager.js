import mongoose from "mongoose";
import { Event } from "../models/eventModel.js";
import { EventMembership } from "../models/eventMembershipModel.js";
import { Guest } from "../models/guestModel.js";
import { getTierLimits } from "../constants/tierLimits.js";
import { findEventsNeedingHighlights } from "./highlightService.js";
import { enqueueHighlightJob } from "../queues/highlightQueue.js";

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
                uploadLimit: getTierLimits("free").maxFiles,
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

// Enqueue highlight generation for any paid event that has ended but never
// had a successful pass. Idempotent thanks to highlightGenerationStatus +
// the BullMQ jobId based on eventId.
export const enqueueHighlightBacklog = async () => {
    try {
        const events = await findEventsNeedingHighlights();
        let queued = 0;
        for (const ev of events) {
            console.log(`"${ev.eventName}" has been queued for highlight`);
            try {
                await enqueueHighlightJob({ eventId: String(ev._id) });
                queued++;
            } catch (err) {
                console.warn(
                    `[highlight] failed to enqueue ${ev._id}:`,
                    err.message,
                );
            }
        }
        return { name: "highlightBacklog", matched: events.length, queued };
    } catch (err) {
        console.warn("[highlight] backlog scan failed:", err.message);
        return { name: "highlightBacklog", error: err.message };
    }
};

export const runStartupSync = async () => {
    const now = new Date();
    const results = [];

    results.push(await syncCompletedEvents(now));
    results.push(await syncExpiredEventUpgrades(now));
    results.push(await syncEventParticipantCounts());
    results.push(await enqueueHighlightBacklog());

    console.table(results);
    return results;
};
