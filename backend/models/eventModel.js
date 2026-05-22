import mongoose from "mongoose";
import crypto from "crypto";
import {
    getMediaRetentionDeleteAt,
    getMediaRetentionWarningStartsAt,
} from "../utils/mediaRetention.js";

/**
 * Event
 * -----
 * The central aggregate of the system. An Event owns its Media, Guests,
 * EventMemberships, ChatMessages, and Highlight selection.
 *
 * Relationships:
 *  - hostId → User (the only account allowed to mutate the event).
 *  - Media.eventId, Guest.eventId, EventMembership.eventId, ChatMessage.eventId
 *    all back-reference this model.
 *
 * Timeline & tier:
 *  - `startTime` is host-supplied; `endTime` is derived from `startTime + tier`
 *    by utils/eventDuration.calculateEventEndTime and is NOT trusted from the
 *    client. After the event has started, `startTime` is locked too.
 *  - Tier durations: free 24h, premium 1w, pro 1mo.
 *  - `tier` only changes via the payment/upgrade flow; the event-edit route
 *    rejects tier/endTime mutations.
 *  - `isPremium` is a legacy boolean kept in sync with `tier !== "free"` by
 *    the payment controller; prefer `tier` in new code.
 *  - `expiresAt` is the *paid-tier* expiry (when premium reverts to free),
 *    NOT the media-retention deadline. See `mediaRetentionDeleteAt` for that.
 *
 * Status lifecycle:
 *  - "Active"      :   host-controllable; the event runs against its calculated endTime.
 *  - "Completed"   :   set by the host (Finish Event) or by syncManager when
 *                          endTime passes. Closes uploads.
 *  - "Cancelled"   :   set by the host; closes uploads and disqualifies the
 *                          event from auto-highlights.
 *
 * Highlight generation (paid tiers only):
 *  - `highlightGenerationStatus` is driven by the highlight queue worker;
 *    services should treat anything other than "completed" as transient.
 *  - `highlightsGeneratedAt` is stamped on success and used by the UI to
 *    decide when highlights are stable to render.
 *
 * Media retention bookkeeping:
 *  - `mediaDeletionStatus` is owned by queues/mediaRetentionQueue.js. Hosts
 *    should not set it directly.
 *  - `mediaDeletedAt` is stamped when the retention worker finishes. The
 *    Event document itself is preserved after retention runs; only Media,
 *    Interactions, and Cloudinary assets are wiped.
 *  - `mediaRetentionDeleteAt` and `mediaRetentionWarningStartsAt` are
 *    computed virtuals — see below.
 *
 * Privacy:
 *  - "private" — media stays inside the event gallery.
 *  - "public"  — media may surface on the explore feed (subject to per-media
 *                isHidden / isPublic flags maintained by mediaService).
 *
 * Other persisted state:
 *  - `uniqueSlug` is the short, URL-safe public identifier used by the
 *    guest-facing /events/<slug> routes. Generated in the pre-save hook.
 *  - `uploadLimit` mirrors the tier cap and is consulted by mediaService at
 *    upload time.
 *  - `participantCount` is maintained by syncManager.syncEventParticipantCounts
 *    (members + guests); do not bump from request handlers.
 */
const EventSchema = new mongoose.Schema(
    {
        hostId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        eventName: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        location: {
            type: String,
            required: true,
        },

        // Host-supplied event start. Locked once `now >= startTime`.
        startTime: {
            type: Date,
            required: true,
        },
        // Derived from tier + startTime by utils/eventDuration. Never accept
        // this from a client payload
        endTime: {
            type: Date,
            required: true,
        },

        // Short hex slug for public links. Populated by the pre-save hook.
        uniqueSlug: {
            type: String,
            unique: true,
            index: true,
        },

        status: {
            type: String,
            enum: ["Active", "Completed", "Cancelled"],
            default: "Active",
        },
        // Legacy mirror of `tier !== "free"`. Kept for backwards compat;
        // prefer `tier` in new code.
        isPremium: {
            type: Boolean,
            default: false,
        },
        tier: {
            type: String,
            enum: ["free", "premium", "pro"],
            default: "free",
        },
        // Paid-tier validity window (when premium reverts to free). NOT the
        // media-retention deadline — see mediaRetentionDeleteAt virtual.
        expiresAt: {
            type: Date,
            default: null,
        },
        // Tier cap on total uploaded files. Mirrors tierLimits.
        uploadLimit: {
            type: Number,
            default: 100,
        },
        thumbnail: {
            type: String,
            default: "",
        },

        // Maintained by syncManager — do not mutate from controllers.
        participantCount: {
            type: Number,
            default: 0,
        },
        privacy: {
            type: String,
            enum: ["public", "private"],
            default: "private",
        },
        // Stamped by the highlight worker when generation succeeds.
        highlightsGeneratedAt: {
            type: Date,
            default: null,
        },
        // Owned by the highlight queue/worker.
        highlightGenerationStatus: {
            type: String,
            enum: ["pending", "processing", "completed", "failed"],
            default: "pending",
        },

        // Owned by the media-retention queue/worker (see
        // queues/mediaRetentionQueue.js). The Event survives retention
        // cleanup; only its associated Media/Interactions/Cloudinary
        // assets are wiped.
        mediaDeletionStatus: {
            type: String,
            enum: ["active", "queued", "processing", "completed", "failed"],
            default: "active",
            index: true,
        },
        // Stamped on successful retention run.
        mediaDeletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        // Virtuals must serialize so `mediaRetentionDeleteAt` /
        // `mediaRetentionWarningStartsAt` / `isLive` / `isUpcoming` reach the
        // frontend without each controller having to opt in.
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
        id: false,
    },
);

/**
 * MIDDLEWARE: Generate unique slug before saving
 */
EventSchema.pre("save", function (next) {
    if (!this.uniqueSlug) {
        this.uniqueSlug = crypto.randomBytes(4).toString("hex");
    }
    next();
});

/**
 * VIRTUAL: Check if event is currently "Live"
 */
EventSchema.virtual("isLive").get(function () {
    const now = new Date();
    return (
        this.status === "Active" && now >= this.startTime && now <= this.endTime
    );
});

/**
 * VIRTUAL: Check if event is in the "Wait" period (Before Start)
 */
EventSchema.virtual("isUpcoming").get(function () {
    return new Date() < this.startTime;
});

/**
 * VIRTUAL: Computed deletion deadline for this event's media. Derived from
 * tier + endTime so changing either flows through without a migration.
 */
EventSchema.virtual("mediaRetentionDeleteAt").get(function () {
    return getMediaRetentionDeleteAt(this);
});

/**
 * VIRTUAL: When the host-facing deletion-warning UI should start showing.
 */
EventSchema.virtual("mediaRetentionWarningStartsAt").get(function () {
    return getMediaRetentionWarningStartsAt(this);
});

export const Event = mongoose.model("Event", EventSchema);
