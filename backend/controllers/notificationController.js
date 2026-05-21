import {
    countUnread,
    listNotificationsForUser,
    markAllRead,
    markNotificationRead,
} from "../services/notificationService.js";

const notificationErrorResponse = (err) => ({
    status: err.statusCode || (err.name === "CastError" ? 400 : 500),
    message:
        err.statusCode || err.name === "CastError"
            ? err.message
            : "Notification service is temporarily unavailable",
});

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
