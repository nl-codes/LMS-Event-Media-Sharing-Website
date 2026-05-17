import {
    createReport,
    deleteReport,
    dismissReport,
    getReportById,
    listFlaggedMediaForUser,
    listReports,
    verifyReport,
} from "../services/reportService.js";

export async function createReportController(req, res) {
    try {
        const reporterId = req.user?.id;
        const { targetId, targetType, reason, description } = req.body || {};

        const report = await createReport({
            reporterId,
            targetId,
            targetType,
            reason,
            description,
        });

        return res.status(201).json({
            success: true,
            message: "Report submitted",
            data: report,
        });
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message,
        });
    }
}

export async function listReportsController(req, res) {
    try {
        const status = String(req.query.status || "").trim() || undefined;
        const targetType =
            String(req.query.targetType || "").trim() || undefined;

        const reports = await listReports({ status, targetType });
        return res.status(200).json({
            success: true,
            count: reports.length,
            data: reports,
        });
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message,
        });
    }
}

export async function getReportController(req, res) {
    try {
        const { reportId } = req.params || {};
        const data = await getReportById(reportId);
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

export async function verifyReportController(req, res) {
    try {
        const { reportId } = req.params || {};
        const { reasoning, action } = req.body || {};
        const adminId = req.user?.id;

        const report = await verifyReport({
            reportId,
            adminId,
            reasoning,
            action,
        });

        return res.status(200).json({
            success: true,
            message: "Report verified",
            data: report,
        });
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message,
        });
    }
}

export async function dismissReportController(req, res) {
    try {
        const { reportId } = req.params || {};
        const { reasoning } = req.body || {};
        const adminId = req.user?.id;

        const report = await dismissReport({
            reportId,
            adminId,
            reasoning,
        });

        return res.status(200).json({
            success: true,
            message: "Report dismissed",
            data: report,
        });
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message,
        });
    }
}

export async function deleteReportController(req, res) {
    try {
        const { reportId } = req.params || {};
        const result = await deleteReport(reportId);
        return res.status(200).json({
            success: true,
            message: "Report deleted",
            data: result,
        });
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message,
        });
    }
}

export async function getFlaggedMediaController(req, res) {
    try {
        const userId = req.user?.id;
        const items = await listFlaggedMediaForUser(userId);
        return res.status(200).json({
            success: true,
            count: items.length,
            data: items,
        });
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message,
        });
    }
}
