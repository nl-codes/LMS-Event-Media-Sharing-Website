import {
    approveAppeal,
    getAppealCounts,
    listAppeals,
    rejectAppeal,
} from "../services/appealService.js";

export async function getAppealCountsController(req, res) {
    try {
        const counts = await getAppealCounts();
        return res.status(200).json({ success: true, data: counts });
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message,
        });
    }
}

export async function listAppealsController(req, res) {
    try {
        const status = String(req.query.status || "").trim() || undefined;
        const appeals = await listAppeals({ status });
        return res.status(200).json({
            success: true,
            count: appeals.length,
            data: appeals,
        });
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message,
        });
    }
}

export async function approveAppealController(req, res) {
    try {
        const { appealId } = req.params;
        const { adminNote } = req.body || {};
        const adminId = req.user?.id;

        const appeal = await approveAppeal({ appealId, adminId, adminNote });
        return res.status(200).json({
            success: true,
            message: "Appeal approved and user unsuspended",
            data: appeal,
        });
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message,
        });
    }
}

export async function rejectAppealController(req, res) {
    try {
        const { appealId } = req.params;
        const { adminNote } = req.body || {};
        const adminId = req.user?.id;

        const appeal = await rejectAppeal({ appealId, adminId, adminNote });
        return res.status(200).json({
            success: true,
            message: "Appeal rejected",
            data: appeal,
        });
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message,
        });
    }
}
