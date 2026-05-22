import { User } from "../models/userModel.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { generateGeneralToken } from "../utils/generateToken.js";
import { passwordRegex } from "../utils/validators.js";

/**
 * @module services/userService
 * @description End-user auth: signup, login, activation + password reset.
 * Tokens are stored hashed; only plaintext is emailed. Resend/reset are
 * capped at 3/day.
 */

/**
 * Create a pending user. Password is bcrypt-hashed; email is lowercased.
 * @param {{ userName: string, email: string, password: string }} input
 * @returns {Promise<import("mongoose").Document>} The saved User doc.
 * @throws {Error} On missing fields, duplicate email, or weak password.
 */
export const addUsers = async ({ userName, email, password }) => {
    if (!userName || !email || !password) {
        throw new Error("Missing required fields");
    }
    const emailLower = String(email).toLowerCase().trim();

    const existingUser = await User.findOne({
        email: emailLower,
    });

    if (existingUser) {
        throw new Error("User email already exists");
    }

    if (!passwordRegex.test(password)) {
        throw new Error(
            "Password must contain at least: 1 uppercase, 1 lowercase, 1 number and 1 special character",
        );
    }
    const randomSalt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, randomSalt);

    const newUser = new User({
        userName: userName,
        password: hashedPassword,
        email: emailLower,
    });

    return await newUser.save();
};

/**
 * Verify login credentials and account status.
 * @param {{ email: string, password: string }} input
 * @returns {Promise<import("mongoose").Document>} The matched User doc.
 * @throws {Error} On bad credentials, pending activation, or suspension.
 */
export const verifyUser = async ({ email, password }) => {
    if (!email || !password) {
        throw new Error("Email and Password required");
    }
    const emailLower = String(email).toLowerCase().trim();
    const existingUser = await User.findOne({ email: emailLower });

    if (!existingUser) {
        throw new Error("Invalid email or password");
    }

    const isPasswordCorrect = await bcrypt.compare(
        password,
        existingUser.password,
    );

    if (!isPasswordCorrect) {
        throw new Error("Invalid email or password");
    }

    if (existingUser.status === "pending") {
        throw new Error("Account activation pending. Check your email");
    }
    if (existingUser.status === "suspended") {
        throw new Error("Account suspended");
    }

    return existingUser;
};

/**
 * Consume a plaintext activation token: hashes it, matches the User row,
 * flips status to "active", and wipes the token + resend counters so the
 * link is one-shot.
 * @param {string} token Plaintext token from the activation email.
 * @returns {Promise<void>}
 * @throws {Error} If the token is invalid or expired.
 */
export const verifyUserActivationToken = async (token) => {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        activationToken: tokenHash,
        activationExpires: { $gt: Date.now() },
    });
    console.log(user);
    if (!user) throw new Error("Invalid or expired token");

    user.status = "active";
    user.activationToken = undefined;
    user.activationExpires = undefined;
    user.activationResendCount = undefined;
    user.activationResendLastSentAt = undefined;
    await user.save();
};

/**
 * Issue a fresh activation token for a still-pending account.
 * Rate-limited to 3 emails per calendar day.
 * @param {string} email
 * @returns {Promise<{ user: import("mongoose").Document, token: string }>}
 *   The user doc and the plaintext token for the controller to email.
 * @throws {Error} If the user is missing, already active, or over the cap.
 */
export const resendActivationToken = async (email) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found.");

    if (user.status === "active") {
        throw new Error("User is already activated.");
    }

    const now = new Date();
    const last = user.activationResendLastSentAt;

    if (last) {
        const isSameDay =
            last.getFullYear() === now.getFullYear() &&
            last.getMonth() === now.getMonth() &&
            last.getDate() === now.getDate();

        if (isSameDay && user.activationResendCount >= 3) {
            throw new Error(
                "You have reached the daily limit (3 activation emails). Try again tomorrow.",
            );
        }
    }

    const { token, tokenHash, expires } = generateGeneralToken();

    user.activationToken = tokenHash;
    user.activationExpires = expires;

    if (!last || last.toDateString() !== now.toDateString()) {
        user.activationResendCount = 1;
    } else {
        user.activationResendCount += 1;
    }

    user.activationResendLastSentAt = now;

    await user.save();

    return { user, token };
};

/**
 * Issue a one-shot password-reset token for an active account.
 * Rate-limited to 3 emails per calendar day.
 * @param {string} email
 * @returns {Promise<{ user: import("mongoose").Document, token: string }>}
 *   The user doc and plaintext token for the controller to email.
 * @throws {Error} If the user is missing, not active, or over the cap.
 */
export const requestPasswordReset = async (email) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found");

    if (user.status !== "active") {
        throw new Error("Account not active");
    }

    const now = new Date();
    const last = user.resetPasswordLastRequestedAt;

    if (last && last.toDateString() === now.toDateString()) {
        if (user.resetPasswordRequestCount >= 3) {
            throw new Error("Password reset limit reached for today");
        }
        user.resetPasswordRequestCount += 1;
    } else {
        user.resetPasswordRequestCount = 1;
    }

    const { token, tokenHash, expires } = generateGeneralToken();

    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = expires;
    user.resetPasswordLastRequestedAt = now;

    await user.save();
    return { user, token };
};

/**
 * Consume a reset token and persist a new bcrypt-hashed password. Wipes
 * the token + rate-limit bookkeeping on success.
 * @param {string} token Plaintext token from the reset email.
 * @param {string} newPassword Must satisfy passwordRegex.
 * @returns {Promise<void>}
 * @throws {Error} On invalid/expired token, password reuse, or weak password.
 */
export const resetPassword = async (token, newPassword) => {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        resetPasswordToken: tokenHash,
        resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) throw new Error("Invalid or expired token");
    if (user.password === newPassword)
        throw new Error("Can't use old password");

    if (!passwordRegex.test(password)) {
        throw new Error(
            "Password must contain at least: 1 uppercase, 1 lowercase, 1 number and 1 special character",
        );
    }

    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(newPassword, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.resetPasswordRequestCount = undefined;
    user.resetPasswordLastRequestedAt = undefined;

    await user.save();
};
