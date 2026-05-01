import {
    getChatHistory,
    getRecentMessages,
    getUnreadCount,
} from "../services/chatService.js";
import { markChatAsRead } from "../services/eventMembershipService.js";

/**
 * GET /chats/:eventId
 * Fetch chat message history for a specific event
 * Only authenticated users can access
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
 * GET /chats/:eventId/recent
 * Fetch recent messages for an event (for initial load)
 * Only authenticated users can access
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

        // Compute unread count for this user
        let unreadCount = 0;
        try {
            unreadCount = await getUnreadCount(eventId, req.user.id);
        } catch (err) {
            // ignore and default to 0
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
