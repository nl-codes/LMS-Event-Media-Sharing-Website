import crypto from "crypto";
import { AdminOtp } from "../models/adminOtpModel.js";

export const hashOtp = (email, otp) => {
    return crypto.createHash("sha256").update(`${email}${otp}`).digest("hex");
};

export const generateNumericOtp = (length = 6) => {
    return Math.floor(
        Math.pow(10, length - 1) +
            Math.random() * (Math.pow(10, length) - Math.pow(10, length - 1)),
    ).toString();
};

export const createOtpRecord = async (email, otpHash) => {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    return await AdminOtp.create({
        email,
        otpHash,
        expiresAt,
        attemptsLeft: 5,
    });
};

export const findValidOtp = async (email) => {
    return await AdminOtp.findOne({
        email,
        consumedAt: null,
        expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });
};
