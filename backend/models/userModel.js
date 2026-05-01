import { model, Schema } from "mongoose";

const userSchema = new Schema(
    {
        userName: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, unique: true },
        password: { type: String, required: true, trim: true },

        role: {
            type: String,
            enum: ["user", "admin", "superadmin"],
            default: "user",
            index: true,
        },

        status: {
            type: String,
            enum: ["pending", "active", "suspended", "banned"],
            default: "pending",
            index: true,
        },

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

        activationToken: String,
        activationExpires: Date,

        activationResendCount: {
            type: Number,
            default: 0,
        },
        activationResendLastSentAt: {
            type: Date,
        },

        resetPasswordToken: String,
        resetPasswordExpires: Date,

        resetPasswordRequestCount: {
            type: Number,
            default: 0,
        },
        resetPasswordLastRequestedAt: Date,
    },

    { timestamps: true },
);

// Prevent multiple SuperAdmins - only one superadmin allowed
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
