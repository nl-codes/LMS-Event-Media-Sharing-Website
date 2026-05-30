import mongoose from "mongoose";
import Notification from "../models/notificationModel.js";
import { Event } from "../models/eventModel.js";
import { EventMembership } from "../models/eventMembershipModel.js";
import { makeError } from "../utils/helperFunctions.js";

/**
 * @module services/notificationService
 * @description Single-recipient in-app notifications plus a few domain
 * fan-out helpers for notifications that are anchored to another aggregate.
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
 * Notify every registered participant that an event has ended. The event row
 * is stamped first so host/manual finish and the periodic lifecycle worker do
 * not send duplicate notifications for the same event.
 * @param {string|import("mongoose").Document} eventOrId
 * @returns {Promise<{ sent: number, skipped?: boolean }>}
 */
export async function notifyEventEndedParticipants(eventOrId) {
    const eventId = eventOrId?._id || eventOrId;
    validateObjectId(eventId, "event id");

    const event = await Event.findOneAndUpdate(
        {
            _id: eventId,
            status: "Completed",
            endNotificationSentAt: null,
        },
        {
            $set: { endNotificationSentAt: new Date() },
        },
        { new: true },
    ).select("_id eventName uniqueSlug");

    if (!event) {
        return { sent: 0, skipped: true };
    }

    const userIds = await EventMembership.distinct("userId", {
        eventId: event._id,
    });
    const recipientIds = [
        ...new Set(userIds.map((id) => String(id)).filter(Boolean)),
    ].filter((id) => mongoose.isValidObjectId(id));

    if (recipientIds.length === 0) {
        return { sent: 0 };
    }

    try {
        await Notification.insertMany(
            recipientIds.map((recipientId) => ({
                recipientId,
                message: `${event.eventName} has ended. View all the shared moments`,
                type: "event_ended",
                link: `/events/${event.uniqueSlug}/gallery`,
            })),
            { ordered: false },
        );
    } catch (err) {
        await Event.updateOne(
            { _id: event._id },
            { $set: { endNotificationSentAt: null } },
        );
        throw err;
    }

    return { sent: recipientIds.length };
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
