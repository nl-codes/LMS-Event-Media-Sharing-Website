import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
    registerEvent,
    getEventById,
    getHostEvents,
} from "../controllers/eventController.js";

const router = express.Router();
// Protected routes (require authentication)
router.post("/", requireAuth, registerEvent);
router.get("/details/:id", requireAuth, getEventById);
router.get("/host-events", requireAuth, getHostEvents);

export default router;
