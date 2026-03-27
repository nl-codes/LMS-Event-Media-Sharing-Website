import { ChatMessage } from "../models/chatMessageModel.js";
import { Event } from "../models/eventModel.js";

/**
 * Save a chat message to the database
 * @param {string} eventId - The event ID
 * @param {string} senderId - The sender's user ID
 * @param {string} senderName - The sender's name
 * @param {string} senderEmail - The sender's email
 * @param {string} text - The message text
 * @returns {Object} The saved chat message
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
 * Get chat history for a specific event
 * @param {string} eventId - The event ID
 * @param {number} limit - Maximum number of messages (default: 50)
 * @param {number} skip - Number of messages to skip for pagination (default: 0)
 * @returns {Array} Array of chat messages
 */
export const getChatHistory = async (eventId, limit = 50, skip = 0) => {
    if (!eventId) {
        throw new Error("eventId is required");
    }

    return await ChatMessage.find({ eventId })
        .populate("senderId", "userName email _id")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();
};

/**
 * Get recent messages for an event (for initial load)
 * @param {string} eventId - The event ID
 * @param {number} limit - Maximum number of messages (default: 20)
 * @returns {Array} Array of chat messages sorted chronologically (oldest first)
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

    // Return in chronological order (oldest first)
    return messages.reverse();
};

/**
 * Delete all messages for an event (cleanup when event is deleted)
 * @param {string} eventId - The event ID
 * @returns {Object} Deletion result
 */
export const deleteEventMessages = async (eventId) => {
    if (!eventId) {
        throw new Error("eventId is required");
    }

    return await ChatMessage.deleteMany({ eventId });
};
