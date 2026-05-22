import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Guest
 * -----
 * An anonymous identity scoped to a single Event, created when a non-logged-in
 * visitor joins an event via QR / public link and provides a display name.
 *
 * Identity model:
 *  - `guest_id` is a uuid issued by the join controller and persisted in a
 *    per-event scoped cookie (`guest_<slug>`). It is the only credential a
 *    Guest has as there is no password or session token.
 *  - Guests cannot create Interactions (likes/comments), only Media uploads
 *    via `Media.guestId`.
 *
 * Lifecycle: Guest documents persist for the life of the event. They are
 * removed wholesale by services/eventCleanupProcessor when the Event itself
 * is deleted; media-retention cleanup does NOT remove Guest rows because the
 * Event survives retention.
 */
const guestSchema = new Schema({
    // UUID minted on join; matches the scoped cookie value.
    guest_id: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    // Display name the guest typed at join time.
    userName: {
        type: String,
        required: true,
        trim: true,
    },
    eventId: {
        type: Schema.Types.ObjectId,
        ref: "Event",
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export const Guest = mongoose.model("Guest", guestSchema);
