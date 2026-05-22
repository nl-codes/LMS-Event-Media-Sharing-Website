/**
 * @module controllers/notificationController
 * @description Bell-icon feed: list, mark read, mark all read, unread
 * count. All endpoints are caller-scoped via `req.user.id`.
 */

import {
    countUnread,
    listNotificationsForUser,
    markAllRead,
    markNotificationRead,
} from "../services/notificationService.js";

/**
 * Normalises a thrown error into `{ status, message }`. Hides internal
 * details for 5xx by returning a generic message — only known status
 * errors and Mongo CastErrors get their original message surfaced.
 * @param {Error} err
 * @returns {{ status: number, message: string }}
 */
const notificationErrorResponse = (err) => ({
    status: err.statusCode || (err.name === "CastError" ? 400 : 500),
    message:
        err.statusCode || err.name === "CastError"
            ? err.message
            : "Notification service is temporarily unavailable",
});

/**
 * GET /notifications?unreadOnly=true|false
 *
 * Up to 100 newest notifications for the caller plus the unread count
 * (so the bell badge can update in one roundtrip).
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export async function listNotificationsController(req, res) {
    try {
        const userId = req.user?.id;
        const unreadOnly = req.query.unreadOnly === "true";
        const notifications = await listNotificationsForUser(userId, {
            unreadOnly,
        });
        const unreadCount = await countUnread(userId);

        return res.status(200).json({
            success: true,
            count: notifications.length,
            unreadCount,
            data: notifications,
        });
    } catch (err) {
        const { status, message } = notificationErrorResponse(err);
        return res.status(status).json({
            success: false,
            message,
        });
    }
}

/**
 * POST /notifications/:notificationId/read
 *
 * Mark one notification as read for the caller. Idempotent.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export async function markReadController(req, res) {
    try {
        const userId = req.user?.id;
        const { notificationId } = req.params || {};
        const notification = await markNotificationRead(
            notificationId,
            userId,
        );
        return res.status(200).json({
            success: true,
            data: notification,
        });
    } catch (err) {
        const { status, message } = notificationErrorResponse(err);
        return res.status(status).json({
            success: false,
            message,
        });
    }
}

/**
 * POST /notifications/mark-all-read
 *
 * Bulk-clear unread badge for the caller.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export async function markAllReadController(req, res) {
    try {
        const userId = req.user?.id;
        await markAllRead(userId);
        return res.status(200).json({
            success: true,
            message: "All notifications marked read",
        });
    } catch (err) {
        const { status, message } = notificationErrorResponse(err);
        return res.status(status).json({
            success: false,
            message,
        });
    }
}

/**
 * GET /notifications/unread-count
 *
 * Cheap badge-only probe (e.g. polled on a timer).
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export async function unreadCountController(req, res) {
    try {
        const userId = req.user?.id;
        const unreadCount = await countUnread(userId);
        return res.status(200).json({
            success: true,
            data: { unreadCount },
        });
    } catch (err) {
        const { status, message } = notificationErrorResponse(err);
        return res.status(status).json({
            success: false,
            message,
        });
    }
}
