import { Event } from "../models/eventModel.js";
import { getMediaRetentionDeleteAt } from "../utils/mediaRetention.js";

// Returns the events whose retention deadline has passed and whose media
// cleanup has not yet completed (or got stuck). The deletion deadline is
// derived from tier + endTime, so we cannot push the comparison into Mongo
// directly — we fan out a coarse query (anything that ended already) and
// filter in JS.
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

export const markRetentionStatus = async (eventId, status, extra = {}) => {
    const update = { $set: { mediaDeletionStatus: status, ...extra } };
    await Event.updateOne({ _id: eventId }, update);
};
