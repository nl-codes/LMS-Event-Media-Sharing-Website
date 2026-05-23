import mongoose from "mongoose";

/**
 * EventMembership
 * ---------------
 * Join table linking a registered User to an Event they have access to as
 * a participant (not as the host, the host relationship lives on Event.hostId).
 *
 * Relationships:
 *  - eventId → Event
 *  - userId  → User
 *  - Together (eventId, userId) is uniquely indexed; the membership service
 *    upserts on this pair, so duplicate join attempts are no-ops.
 *
 * Bookkeeping fields:
 *  - `lastSeenChatAt`  :   driven by the socket "mark_as_read" event;
 *                              powers per-event unread-chat badges in the UI.
 *  - `lastAccessedAt`  :    refreshed whenever the user touches the event
 *                              (gallery, details). Used for "recently joined"
 *                              sorting on the home feed.
 *  - `joinedAt`        :   captured once at creation; participant counts use
 *                              it for chronological listings.
 *
 * The `mongoose.models.EventMembership || ...` guard exists because this
 * schema is touched by both the API and the worker process; without it,
 * hot-reload paths could try to re-register the model and throw.
 */
const EventMembershipSchema = new mongoose.Schema(
    {
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        joinedAt: {
            type: Date,
            default: Date.now,
        },

        // Drives unread-chat badges; updated via the socket "mark_as_read" flow.
        lastSeenChatAt: {
            type: Date,
            default: null,
        },
        // Refreshed on event access, used by "recently joined" feeds.
        lastAccessedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    },
);

// One membership per (event, user). Idempotent joins rely on this.
EventMembershipSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export const EventMembership =
    mongoose.models.EventMembership ||
    mongoose.model("EventMembership", EventMembershipSchema);
