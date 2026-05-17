import {
    countUnread,
    listNotificationsForUser,
    markAllRead,
    markNotificationRead,
} from "../services/notificationService.js";

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
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message,
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
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message,
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
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message,
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
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message,
        });
    }
}
