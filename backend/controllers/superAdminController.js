import {
    approveAdminUser,
    getAdminsList,
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
