import { model, Schema } from "mongoose";

/**
 * User
 * -----
 * Authentication identity. Every actor in the system (event host, registered
 * uploader, admin, superadmin) is a User document. Per-person attributes
 * (display name, avatar, bio) live on the related Profile document, not here.
 *
 * Relationships:
 *  - Profile (1:1) is exposed via Profile.user.
 *  - Event.hostId references this model.
 *  - Media.uploaderId, Interaction.author, Report.reporterId/verifiedBy,
 *    Appeal.userId/reviewedBy, EventMembership.userId all point here.
 *
 * Roles & access control:
 *  - "user"        :   default account.
 *  - "admin"       :   moderation surface (reports, appeals).
 *  - "superadmin"  :   singleton, enforced by the pre-save hook below.
 *
 * Lifecycle (status):
 *  - "pending"     :    signed up but email not yet verified.
 *  - "active"      :    full access.
 *  - "suspended"   :    moderation lock-out; cleared by an approved Appeal.
 *
 * Admin promotion (adminRequestStatus):
 *  - "none" → "pending" (user applies) → "approved" / "suspended" (by superadmin).
 *  - adminActionReason carries the human-readable reason for the last
 *    superadmin verdict on the request.
 */
const userSchema = new Schema(
    {
        userName: { type: String, required: true, trim: true },
        // Unique across the collection — the login identifier. Always lowercased
        // at the service layer before lookup.
        email: { type: String, required: true, trim: true, unique: true },
        // Stored as a bcrypt hash by the auth service. Never trust raw input
        // from frontend payloads; hashing is the service's responsibility.
        password: { type: String, required: true, trim: true },

        role: {
            type: String,
            enum: ["user", "admin", "superadmin"],
            default: "user",
            index: true,
        },

        status: {
            type: String,
            enum: ["pending", "active", "suspended"],
            default: "pending",
            index: true,
        },

        // Counter bumped each time the user is suspended. Surfaces in the
        // superadmin dashboard to flag repeat offenders.
        suspensionCount: {
            type: Number,
            default: 0,
        },

        adminRequestStatus: {
            type: String,
            enum: ["none", "pending", "approved", "suspended"],
            default: "none",
            index: true,
        },
        adminActionReason: {
            type: String,
            default: "",
        },

        // Email-activation token (sent at signup). Cleared by the auth service
        // once the user clicks through. Expiry is enforced in code, not via TTL,
        // because we still want the document to survive after expiry.
        activationToken: String,
        activationExpires: Date,

        // Rate-limit bookkeeping for activation-email resends.
        activationResendCount: {
            type: Number,
            default: 0,
        },
        activationResendLastSentAt: {
            type: Date,
        },

        // Forgot-password token (one-shot, time-boxed). Cleared on use.
        resetPasswordToken: String,
        resetPasswordExpires: Date,

        // Rate-limit bookkeeping for forgot-password requests.
        resetPasswordRequestCount: {
            type: Number,
            default: 0,
        },
        resetPasswordLastRequestedAt: Date,
    },

    { timestamps: true },
);

/**
 * Enforces the singleton SuperAdmin invariant. Rotating the SuperAdmin
 * password is supported, but creating or upgrading a second SuperAdmin is
 * refused at the model layer so it can't slip past via a stray service call.
 */
userSchema.pre("save", async function (next) {
    // Only validate when creating or updating role to superadmin
    if (this.role === "superadmin") {
        // Check if this is a new document (create)
        if (this.isNew) {
            const existingSuperAdmin = await User.findOne({
                role: "superadmin",
            });
            if (existingSuperAdmin) {
                throw new Error(
                    "A SuperAdmin already exists. Only one SuperAdmin is allowed. Use password rotation to change SuperAdmin password.",
                );
            }
        } else if (this.isModified("role")) {
            // Prevent changing a user's role to superadmin if one already exists
            const existingSuperAdmin = await User.findOne({
                role: "superadmin",
                _id: { $ne: this._id }, // Exclude current user
            });
            if (existingSuperAdmin) {
                throw new Error(
                    "A SuperAdmin already exists. Only one SuperAdmin is allowed.",
                );
            }
        }
    }

    next();
});

export const User = model("User", userSchema);
