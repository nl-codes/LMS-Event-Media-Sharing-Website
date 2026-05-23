import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Media
 * -----
 * A single uploaded asset (photo or video) tied to an Event. Created by
 * services/mediaService.uploadMultipleMedia after Cloudinary upload succeeds.
 *
 * Relationships:
 *  - eventId → Event (the owner; cleanup follows the event).
 *  - Exactly one of `uploaderId` (registered User) or `guestId` (anonymous
 *    Guest) is populated. Both null implies a legacy/system upload.
 *  - Interaction.media back-references this model.
 *
 * Storage:
 *  - `mediaUrl` is the public Cloudinary URL.
 *  - `publicId` is the Cloudinary asset identifier used to issue deletes
 *    on retention cleanup, host delete, or report-driven removal.
 *
 * `mediaType` is a lowercase enum. "photo" and "image" are aliases,
 *  the upload path mostly produces "image"; older rows persist "photo".
 *
 * Flags (host/moderator-controlled, never client-trusted):
 *  - isHighlight   :     set by the highlight worker or by a host manually.
 *  - isHidden      :     moderation flag set by reportService when an admin
 *                          verifies an abuse report against this media.
 *  - isPublic      :     mirrors the parent event's privacy flag, synced by
 *                  the event-privacy queue when a host flips privacy.
 *  - hiddenReason carries the admin's note for `isHidden = true`.
 *
 * `label` is an optional host-curated caption (e.g. shown in the gallery).
 */
const mediaSchema = new Schema({
    eventId: {
        type: Schema.Types.ObjectId,
        ref: "Event",
        required: true,
    },
    // Registered user uploader. Null when the upload came from a Guest.
    uploaderId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    // Anonymous-guest uploader. Null when the upload came from a registered user.
    guestId: {
        type: Schema.Types.ObjectId,
        ref: "Guest",
        default: null,
    },
    // Public Cloudinary URL what the frontend renders.
    mediaUrl: {
        type: String,
        required: true,
    },
    // Cloudinary asset id required for issuing destroy calls on cleanup.
    publicId: {
        type: String,
        required: true,
    },
    mediaType: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        enum: ["photo", "video", "image"],
        message: "{VALUE} is not a supported media type",
    },
    isHighlight: {
        type: Boolean,
        default: false,
    },
    // Moderation flag — set true to hide from galleries without deletion.
    isHidden: {
        type: Boolean,
        default: false,
        index: true,
    },
    // Mirrors parent Event.privacy; kept on each Media row so the explore
    // feed can use the compound index below without joining.
    isPublic: {
        type: Boolean,
        default: false,
        index: true,
    },
    hiddenReason: {
        type: String,
        default: "",
    },
    label: {
        type: String,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Explore feed scans newest-first across all public, non-hidden media. A
// compound index on (isPublic, createdAt) makes that scan an index-only walk.
mediaSchema.index({ isPublic: 1, createdAt: -1 });

const Media = mongoose.model("Media", mediaSchema);
export default Media;
