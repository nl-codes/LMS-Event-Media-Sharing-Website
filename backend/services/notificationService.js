import mongoose from "mongoose";
import Notification from "../models/notificationModel.js";
import { makeError } from "../utils/helperFunctions.js";

/**
 * @module services/notificationService
 * @description Single-recipient in-app notifications. Fan-out is the
 * caller's responsibility (see reportService.notifyAllAdmins).
 */

const validateObjectId = (id, label) => {
    if (!mongoose.isValidObjectId(id)) {
        throw makeError(400, `Invalid ${label}`);
    }
};

/**
 * Insert a notification. Soft no-op if `recipientId` is missing so callers
 * can avoid existence guards.
 * @param {{ recipientId?: string, message: string, type?: string, link?: string }} input
 * @returns {Promise<import("mongoose").Document|null>}
 * @throws {Error} 400 on empty message or invalid recipient id.
 */
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

/**
 * Up to 100 newest notifications for a user (optionally unread-only).
 * @param {string} userId
 * @param {{ unreadOnly?: boolean }} [opts]
 * @returns {Promise<object[]>}
 * @throws {Error} 400 on invalid user id.
 */
export async function listNotificationsForUser(userId, { unreadOnly } = {}) {
    validateObjectId(userId, "user id");
    const filter = { recipientId: userId };
    if (unreadOnly) filter.isRead = false;
    return Notification.find(filter).sort({ createdAt: -1 }).limit(100);
}

/**
 * Mark a specific notification read for its recipient. Idempotent.
 * @param {string} notificationId
 * @param {string} userId Must own the notification.
 * @returns {Promise<import("mongoose").Document>}
 * @throws {Error} 404 if not found for that user.
 */
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

/**
 * Bulk-mark every unread notification for a user as read.
 * @param {string} userId
 * @returns {Promise<{ success: true }>}
 */
export async function markAllRead(userId) {
    validateObjectId(userId, "user id");
    await Notification.updateMany(
        { recipientId: userId, isRead: false },
        { $set: { isRead: true } },
    );
    return { success: true };
}

/**
 * Count of unread notifications for the bell-icon badge.
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function countUnread(userId) {
    validateObjectId(userId, "user id");
    return Notification.countDocuments({
        recipientId: userId,
        isRead: false,
    });
}
