import mongoose from "mongoose";

/**
 * AdminOtp
 * --------
 * One-time-password ticket used during the admin/superadmin login challenge.
 * Issued by services/otpService against an email; verified by the
 * admin login controller before a session is issued.
 *
 * Security notes:
 *  - `otpHash` stores the hashed OTP, NOT the raw code. The plaintext is
 *     only ever sent via email; nothing here is enough to forge a login.
 *  - `attemptsLeft` decrements on every wrong submission;
 *     the service invalidates the ticket once it hits zero to defend against brute force.
 *  - `consumedAt` is stamped on successful verification, so even an
 *    unexpired OTP can't be reused.
 *
 * Lifecycle: documents are removed automatically by the TTL index on
 * `expiresAt` (Mongo deletes when wall-clock crosses the stored time).
 * No application-level cleanup needed.
 */
const AdminOtpSchema = new mongoose.Schema(
    {
        // Email the OTP was issued to (indexed for the "lookup my open OTP" path)
        email: { type: String, required: true, index: true },
        // Hashed OTP. Never store or accept the plaintext.
        otpHash: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        // Brute-force counter. Service invalidates the ticket on 0.
        attemptsLeft: { type: Number, default: 5 },
        // Stamped on successful verification to make the OTP single-use.
        consumedAt: { type: Date, default: null },
    },
    { timestamps: true },
);

// TTL: Mongo drops the row once `expiresAt` passes. No app cleanup needed.
AdminOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AdminOtp = mongoose.model("AdminOtp", AdminOtpSchema);
