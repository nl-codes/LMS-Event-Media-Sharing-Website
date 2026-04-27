import express from "express";
import {
    getChatHistoryController,
    getRecentMessagesController,
    getUnreadCountController,
    markAsReadController,
} from "../controllers/chatController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * GET /chats/:eventId
 * Fetch paginated chat history for a specific event
 * Protected route - requires authentication
 */
router.get("/:eventId", requireAuth, getChatHistoryController);

/**
 * GET /chats/:eventId/recent
 * Fetch recent messages for initial load
 * Protected route - requires authentication
 */
router.get("/:eventId/recent", requireAuth, getRecentMessagesController);

// Get unread count for the current user for an event
router.get("/:eventId/unread", requireAuth, getUnreadCountController);

// Mark the chat as read for the current user
router.post("/:eventId/mark-as-read", requireAuth, markAsReadController);

export default router;
