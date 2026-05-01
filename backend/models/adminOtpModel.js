import mongoose from "mongoose";

const AdminOtpSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, index: true },
        otpHash: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        attemptsLeft: { type: Number, default: 5 },
        consumedAt: { type: Date, default: null },
    },
    { timestamps: true },
);

AdminOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AdminOtp = mongoose.model("AdminOtp", AdminOtpSchema);
