import { Event } from "../models/eventModel.js";
import Media from "../models/mediaModel.js";

/**
 * @module services/highlightService
 * @description DB helpers for the highlight-generation pipeline. The
 * scoring + selection itself lives in
 * {@link module:services/highlightProcessor}.
 */

/** Tiers eligible for auto-highlights; free events never get them.
 *  @type {ReadonlyArray<"premium"|"pro">} */
export const PAID_TIERS = ["premium", "pro"];

const IMAGE_MEDIA_TYPES = ["image", "photo"];

// How long a "processing" row may sit before we treat it as abandoned and
// requeue it. Set well above any realistic job duration so genuinely-active
// jobs are never double-enqueued.
const STALE_PROCESSING_MS = 10 * 60 * 1000;

// Resolves the set of events that should run highlight generation now.
// "Now" means: paid tier, ended, not cancelled, and either:
//   - never started (pending)
//   - previously failed
//   - stuck in `processing` long enough to count as abandoned (e.g. worker
//     was killed mid-job and never reached its failure cleanup)
/**
 * Find paid+ended events whose highlights need (re-)generation: status is
 * pending/failed, OR stuck in "processing" past the stale cutoff.
 * @returns {Promise<Array<{ _id: import("mongoose").Types.ObjectId, eventName: string }>>}
 */
export const findEventsNeedingHighlights = async () => {
    const now = new Date();
    const staleCutoff = new Date(now.getTime() - STALE_PROCESSING_MS);
    return Event.find({
        tier: { $in: PAID_TIERS },
        // Eligible when the calculated end has passed OR the host marked
        // the event as Completed manually.
        $or: [{ endTime: { $lte: now } }, { status: "Completed" }],
        status: { $ne: "Cancelled" },
        $and: [
            {
                $or: [
                    {
                        highlightGenerationStatus: {
                            $in: ["pending", "failed"],
                        },
                    },
                    {
                        highlightGenerationStatus: "processing",
                        updatedAt: { $lt: staleCutoff },
                    },
                ],
            },
        ],
    })
        .select("_id eventName")
        .lean();
};

// Returns { eligible: boolean, reason } — used by the worker to validate the
// job at run time (a host may have toggled tier or cancelled in the meantime).
/**
 * Re-validate eligibility at worker run-time (host may have changed tier
 * or cancelled between enqueue and execution).
 * @param {string} eventId
 * @returns {Promise<{ eligible: boolean, reason: string|null, event: object|null }>}
 */
export const checkEventEligibility = async (eventId) => {
    const event = await Event.findById(eventId).select(
        "tier status endTime highlightGenerationStatus",
    );
    if (!event)
        return { eligible: false, reason: "Event not found", event: null };
    if (!PAID_TIERS.includes(event.tier)) {
        return {
            eligible: false,
            reason: `Tier ${event.tier} is not eligible`,
            event,
        };
    }
    if (event.status === "Cancelled") {
        return { eligible: false, reason: "Event was cancelled", event };
    }
    // A host who manually completes an event opens the door for highlight
    // generation even if the calculated endTime is still in the future.
    const hasEnded =
        event.status === "Completed" || new Date(event.endTime) <= new Date();
    if (!hasEnded) {
        return { eligible: false, reason: "Event has not ended yet", event };
    }
    if (event.highlightGenerationStatus === "completed") {
        return {
            eligible: false,
            reason: "Highlights already generated",
            event,
        };
    }
    return { eligible: true, reason: null, event };
};

/**
 * All non-hidden image media for an event (videos excluded).
 * @param {string} eventId
 * @returns {Promise<Array<{ _id: import("mongoose").Types.ObjectId, mediaUrl: string, mediaType: string }>>}
 */
export const loadEventImageMedia = (eventId) =>
    Media.find({
        eventId,
        mediaType: { $in: IMAGE_MEDIA_TYPES },
        isHidden: { $ne: true },
    })
        .select("_id mediaUrl mediaType")
        .lean();

const HIGHLIGHT_PERCENTAGE = 0.2;
/**
 * Number of highlights to select: ceil(20%) of the image count, minimum 1
 * when there's at least one image.
 * @param {number} totalImages
 * @returns {number}
 */
export const pickHighlightCount = (totalImages) => {
    if (totalImages <= 0) return 0;
    return Math.max(1, Math.ceil(totalImages * HIGHLIGHT_PERCENTAGE));
};

/**
 * Two-step swap: clear all isHighlight flags on the event, then set them
 * on the chosen ids. Acceptable to have a brief no-highlights window
 * because the event is already over.
 * @param {string} eventId
 * @param {string[]} mediaIds
 * @returns {Promise<void>}
 */
export const applyHighlightSelection = async (eventId, mediaIds) => {
    await Media.updateMany({ eventId }, { $set: { isHighlight: false } });
    if (mediaIds.length > 0) {
        await Media.updateMany(
            { _id: { $in: mediaIds } },
            { $set: { isHighlight: true } },
        );
    }
};

/**
 * Update the event's highlight-generation status; on "completed" also
 * stamps `highlightsGeneratedAt`.
 * @param {string} eventId
 * @param {"pending"|"processing"|"completed"|"failed"} status
 * @param {{ generatedAt?: Date }} [opts]
 * @returns {Promise<void>}
 */
export const setHighlightStatus = async (eventId, status, opts = {}) => {
    const update = { $set: { highlightGenerationStatus: status } };
    if (status === "completed") {
        update.$set.highlightsGeneratedAt = opts.generatedAt || new Date();
    }
    await Event.updateOne({ _id: eventId }, update);
};
