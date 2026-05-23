/**
 * @module controllers/superAdminController
 * @description Superadmin-only endpoints: approve pending admin requests,
 * list admins, suspend/unsuspend admin accounts.
 */

import {
    approveAdminUser,
    getAdminsList,
    suspendAdmin,
    unsuspendAdmin,
} from "../services/superAdminService.js";

/**
 * POST /superadmins/admins/approve
 *
 * Mark an admin account as approved and active.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export async function superAdminApproveAdminController(req, res) {
    try {
        const { adminId } = req.body || {};

        if (!adminId) {
            return res.status(400).json({
                success: false,
                message: "adminId is required",
            });
        }

        const approvedAdmin = await approveAdminUser(adminId);

        return res.status(200).json({
            success: true,
            message: "Admin approved",
            data: approvedAdmin,
        });
    } catch (err) {
        const statusCode = err.message === "Admin not found" ? 404 : 400;
        return res.status(statusCode).json({
            success: false,
            message: err.message,
        });
    }
}

/**
 * GET /superadmins/admins?search=...
 *
 * Admin management table.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export async function superAdminListAdminsController(req, res) {
    const search = String(req.query.search || "").trim();
    try {
        const adminsList = await getAdminsList(search);
        return res.status(200).json({ success: true, data: adminsList });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

/**
 * POST /superadmins/admins/suspend
 *
 * Suspend an admin account; requires a non-empty reason.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export async function superAdminSuspendAdmin(req, res) {
    try {
        const { adminId, reason } = req.body || {};
        if (!adminId || !adminId.trim() || !reason || !reason.trim()) {
            return res.status(400).json({
                success: false,
                message: "adminId and reason are required",
            });
        }

        const updated = await suspendAdmin(adminId, reason);

        return res.status(200).json({
            success: true,
            message: "Admin suspended",
            data: updated,
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
 * POST /superadmins/admins/unsuspend
 *
 * Lift an admin suspension; requires a non-empty reason.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export async function superAdminUnsuspendAdmin(req, res) {
    try {
        const { adminId, reason } = req.body || {};
        if (!adminId || !adminId.trim() || !reason || !reason.trim()) {
            return res.status(400).json({
                success: false,
                message: "adminId and reason are required",
            });
        }

        const updated = await unsuspendAdmin(adminId, reason);

        return res.status(200).json({
            success: true,
            message: "Admin un-suspended",
            data: updated,
        });
    } catch (err) {
        const status = err.statusCode || 500;
        return res.status(status).json({
            success: false,
            message: err.message,
        });
    }
}
