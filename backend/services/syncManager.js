import mongoose from "mongoose";
import { Event } from "../models/eventModel.js";
import { EventMembership } from "../models/eventMembershipModel.js";
import { Guest } from "../models/guestModel.js";
import { getTierLimits } from "../constants/tierLimits.js";
import { findEventsNeedingHighlights } from "./highlightService.js";
import { enqueueHighlightJob } from "../queues/highlightQueue.js";
import { findEventsNeedingMediaDeletion } from "./mediaRetentionService.js";
import { enqueueMediaRetentionJob } from "../queues/mediaRetentionQueue.js";

/**
 * @module services/syncManager
 * @description Periodic event-lifecycle reconciliation. Runs at boot via
 * {@link runStartupSync} and on the 5-minute event-sync tick. All
 * helpers are idempotent.
 */

const toObjectId = (value) => {
    if (!value) return null;
    new mongoose.Types.ObjectId(String(value));
};

/**
 * Flip Active events whose endTime has passed to Completed.
 * @param {Date} [now=new Date()]
 * @returns {Promise<{ name: string, matchedCount: number, modifiedCount: number }>}
 */
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

/**
 * Revert premium events whose `expiresAt` has passed back to free and
 * reset their uploadLimit.
 * @param {Date} [now=new Date()]
 * @returns {Promise<{ name: string, matchedCount: number, modifiedCount: number }>}
 */
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

/**
 * Recompute `Event.participantCount` (registered members + guests) for
 * every event, zeroing out those with no participants.
 * @returns {Promise<{ name: string, matchedCount: number, modifiedCount: number }>}
 */
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

/**
 * Enqueue highlight-generation jobs for any paid+ended events that need
 * them. Idempotent via highlightGenerationStatus + jobId.
 * @returns {Promise<{ name: string, matched?: number, queued?: number, error?: string }>}
 */
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

/**
 * Enqueue media-retention cleanup for events past their tier-derived
 * deletion deadline. Idempotent via mediaDeletionStatus.
 * @returns {Promise<{ name: string, matched?: number, queued?: number, error?: string }>}
 */
export const enqueueMediaRetentionBacklog = async () => {
    try {
        const events = await findEventsNeedingMediaDeletion();
        let queued = 0;
        for (const ev of events) {
            try {
                await enqueueMediaRetentionJob({ eventId: String(ev._id) });
                queued++;
            } catch (err) {
                console.warn(
                    `[media-retention] failed to enqueue ${ev._id}:`,
                    err.message,
                );
            }
        }
        return { name: "mediaRetentionBacklog", matched: events.length, queued };
    } catch (err) {
        console.warn("[media-retention] backlog scan failed:", err.message);
        return { name: "mediaRetentionBacklog", error: err.message };
    }
};

/**
 * Boot-time reconciliation. Runs every helper above in order and logs a
 * table summary.
 * @returns {Promise<object[]>}
 */
export const runStartupSync = async () => {
    const now = new Date();
    const results = [];

    results.push(await syncCompletedEvents(now));
    results.push(await syncExpiredEventUpgrades(now));
    results.push(await syncEventParticipantCounts());
    results.push(await enqueueHighlightBacklog());
    results.push(await enqueueMediaRetentionBacklog());

    console.table(results);
    return results;
};
