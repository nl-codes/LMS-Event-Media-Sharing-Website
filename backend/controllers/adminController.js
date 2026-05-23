/**
 * @module controllers/adminController
 * @description Admin auth (signup → superadmin approval, password + OTP
 * MFA login) and admin-on-user moderation surfaces (suspend/unsuspend,
 * list users/events, event detail with stats).
 */

import {
    getEventDetails,
    getEventsList,
    getUsersList,
    registerAdmin,
    suspendUser,
    unsuspendUser,
    verifyAdminCredentials,
} from "../services/adminService.js";
import { setAuthCookie } from "../utils/auth/cookieAuth.js";
import { generateJWTtoken } from "../utils/auth/generateJWTtoken.js";
import sendEmail from "../utils/sendEmail.js";

/**
 * POST /admins/signup
 *
 * Create a pending admin awaiting superadmin approval.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export async function registerAdminController(req, res) {
    try {
        const user = await registerAdmin(req.body || {});

        return res.status(201).json({
            success: true,
            message:
                "Admin registration submitted. SuperAdmin will review your request.",
            data: user,
        });
    } catch (err) {
        return res.status(err.statusCode || 400).json({
            success: false,
            message: err.message,
        });
    }
}

/**
 * POST /admins/login
 *
 * Two-phase admin login:
 *
 *  1. Caller submits `{ email, password }`. Service issues a fresh OTP
 *     and we email it (or log it in dev). Response: `mfaRequired: true`.
 *  2. Caller resubmits `{ email, password, otp }`. Service verifies the
 *     OTP, we mint a JWT and set the cookie. Superadmins skip phase 1.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export async function loginAdminController(req, res) {
    try {
        const { email, password, otp } = req.body;

        const result = await verifyAdminCredentials({
            email,
            password,
            otp,
        });

        // Scenario 1: OTP is required and was just generated
        let SuccessMessage;
        if (result.mfaRequired) {
            // Dev-only: print the OTP to the console so local devs don't
            // need a working mail server to test admin login.
            if (process.env.NODE_ENV === "development") {
                SuccessMessage =
                    "Development Mode: Check Backend Console for OTP.";
                console.log(
                    "Printing OTP in console just for development mode.",
                );
                console.log(
                    `OTP for login of ${result.user.email} is:  ${result.otpCode}`,
                );
            } else {
                SuccessMessage = "OTP sent to email";
                await sendEmail(
                    result.user.email,
                    "Your Admin Login OTP",
                    `Your OTP is: ${result.otpCode}`,
                    `<p>Your OTP is <b>${result.otpCode}</b>. It expires in 10 minutes.</p>`,
                );
            }

            return res.status(200).json({
                success: true,
                message: SuccessMessage,
                mfaRequired: true,
            });
        }

        // Scenario 2: Login successful (Superadmin or Admin with valid OTP)
        const token = generateJWTtoken({
            email: result.user.email,
            userName: result.user.userName,
            role: result.user.role,
            id: result.user._id,
        });

        setAuthCookie(res, token);

        return res.status(200).json({
            success: true,
            message: "Login Successful",
            data: {
                role: result.user.role,
                redirectTo:
                    result.user.role === "superadmin"
                        ? "/super-admin/home"
                        : "/admin/home",
            },
        });
    } catch (err) {
        const status = err.statusCode || 500;
        return res.status(status).json({
            success: false,
            message: err.message,
        });
    }
}

/**
 * GET /admins/users?search=...
 *
 * Admin user-management table.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export async function getUsersListController(req, res) {
    try {
        const search = String(req.query.search || "").trim();
        const users = await getUsersList(search);
        return res
            .status(200)
            .json({ success: true, count: users.length, data: users });
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message,
        });
    }
}

/**
 * Express-handler factory shared by suspend / unsuspend so the two
 * endpoints don't repeat the same `{ userId, reason }` validation.
 * @param {(userId: string, reason: string) => Promise<object>} actionFn
 *   The underlying service call (suspendUser or unsuspendUser).
 * @param {string} successMessage Human-readable response message.
 * @returns {import("express").RequestHandler}
 */
const handleUserAction = (actionFn, successMessage) => {
    return async (req, res) => {
        try {
            const { userId, reason } = req.body || {};

            if (!userId || !userId.trim() || !reason || !reason.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "userId and reason are required",
                });
            }

            const updated = await actionFn(userId, reason);

            return res.status(200).json({
                success: true,
                message: successMessage,
                data: updated,
            });
        } catch (err) {
            return res.status(err.statusCode || 500).json({
                success: false,
                message: err.message,
            });
        }
    };
};

/** POST /admins/users/suspend — admin suspends an end user. */
export const suspendUserController = handleUserAction(
    suspendUser,
    "User suspended",
);

/** POST /admins/users/unsuspend — admin lifts an end-user suspension. */
export const unsuspendUserController = handleUserAction(
    unsuspendUser,
    "User un-suspended",
);

/**
 * GET /admins/events?search=...&tier=...
 *
 * Admin events table.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export async function getEventsListController(req, res) {
    try {
        const events = await getEventsList(req.query.search, req.query.tier);

        return res
            .status(200)
            .json({ success: true, count: events.length, data: events });
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message,
        });
    }
}

/**
 * GET /admins/events/:eventId
 *
 * Admin event detail with aggregate stats + uploads timeseries.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export async function getEventDetailsController(req, res) {
    try {
        const { eventId } = req.params || {};

        if (!eventId || !eventId.trim()) {
            return res.status(400).json({
                success: false,
                message: "eventId is required",
            });
        }

        const data = await getEventDetails(eventId);

        return res.status(200).json({
            success: true,
            data,
        });
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message,
        });
    }
}
