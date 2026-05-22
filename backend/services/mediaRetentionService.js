import { Event } from "../models/eventModel.js";
import { getMediaRetentionDeleteAt } from "../utils/mediaRetention.js";

/**
 * @module services/mediaRetentionService
 * @description Helpers for the media-retention queue. Pairs with the
 * processor and BullMQ wiring in queues/mediaRetentionQueue.js.
 */

/**
 * Events whose tier-derived deletion deadline has passed and whose
 * cleanup status is still active/queued/failed. Coarse Mongo query +
 * JS filter (because deleteAt is computed, not stored).
 * @param {Date} [now=new Date()]
 * @returns {Promise<Array<{ _id: import("mongoose").Types.ObjectId, eventName: string, tier: string, endTime: Date, mediaDeletionStatus: string }>>}
 */
export const findEventsNeedingMediaDeletion = async (now = new Date()) => {
    const candidates = await Event.find({
        endTime: { $lte: now },
        mediaDeletionStatus: { $in: ["active", "queued", "failed"] },
    })
        .select("_id eventName tier endTime mediaDeletionStatus")
        .lean();

    return candidates.filter((event) => {
        const deleteAt = getMediaRetentionDeleteAt(event);
        if (!deleteAt) return false;
        return deleteAt.getTime() <= now.getTime();
    });
};

/**
 * Persist a new retention status on an event row, optionally with extra
 * fields (e.g. `mediaDeletedAt` on completion).
 * @param {string} eventId
 * @param {"active"|"queued"|"processing"|"completed"|"failed"} status
 * @param {object} [extra] Extra `$set` fields to merge in.
 * @returns {Promise<void>}
 */
export const markRetentionStatus = async (eventId, status, extra = {}) => {
    const update = { $set: { mediaDeletionStatus: status, ...extra } };
    await Event.updateOne({ _id: eventId }, update);
};
