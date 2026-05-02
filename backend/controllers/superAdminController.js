import {
    approveAdminUser,
    getAdminsList,
    suspendAdmin,
    unsuspendAdmin,
} from "../services/superAdminService.js";

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

export async function superAdminListAdminsController(req, res) {
    const search = String(req.query.search || "").trim();
    try {
        const adminsList = await getAdminsList(search);
        return res.status(200).json({ success: true, data: adminsList });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

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
