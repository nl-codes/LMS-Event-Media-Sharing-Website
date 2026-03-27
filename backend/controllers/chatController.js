import { getChatHistory, getRecentMessages } from "../services/chatService.js";

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

        return res.status(200).json({
            success: true,
            total: messages.length,
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
