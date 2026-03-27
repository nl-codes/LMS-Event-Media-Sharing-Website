import express from "express";
import {
    getChatHistoryController,
    getRecentMessagesController,
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

export default router;
