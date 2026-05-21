import cloudinary from "../config/cloudinaryConfig.js";
import { Event } from "../models/eventModel.js";
import Media from "../models/mediaModel.js";
import Interaction from "../models/interactionModel.js";
import { getMediaRetentionDeleteAt } from "../utils/mediaRetention.js";
import { markRetentionStatus } from "./mediaRetentionService.js";

// Same paged-delete approach used by eventCleanupProcessor.js. We keep the
// Cloudinary folder alive for the thumbnail subfolder since the Event
// document is intentionally preserved by retention cleanup.
const purgeEventMediaFolder = async (eventId) => {
    const folder = `events/${eventId}`;
    const summary = { image: 0, video: 0 };

    for (const resourceType of ["image", "video"]) {
        let deletedTotal = 0;
        for (let i = 0; i < 50; i++) {
            try {
                const res = await cloudinary.api.delete_resources_by_prefix(
                    folder,
                    { resource_type: resourceType },
                );
                const count = Object.keys(res?.deleted || {}).length;
                deletedTotal += count;
                if (count === 0) break;
            } catch (err) {
                console.warn(
                    `[media-retention] Cloudinary delete_resources_by_prefix(${folder}, ${resourceType}) failed:`,
                    err.message,
                );
                break;
            }
        }
        summary[resourceType] = deletedTotal;
    }

    // We do NOT delete the events/<id> folder root: the thumbnail lives
    // under events/<id>/thumbnail and the Event document survives retention
    // cleanup, so its cover image should keep working.

    return summary;
};

// Worker entrypoint. Idempotent — running twice on the same event finds zero
// remaining media on the second pass and exits cleanly.
export const processMediaRetentionJob = async (job) => {
    const { eventId } = job.data;

    const event = await Event.findById(eventId);
    if (!event) {
        return { eventId, skipped: true, reason: "event-not-found" };
    }

    if (event.mediaDeletionStatus === "completed") {
        return { eventId, skipped: true, reason: "already-completed" };
    }

    const deleteAt = getMediaRetentionDeleteAt(event);
    if (!deleteAt) {
        return { eventId, skipped: true, reason: "no-delete-deadline" };
    }
    if (deleteAt.getTime() > Date.now()) {
        // Defensive: the scanner/delayed-job timing shouldn't normally let
        // this happen, but if it does we don't want to wipe early.
        return {
            eventId,
            skipped: true,
            reason: "deadline-in-future",
            deleteAt,
        };
    }

    await markRetentionStatus(eventId, "processing");

    try {
        const media = await Media.find({ eventId }).select("_id").lean();
        const mediaIds = media.map((m) => m._id);

        const interactionResult = mediaIds.length
            ? await Interaction.deleteMany({ media: { $in: mediaIds } })
            : { deletedCount: 0 };

        const mediaResult = await Media.deleteMany({ eventId });

        const cloudinarySummary = await purgeEventMediaFolder(eventId);

        await markRetentionStatus(eventId, "completed", {
            mediaDeletedAt: new Date(),
            // Highlights live on Media docs (isHighlight flag), so once the
            // Media is gone the highlight references are gone too. We also
            // reset the generation status so future automation doesn't try
            // to "re-highlight" an empty event.
            highlightGenerationStatus: "pending",
            highlightsGeneratedAt: null,
        });

        return {
            eventId,
            mediaDeleted: mediaResult.deletedCount || 0,
            interactionsDeleted: interactionResult.deletedCount || 0,
            cloudinary: cloudinarySummary,
        };
    } catch (err) {
        await markRetentionStatus(eventId, "failed");
        throw err;
    }
};
