/**
 * @module controllers/chatController
 * @description HTTP layer for event-scoped chat: paginated history,
 * "recent + unread count" initial-load, mark-as-read, unread badge.
 * Realtime send/receive goes through socket.io in server.js, not here.
 */

import {
    getChatHistory,
    getRecentMessages,
    getUnreadCount,
} from "../services/chatService.js";
import { markChatAsRead } from "../services/eventMembershipService.js";

/**
 * GET /chats/:eventId?limit=50&skip=0
 *
 * Paginated chat history (newest first). Auth-only.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const getChatHistoryController = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { limit = 50, skip = 0 } = req.query;

        if (!eventId) {
            return res.status(400).json({
                success: false,
                message: "eventId is required",
            });
        }

        // Verify user is authenticated
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required to view chat history",
            });
        }

        const messages = await getChatHistory(
            eventId,
            parseInt(limit),
            parseInt(skip),
        );

        return res.status(200).json({
            success: true,
            total: messages.length,
            data: messages,
        });
    } catch (error) {
        console.error("❌ Error fetching chat history:", error);
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * GET /chats/:eventId/recent?limit=20
 *
 * Initial chat-load endpoint: returns the most recent messages (oldest
 * first for direct render) AND the caller's unread count so the UI can
 * render the unread divider in one roundtrip.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const getRecentMessagesController = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { limit = 20 } = req.query;

        if (!eventId) {
            return res.status(400).json({
                success: false,
                message: "eventId is required",
            });
        }

        // Verify user is authenticated
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required to view chat",
            });
        }

        const messages = await getRecentMessages(eventId, parseInt(limit));

        // Best-effort unread count — a Mongo blip here shouldn't take the
        // chat view down, so we degrade to 0.
        let unreadCount = 0;
        try {
            unreadCount = await getUnreadCount(eventId, req.user.id);
        } catch (err) {
            unreadCount = 0;
        }

        return res.status(200).json({
            success: true,
            total: messages.length,
            unreadCount,
            data: messages,
        });
    } catch (error) {
        console.error("❌ Error fetching recent messages:", error);
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * POST /chats/:eventId/read
 *
 * Stamp `lastSeenChatAt` on the caller's EventMembership row so unread
 * counts reset. Mirror of the socket "mark_as_read" event for clients
 * that prefer plain HTTP.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const markAsReadController = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user && req.user.id;

        if (!eventId || !userId) {
            return res
                .status(400)
                .json({ success: false, message: "eventId and user required" });
        }

        await markChatAsRead(eventId, userId, new Date());

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("❌ Error marking chat as read:", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * GET /chats/:eventId/unread-count
 *
 * Cheap badge probe for the caller in this event.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const getUnreadCountController = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user && req.user.id;

        if (!eventId || !userId) {
            return res
                .status(400)
                .json({ success: false, message: "eventId and user required" });
        }

        const unreadCount = await getUnreadCount(eventId, userId);
        return res.status(200).json({ success: true, data: { unreadCount } });
    } catch (error) {
        console.error("❌ Error getting unread count:", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};
