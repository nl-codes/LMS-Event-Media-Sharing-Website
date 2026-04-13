import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { identifyUser } from "../middleware/identifyUser.js";
import { uploadEventThumbnail } from "../middleware/uploadMiddleware.js";
import {
    registerEvent,
    getEventById,
    getHostEvents,
    getEventBySlug,
    editEvent,
    editEventStatus,
    deleteEvent,
    requestUploadSignature,
    verifyEventAccess,
    joinAsGuest,
} from "../controllers/eventController.js";
import { attachEventId } from "../middleware/utilsMiddleware.js";

const router = express.Router();
// Protected routes (require authentication)
router.post(
    "/",
    requireAuth,
    attachEventId,
    uploadEventThumbnail.single("thumbnail"),
    registerEvent,
);
router.get("/details/:id", requireAuth, getEventById);
router.get("/host-events", requireAuth, getHostEvents);
router.patch(
    "/:id",
    requireAuth,
    uploadEventThumbnail.single("thumbnail"),
    editEvent,
);
router.put(
    "/:id",
    requireAuth,
    uploadEventThumbnail.single("thumbnail"),
    editEvent,
);
router.patch("/:id/status", requireAuth, editEventStatus);
router.delete("/:id", requireAuth, deleteEvent);

// Public routes (for QR code access)
router.get("/verify/:eventId", identifyUser, verifyEventAccess);
router.post("/join-as-guest", joinAsGuest);
router.get("/:slug", getEventBySlug);
router.post("/:slug/upload-check", requestUploadSignature);

export default router;
