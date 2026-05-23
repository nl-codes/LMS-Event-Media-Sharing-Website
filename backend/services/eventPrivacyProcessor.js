import { Event } from "../models/eventModel.js";
import Media from "../models/mediaModel.js";

/**
 * @module services/eventPrivacyProcessor
 * @description BullMQ worker that cascades Event.privacy to each Media's
 * `isPublic`. Race-safe via a stale-job check against the live event.
 */

/**
 * Worker entrypoint. Re-reads event privacy at run time and short-circuits
 * if the job is stale (host toggled privacy again before this job ran).
 * @param {import("bullmq").Job<{ eventId: string, targetIsPublic: boolean }>} job
 * @returns {Promise<{ eventId: string, skipped?: boolean, reason?: string, targetIsPublic?: boolean, matchedCount?: number, modifiedCount?: number, currentPrivacy?: string }>}
 */
export const processEventPrivacyJob = async (job) => {
    const { eventId, targetIsPublic } = job.data;

    const event = await Event.findById(eventId).select("privacy");
    if (!event) {
        return {
            eventId,
            skipped: true,
            reason: "Event not found",
        };
    }

    const currentTargetIsPublic = event.privacy === "public";
    if (currentTargetIsPublic !== targetIsPublic) {
        return {
            eventId,
            skipped: true,
            reason: "Stale privacy job",
            currentPrivacy: event.privacy,
        };
    }

    const result = await Media.updateMany(
        { eventId },
        { $set: { isPublic: currentTargetIsPublic } },
    );

    return {
        eventId,
        targetIsPublic: currentTargetIsPublic,
        matchedCount: result.matchedCount ?? 0,
        modifiedCount: result.modifiedCount ?? 0,
    };
};
