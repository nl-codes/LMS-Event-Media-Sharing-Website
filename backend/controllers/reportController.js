/**
 * @module controllers/reportController
 * @description Moderation HTTP layer: filing reports, admin queue, verdict
 * (verify/dismiss), housekeeping delete, and a "my hidden media" view for
 * end users.
 */

import {
    createReport,
    deleteReport,
    dismissReport,
    getReportById,
    listFlaggedMediaForUser,
    listReports,
    verifyReport,
} from "../services/reportService.js";

/**
 * POST /reports
 *
 * File a moderation report. `reporterId` is taken from the JWT, never the
 * request body — clients can't impersonate other reporters.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
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

/**
 * GET /reports?status=...&targetType=...
 *
 * Admin moderation queue.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
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

/**
 * GET /reports/:reportId
 *
 * Report detail with hydrated target (Media / Interaction / User).
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
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

/**
 * POST /reports/:reportId/verify
 *
 * Apply an admin verdict + action handler (hideMedia / deleteComment /
 * suspendUser). The service notifies the reporter on success.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
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

/**
 * POST /reports/:reportId/dismiss
 *
 * Close a report as dismissed; notifies the reporter.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
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

/**
 * DELETE /reports/:reportId
 *
 * Hard-delete a report (superadmin housekeeping).
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
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

/**
 * GET /reports/flagged-media
 *
 * "My hidden media" view for the authenticated user — what an admin
 * verdict has hidden of their content.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
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
