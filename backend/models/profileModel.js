import { model, Schema } from "mongoose";

/**
 * Profile
 * -------
 * Per-User display metadata kept separate from the auth-critical User doc
 * so we never accidentally leak password/token fields when surfacing a
 * profile to clients.
 *
 * Relationship: 1:1 with User via `user` (unique-indexed). The Profile is
 * created lazily by the profile service on first access if missing.
 *
 * `profilePicture` is a Cloudinary URL; the `attachAvatars` util in
 * utils/attachAvatars.js fans this in onto populated host/uploader objects
 * served by other endpoints.
 */
const profileSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            // Hard 1:1: duplicate profile rows would break attachAvatars.
            unique: true,
        },
        firstName: { type: String, trim: true, default: "" },
        lastName: { type: String, trim: true, default: "" },
        bio: { type: String, trim: true, default: "" },
        // Cloudinary URL; empty string means "use default avatar" on the UI.
        profilePicture: { type: String, default: "" },
        gender: {
            type: String,
            enum: ["male", "female", "other", ""],
            default: "",
        },
        country: { type: String, trim: true, default: "" },
    },
    { timestamps: true },
);

export const Profile = model("Profile", profileSchema);
