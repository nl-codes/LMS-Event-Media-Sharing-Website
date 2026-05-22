/**
 * @module routes/mediaRoute
 * @description Mounted at `/media`. Reads are public so guests can view
 * galleries; mutations require {@link requireAuth}. Highlight toggle and
 * label endpoints are host-only — the role check lives in the service,
 * not in the route, so re-using {@link requireAuth} is enough here.
 *
 * Upload middleware chain (POST /upload):
 *  1. identifyUser             :    populates req.user OR req.guest (optional auth).
 *  2. uploadEventMedia.array   :    multer buffers up to 10 files in memory.
 *  3. handleMulterErrors       :    translates multer LIMIT_FILE_SIZE → 413.
 *  4. validateUploadTierLimits :    per-file size / video duration / tier check.
 *  5. uploadMediaController    :    split images/videos, persist + emit.
 *
 * Public reads stay open so QR-link visitors can browse the gallery
 * without an account. Sensitive moderation is on Media.isHidden, which
 * the gallery service already filters out.
 */

import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { identifyUser } from "../middleware/identifyUser.js";
import {
    uploadEventMedia,
    validateUploadTierLimits,
    handleMulterErrors,
} from "../middleware/uploadMiddleware.js";
import {
    uploadMediaController,
    getGalleryController,
    getMediaByIdController,
    deleteMediaController,
    deleteMultipleMediaController,
    getHighlightsController,
    setMediaLabelController,
    updateMediaHighlightController,
    getEventUsageController,
    getExploreMediaController,
} from "../controllers/mediaController.js";

const router = express.Router();

router.post(
    "/upload",
    identifyUser,
    uploadEventMedia.array("files", 10),
    handleMulterErrors,
    validateUploadTierLimits,
    uploadMediaController,
);

router.get("/usage/:eventId", getEventUsageController);
router.get("/explore", getExploreMediaController);
router.get("/item/:mediaId", getMediaByIdController);
router.get("/:eventId/highlights", getHighlightsController);
router.get("/:eventId", getGalleryController);
router.delete("/", requireAuth, deleteMultipleMediaController);
router.delete("/:mediaId", requireAuth, deleteMediaController);
router.patch("/:mediaId/label", requireAuth, setMediaLabelController);
router.patch(
    "/:mediaId/highlight",
    requireAuth,
    updateMediaHighlightController,
);

export default router;
