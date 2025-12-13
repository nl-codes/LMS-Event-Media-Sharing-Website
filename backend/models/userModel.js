import { model, Schema } from "mongoose";

const userSchema = new Schema(
    {
        userName: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, unique: true },
        password: { type: String, required: true, trim: true },

        status: {
            type: String,
            enum: ["pending", "active", "suspended"],
            default: "pending",
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
    },
    { timestamps: true }
);

export const User = model("User", userSchema);
