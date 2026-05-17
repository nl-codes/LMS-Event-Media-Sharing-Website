import mongoose from "mongoose";
import Notification from "../models/notificationModel.js";
import { makeError } from "../utils/helperFunctions.js";

const validateObjectId = (id, label) => {
    if (!mongoose.isValidObjectId(id)) {
        throw makeError(400, `Invalid ${label}`);
    }
};

export async function createNotification({
    recipientId,
    message,
    type = "system",
    link = "",
}) {
    if (!recipientId) return null;
    if (!message || !String(message).trim()) {
        throw makeError(400, "Notification message required");
    }
    validateObjectId(recipientId, "recipient id");

    return Notification.create({
        recipientId,
        message: String(message).trim(),
        type,
        link,
    });
}

export async function listNotificationsForUser(userId, { unreadOnly } = {}) {
    validateObjectId(userId, "user id");
    const filter = { recipientId: userId };
    if (unreadOnly) filter.isRead = false;
    return Notification.find(filter).sort({ createdAt: -1 }).limit(100);
}

export async function markNotificationRead(notificationId, userId) {
    validateObjectId(notificationId, "notification id");
    validateObjectId(userId, "user id");

    const notification = await Notification.findOne({
        _id: notificationId,
        recipientId: userId,
    });

    if (!notification) {
        throw makeError(404, "Notification not found");
    }

    if (!notification.isRead) {
        notification.isRead = true;
        await notification.save();
    }

    return notification;
}

export async function markAllRead(userId) {
    validateObjectId(userId, "user id");
    await Notification.updateMany(
        { recipientId: userId, isRead: false },
        { $set: { isRead: true } },
    );
    return { success: true };
}

export async function countUnread(userId) {
    validateObjectId(userId, "user id");
    return Notification.countDocuments({
        recipientId: userId,
        isRead: false,
    });
}
