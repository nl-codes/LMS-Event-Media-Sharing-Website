import { ChatMessage } from "../models/chatMessageModel.js";
import { Event } from "../models/eventModel.js";
import { EventMembership } from "../models/eventMembershipModel.js";
import { attachAvatars } from "../utils/attachAvatars.js";

/**
 * @module services/chatService
 * @description Event-scoped chat. Persists to ChatMessage; live and history
 * shapes match via {@link findPopulatedMessage}. Unread badges read off
 * `EventMembership.lastSeenChatAt`.
 */

/**
 * Persist a chat message after asserting the event exists.
 * @param {string} eventId
 * @param {string} senderId
 * @param {string} senderName
 * @param {string} senderEmail
 * @param {string} text
 * @returns {Promise<import("mongoose").Document>} Saved message doc.
 * @throws {Error} On missing required fields or unknown event.
 */
export const saveChatMessage = async (
    eventId,
    senderId,
    senderName,
    senderEmail,
    text,
) => {
    if (!eventId || !senderId || !text) {
        throw new Error("eventId, senderId, and text are required");
    }

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
        throw new Error("Event not found");
    }

    const message = new ChatMessage({
        eventId,
        senderId,
        senderName,
        senderEmail,
        text,
    });

    return await message.save();
};

/**
 * Reload a message in REST-history shape (sender populated + avatar).
 * @param {string} messageId
 * @returns {Promise<object|null>}
 */
export const findPopulatedMessage = async (messageId) => {
    const message = await ChatMessage.findById(messageId)
        .populate("senderId", "userName email _id")
        .lean();
    if (!message) return null;
    return attachAvatars(message, ["senderId"]);
};

/**
 * Paginated chat history (newest first).
 * @param {string} eventId
 * @param {number} [limit=50]
 * @param {number} [skip=0]
 * @returns {Promise<object[]>}
 * @throws {Error} If eventId is missing.
 */
export const getChatHistory = async (eventId, limit = 50, skip = 0) => {
    if (!eventId) {
        throw new Error("eventId is required");
    }

    const messages = await ChatMessage.find({ eventId })
        .populate("senderId", "userName email _id")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();
    return attachAvatars(messages, ["senderId"]);
};

/**
 * Recent messages for the initial chat view, returned oldest-first.
 * @param {string} eventId
 * @param {number} [limit=20]
 * @returns {Promise<object[]>}
 * @throws {Error} If eventId is missing.
 */
export const getRecentMessages = async (eventId, limit = 20) => {
    if (!eventId) {
        throw new Error("eventId is required");
    }

    const messages = await ChatMessage.find({ eventId })
        .populate("senderId", "userName email _id")
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
    const withAvatars = await attachAvatars(messages, ["senderId"]);

    // Return in chronological order (oldest first)
    return withAvatars.reverse();
};

/**
 * Count messages newer than `EventMembership.lastSeenChatAt`. Missing
 * timestamp = treat all messages as unread.
 * @param {string} eventId
 * @param {string} userId
 * @returns {Promise<number>}
 * @throws {Error} If either id is missing.
 */
export const getUnreadCount = async (eventId, userId) => {
    if (!eventId || !userId) {
        throw new Error("eventId and userId are required");
    }

    const membership = await EventMembership.findOne({
        eventId,
        userId,
    }).lean();

    if (!membership || !membership.lastSeenChatAt) {
        // User has no last-seen timestamp -> consider all messages unread
        return await ChatMessage.countDocuments({ eventId });
    }

    return await ChatMessage.countDocuments({
        eventId,
        createdAt: { $gt: membership.lastSeenChatAt },
    });
};

/**
 * Wipe every chat message for an event. Called during event cleanup.
 * @param {string} eventId
 * @returns {Promise<{ deletedCount?: number }>}
 * @throws {Error} If eventId is missing.
 */
export const deleteEventMessages = async (eventId) => {
    if (!eventId) {
        throw new Error("eventId is required");
    }

    return await ChatMessage.deleteMany({ eventId });
};
