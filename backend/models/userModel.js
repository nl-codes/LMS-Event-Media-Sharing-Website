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

export const User = model("User", userSchema);
