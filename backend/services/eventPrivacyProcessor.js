import { Event } from "../models/eventModel.js";
import Media from "../models/mediaModel.js";

// Worker entrypoint for the event-privacy-update queue. Cascades the event's
// current privacy to every Media doc's isPublic field.
//
// Race-safety: a host can toggle privacy faster than the worker drains. The
// job payload carries the privacy that was intended *when the job was queued*,
// but by the time it runs the host may have flipped again. We re-read the
// event at processing time and use the live value — stale jobs short-circuit
// instead of clobbering a newer toggle.
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
