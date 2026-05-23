/**
 * @module routes/eventRoute
 * @description Mounted at `/events`. Host CRUD + status/privacy/finish
 * actions, host analytics insights, plus the public surface used by QR
 * link visitors (verify access, join as guest, public listing/details,
 * upload-check probe).
 *
 * Middleware patterns:
 *  - {@link attachEventId} runs before thumbnail multer so the Cloudinary
 *    storage path (`events/<id>/thumbnail`) is known when the upload
 *    happens. Required on BOTH create and edit because edit uploads a
 *    replacement thumbnail under the same id.
 *  - {@link identifyUser} on `/verify/:eventId` populates `req.user` if a
 *    JWT cookie exists, but does NOT 401 when it doesn't — the handler
 *    needs to return the upload-window info for guests too.
 */

import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { identifyUser } from "../middleware/identifyUser.js";
import { uploadEventThumbnail } from "../middleware/uploadMiddleware.js";
import {
    registerEvent,
    getEventById,
    getEventParticipantsController,
    getHostEvents,
    getEventBySlug,
    editEvent,
    editEventStatus,
    deleteEvent,
    finishEvent,
    requestUploadSignature,
    verifyEventAccess,
    joinAsGuest,
    updateEventPrivacyController,
    listPublicEventsController,
} from "../controllers/eventController.js";
import { getEventInsightsController } from "../controllers/analyticsController.js";
import { attachEventId } from "../middleware/utilsMiddleware.js";

const router = express.Router();

// 1. GLOBAL SEARCH/LISTING (Static paths first)
router.get("/public", listPublicEventsController);
router.get("/host-events", requireAuth, getHostEvents);

// 2. CREATION
router.post(
    "/",
    requireAuth,
    attachEventId,
    uploadEventThumbnail.single("thumbnail"),
    registerEvent,
);

// 3. PUBLIC ACCESS & GUEST ACTIONS
// Move these above /:id so "verify" isn't treated as an ID
router.get("/verify/:eventId", identifyUser, verifyEventAccess);
router.post("/join-as-guest", joinAsGuest);

// 4. SPECIFIC RESOURCE ACTIONS (ID-based)
router.get("/details/:id", requireAuth, getEventById);
router.get("/:id/participants", requireAuth, getEventParticipantsController);
router.get("/:eventId/insights", requireAuth, getEventInsightsController);

router.patch("/:eventId/privacy", requireAuth, updateEventPrivacyController);
router.patch("/:id/status", requireAuth, editEventStatus);
router.patch("/:id/finish", requireAuth, finishEvent);

router.patch(
    "/:id",
    requireAuth,
    attachEventId,
    uploadEventThumbnail.single("thumbnail"),
    editEvent,
);
router.delete("/:id", requireAuth, deleteEvent);

// 5. SLUG-BASED ROUTES (Catch-all patterns at the bottom)
router.get("/:slug", getEventBySlug);
router.post("/:slug/upload-check", requestUploadSignature);

export default router;
