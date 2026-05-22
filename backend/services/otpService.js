import crypto from "crypto";
import { AdminOtp } from "../models/adminOtpModel.js";

/**
 * @module services/otpService
 * @description Hashing + persistence for the admin-login OTP flow.
 * Plaintext OTPs never reach Mongo; tickets expire in 10 minutes via TTL.
 */

/**
 * Email-salted SHA-256 digest of an OTP — the value persisted on AdminOtp.
 * @param {string} email
 * @param {string} otp
 * @returns {string} hex digest
 */
export const hashOtp = (email, otp) => {
    return crypto.createHash("sha256").update(`${email}${otp}`).digest("hex");
};

/**
 * Random numeric OTP of fixed length (default 6).
 * @param {number} [length=6]
 * @returns {string}
 */
export const generateNumericOtp = (length = 6) => {
    return Math.floor(
        Math.pow(10, length - 1) +
            Math.random() * (Math.pow(10, length) - Math.pow(10, length - 1)),
    ).toString();
};

/**
 * Persist a new OTP ticket: 10-minute expiry, 5 attempts.
 * @param {string} email
 * @param {string} otpHash From {@link hashOtp}.
 * @returns {Promise<import("mongoose").Document>}
 */
export const createOtpRecord = async (email, otpHash) => {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    return await AdminOtp.create({
        email,
        otpHash,
        expiresAt,
        attemptsLeft: 5,
    });
};

/**
 * Newest open (un-consumed, un-expired) OTP for an email.
 * @param {string} email
 * @returns {Promise<import("mongoose").Document|null>}
 */
export const findValidOtp = async (email) => {
    return await AdminOtp.findOne({
        email,
        consumedAt: null,
        expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });
};
