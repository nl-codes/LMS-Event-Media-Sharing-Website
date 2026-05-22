/**
 * @module routes/chatRoute
 * @description Mounted at `/chats`. HTTP companion to the socket.io
 * chat room: history, "recent + unread badge" initial load,
 * mark-read, and a cheap unread-count probe. Live send/receive uses
 * socket.io in server.js, not these routes.
 */

import express from "express";
import {
    getChatHistoryController,
    getRecentMessagesController,
    getUnreadCountController,
    markAsReadController,
} from "../controllers/chatController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:eventId", requireAuth, getChatHistoryController);
router.get("/:eventId/recent", requireAuth, getRecentMessagesController);
router.get("/:eventId/unread", requireAuth, getUnreadCountController);
router.post("/:eventId/mark-as-read", requireAuth, markAsReadController);

export default router;
