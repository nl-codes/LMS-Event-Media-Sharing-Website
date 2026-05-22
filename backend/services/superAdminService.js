import { User } from "../models/userModel.js";
import { makeError, safeUserForAdmin } from "../utils/helperFunctions.js";

/**
 * @module services/superAdminService
 * @description Superadmin-only operations on admin accounts: approve,
 * list, suspend, unsuspend. Admin-on-user moderation lives in
 * {@link module:services/adminService}.
 */

/**
 * Approve a pending admin request. Promotes status to "active" if still
 * pending.
 * @param {string} adminId
 * @returns {Promise<object>} Sanitised admin user (safeUserForAdmin).
 * @throws {Error} If the target is missing or not an admin.
 */
export const approveAdminUser = async (adminId) => {
    const requestedAdmin = await User.findById(adminId);

    if (!requestedAdmin || requestedAdmin.role != "admin") {
        throw new Error("Admin not found");
    }

    requestedAdmin.adminRequestStatus = "approved";

    if (requestedAdmin.status === "pending") {
        requestedAdmin.status = "active";
    }

    const approvedAdmin = await requestedAdmin.save();

    return await safeUserForAdmin(approvedAdmin);
};

/**
 * List admins for the superadmin dashboard.
 * @param {string} [searchTerm] Substring against userName/email.
 * @returns {Promise<import("mongoose").Document[]>} Up to 500 admins, newest first.
 */
export const getAdminsList = async (searchTerm) => {
    const q = { role: "admin" };
    if (searchTerm) {
        q.$or = [
            { email: { $regex: searchTerm, $options: "i" } },
            { userName: { $regex: searchTerm, $options: "i" } },
        ];
    }
    const filteredAdmin = await User.find(q)
        .sort({ createdAt: -1 })
        .limit(500)
        .select(
            "_id userName email role status  adminRequestStatus adminActionReason createdAt",
        );
    return filteredAdmin;
};

/**
 * Suspend an admin account.
 * @param {string} adminId
 * @param {string} suspensionReason Required, non-empty.
 * @returns {Promise<import("mongoose").Document>} The updated admin.
 * @throws {Error} 404 if missing, 400 if non-admin, pending, or already suspended.
 */
export const suspendAdmin = async (adminId, suspensionReason) => {
    const target = await User.findById(adminId);

    if (!target) {
        throw makeError(404, "Admin not found");
    }

    if (target.role !== "admin") {
        throw makeError(400, "Target must be an admin");
    }

    if (!suspensionReason || !suspensionReason.trim()) {
        throw makeError(400, "Suspension reason is required");
    }

    if (target.status === "pending") {
        throw makeError(400, "Admin yet to be approved.");
    }

    if (target.status === "suspended") {
        throw makeError(400, "Admin already suspended.");
    }

    target.status = "suspended";
    target.adminRequestStatus = "suspended";
    target.adminActionReason = suspensionReason.trim();

    await target.save();

    return await User.findById(adminId).select(
        "_id userName email role status adminRequestStatus adminActionReason updatedAt",
    );
};

/**
 * Lift an admin suspension. Restores adminRequestStatus to "approved".
 * @param {string} adminId
 * @param {string} upliftReason Required, non-empty.
 * @returns {Promise<import("mongoose").Document>} The updated admin.
 * @throws {Error} 404 if missing, 400 if non-admin, pending, or not suspended.
 */
export const unsuspendAdmin = async (adminId, upliftReason) => {
    const target = await User.findById(adminId);

    if (!target) {
        throw makeError(404, "Admin not found");
    }

    if (target.role !== "admin") {
        throw makeError(400, "Target must be an admin");
    }

    if (!upliftReason || !upliftReason.trim()) {
        throw makeError(400, "Uplift reason is required");
    }

    if (target.status === "pending") {
        throw makeError(400, "Admin yet to be approved.");
    }

    if (target.status !== "suspended") {
        throw makeError(400, "Admin is not suspended.");
    }

    target.status = "active";
    target.adminRequestStatus = "approved";
    target.adminActionReason = upliftReason.trim();

    await target.save();

    return await User.findById(adminId).select(
        "_id userName email role status adminRequestStatus adminActionReason updatedAt",
    );
};
