import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
    registerEvent,
    getEventById,
    getHostEvents,
    getEventBySlug,
    editEvent,
    editEventStatus,
    deleteEvent,
    requestUploadSignature,
} from "../controllers/eventController.js";

const router = express.Router();
// Protected routes (require authentication)
router.post("/", requireAuth, registerEvent);
router.get("/details/:id", requireAuth, getEventById);
router.get("/host-events", requireAuth, getHostEvents);
router.patch("/:id", requireAuth, editEvent);
router.patch("/:id/status", requireAuth, editEventStatus);
router.delete("/:id", requireAuth, deleteEvent);

// Public routes (for QR code access)
router.get("/:slug", getEventBySlug);
router.post("/:slug/upload-check", requestUploadSignature);

export default router;
