import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
    listNotificationsController,
    markAllReadController,
    markReadController,
    unreadCountController,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", requireAuth, listNotificationsController);
router.get("/unread-count", requireAuth, unreadCountController);
router.post("/mark-all-read", requireAuth, markAllReadController);
router.post("/:notificationId/read", requireAuth, markReadController);

export default router;
