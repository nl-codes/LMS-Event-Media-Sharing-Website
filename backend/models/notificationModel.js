import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Notification
 * ------------
 * In-app message addressed to a single User. The bell-icon feed lists these
 * newest-first, filtered by read state.
 *
 * Relationship: recipientId → User. Notifications are never multi-recipient;
 * fan-out happens at the service layer (one row per target).
 *
 * Type vocabulary (drives the icon/colour the UI picks):
 *  - "report_filed"        :   sent to admins on a new report.
 *  - "report_verified"     :   sent to the reporter when their report is upheld.
 *  - "report_dismissed"    :   sent to the reporter when their report is dropped.
 *  - "media_hidden"        :   sent to a media owner whose upload was hidden.
 *  - "comment_deleted"     :   sent to a comment author whose comment was removed.
 *  - "user_suspended"      :   sent to the suspended user explaining the action.
 *  - "event_invite"        :   sent when a host invites a registered user to
 *                              view/join an event.
 *  - "event_suspended"     :   sent to an event host when admin moderation
 *                              cancels/suspends their event.
 *  - "event_ended"         :   sent to registered event participants when
 *                              the event gallery becomes a completed archive.
 *  - "system"              :   generic catch-all (default).
 *
 * `link` is an optional in-app route (e.g. `/home/events/...`) the UI uses
 * to make the notification clickable.
 *
 * The `(recipientId, isRead, createdAt:-1)` compound index supports the
 * dominant query: "fetch unread (or all) notifications for me, newest first."
 */
const notificationSchema = new Schema(
    {
        recipientId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: [
                "report_filed",
                "report_verified",
                "report_dismissed",
                "media_hidden",
                "comment_deleted",
                "user_suspended",
                "event_invite",
                "event_suspended",
                "event_ended",
                "system",
            ],
            default: "system",
        },
        link: {
            type: String,
            default: "",
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    { timestamps: true },
);

// Bell-icon feed: per-user, optionally filtered by read state, newest first.
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
