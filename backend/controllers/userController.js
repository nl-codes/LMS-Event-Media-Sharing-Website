/**
 * @module controllers/userController
 * @description HTTP layer for end-user auth (signup, login, activation,
 * password reset), the unsuspension appeal entrypoint, and the `getMe`
 * session probe. Email side-effects use {@link module:utils/sendEmail};
 * templates live in {@link module:utils/longText}.
 */

import {
    addUsers,
    requestPasswordReset,
    resendActivationToken,
    resetPassword,
    verifyUser,
    verifyUserActivationToken,
} from "../services/userService.js";
import { User } from "../models/userModel.js";
import { Profile } from "../models/profileModel.js";
import { createNotification } from "../services/notificationService.js";
import { createAppeal } from "../services/appealService.js";
import { generateGeneralToken } from "../utils/generateToken.js";
import { generateJWTtoken } from "../utils/auth/generateJWTtoken.js";
import {
    getActivationEmailHTML,
    getPasswordResetEmailHTML,
    getReactivationEmailHTML,
} from "../utils/longText.js";
import sendEmail from "../utils/sendEmail.js";
import { getAuthCookieOptions } from "../utils/auth/cookieAuth.js";

/**
 * POST /users/signup
 *
 * Create a pending account and email an activation link. In `development`
 * the activation is short-circuited (status flipped to "active" immediately)
 * so seeding a local DB doesn't require working SMTP.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const registerUser = async (req, res) => {
    try {
        const registeredUser = await addUsers(req.body);
        // Plaintext `token` is what we email; only `tokenHash` is persisted.
        const { token, tokenHash, expires } = generateGeneralToken();
        registeredUser.activationToken = tokenHash;
        registeredUser.activationExpires = expires;
        registeredUser.status = "pending";

        await registeredUser.save();

        const testMode = process.env.NODE_ENV === "development";
        if (testMode) {
            // Dev convenience: skip the email roundtrip entirely.
            registeredUser.status = "active";
            await registeredUser.save();
        } else {
            const activationUrl = `${process.env.FRONTEND_URL}/signup/activate?token=${token}`;

            await sendEmail(
                registeredUser.email,
                "Activate your account",
                `Your activation link: ${activationUrl}`,
                getActivationEmailHTML(activationUrl),
            );
        }

        res.status(201).json({
            message: "Signup successful. Check email to activate account.",
        });
    } catch (err) {
        let status = 400;
        if (err.message === "Missing required fields") {
            status = 404;
        }
        console.error("❌ Error registering user: ", err);
        res.status(status).json({ error: err.message });
    }
};

/**
 * POST /users/login
 *
 * Verify credentials, issue a JWT, and set it on a same-site httpOnly
 * cookie. The cookie carries the user's avatar URL so the topbar can
 * render without a follow-up profile fetch.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const loginUser = async (req, res) => {
    try {
        const loginUser = await verifyUser(req.body);
        // Single Profile lookup so the JWT payload can carry profilePicture
        // — avoids a second roundtrip from the frontend topbar on load.
        const profile = await Profile.findOne({ user: loginUser._id })
            .select("profilePicture")
            .lean();
        const token = generateJWTtoken({
            email: loginUser.email,
            userName: loginUser.userName,
            role: "user",
            id: loginUser._id,
            profilePicture: profile?.profilePicture || "",
        });
        res.cookie("token", token, {
            ...getAuthCookieOptions(),
            maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day (adjust as needed)
        });
        res.status(200).json({ message: "Login Successful" });
    } catch (err) {
        let status = 400;
        if (
            err.message === "Account activation pending. Check your email" ||
            err.message === "Account suspended"
        ) {
            status = 403;
        }
        console.error("❌ Error on login: ", err.message);
        res.status(status).json({ error: err.message });
    }
};

/**
 * GET /users/activate?token=...
 *
 * Consume an activation token from the signup email and flip the account
 * to "active". The link is one-shot; the service wipes the token on success.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const activateUser = async (req, res) => {
    const { token } = req.query;
    try {
        if (!token || token == "") {
            throw new Error("Token required");
        }
        await verifyUserActivationToken(token);
        res.json({ message: "Account activated. You can now log in." });
    } catch (err) {
        console.error("❌ Error on activation: ", err);
        res.status(400).json({ error: err.message });
    }
};

/**
 * POST /users/reactivate
 *
 * Re-issue the activation link for a still-pending account. Service caps
 * resends at 3 per UTC day.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const reactivateUser = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) throw new Error("Email is required.");

        const { user, token } = await resendActivationToken(email);

        const activationUrl = `${process.env.FRONTEND_URL}/signup/activate?token=${token}`;

        await sendEmail(
            user.email,
            "Activate Your Account — Link Resent",
            `Your activation link: ${activationUrl}`,
            getReactivationEmailHTML(activationUrl),
        );

        res.json({ message: "Activation link resent." });
    } catch (err) {
        console.error("❌ Error resending activation link: ", err);
        res.status(400).json({ error: err.message });
    }
};

/**
 * POST /users/forgot-password
 *
 * Issue a password-reset token and email the link. Capped at 3/day by the
 * service.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) throw new Error("Email is required");

        const { user, token } = await requestPasswordReset(
            email.trim().toLowerCase(),
        );
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

        await sendEmail(
            user.email,
            "Reset your password",
            `Reset link: ${resetUrl}`,
            getPasswordResetEmailHTML(resetUrl),
        );

        res.json({ message: "Password reset link sent" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

/**
 * POST /users/reset-password?token=...
 *
 * Consume a password-reset token (one-shot) and persist a new hashed
 * password. Service enforces password policy.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const resetPasswordController = async (req, res) => {
    try {
        const { token } = req.query;
        const { password } = req.body;

        if (!token || !password) {
            throw new Error("Token and password required");
        }

        await resetPassword(token, password);
        res.json({ message: "Password reset successful" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

/**
 * POST /users/logout
 *
 * Clear the auth cookie. The cookie attributes mirror the ones used in
 * login so the browser actually drops it.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export const logoutUser = (req, res) => {
    res.clearCookie("token", getAuthCookieOptions());
    res.json({ message: "Logged out successfully" });
};

/**
 * POST /users/unsuspend-appeal
 *
 * Public (no auth) endpoint for suspended users to file an appeal. The
 * service silently returns null for unknown emails or duplicate pending
 * appeals — we mirror that here with a uniform "Appeal received" response
 * so attackers can't probe which emails are suspended.
 *
 * Side-effect: when a real appeal is created, fan a notification out to
 * every admin/superadmin so it lands in the moderation queue immediately.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const submitUnsuspendAppeal = async (req, res) => {
    try {
        const { email, appealMessage } = req.body || {};
        if (!email || !appealMessage || !appealMessage.trim()) {
            return res.status(400).json({
                error: "Email and appeal message are required",
            });
        }

        const result = await createAppeal({ email, appealMessage });

        // `result` is null when the service decided to swallow the request
        // (unknown email / duplicate pending appeal) — skip the admin
        // fan-out in that case but still respond with success below.
        if (result) {
            const { user } = result;
            const admins = await User.find({
                role: { $in: ["admin", "superadmin"] },
            }).select("_id");

            await Promise.all(
                admins.map((admin) =>
                    createNotification({
                        recipientId: admin._id,
                        message: `Unsuspend appeal from ${user.userName} (${user.email})`,
                        type: "system",
                        link: `/admin/appeals`,
                    }),
                ),
            );
        }

        return res.status(200).json({
            message: "Appeal received",
        });
    } catch (err) {
        console.error("❌ Error submitting appeal:", err);
        return res.status(400).json({ error: err.message });
    }
};

/**
 * GET /users/me
 *
 * Session probe used by the frontend to bootstrap the UserContext. Prefers
 * the live Profile.profilePicture but falls back to the JWT-embedded value
 * so a transient DB blip doesn't sign the user out.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const getMe = async (req, res) => {
    // req.user is set by requireAuth middleware
    let profilePicture = req.user.profilePicture || "";
    try {
        // Best-effort fresh lookup; failure falls through to the JWT value.
        const profile = await Profile.findOne({ user: req.user.id })
            .select("profilePicture")
            .lean();
        if (profile) profilePicture = profile.profilePicture || "";
    } catch {}

    res.json({
        _id: req.user.id,
        email: req.user.email,
        userName: req.user.userName,
        role: req.user.role,
        profilePicture,
    });
};
