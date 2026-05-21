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

// POST /upload (auth optional, guests allowed)
router.post(
    "/upload",
    identifyUser,
    uploadEventMedia.array("files", 10),
    handleMulterErrors,
    validateUploadTierLimits,
    uploadMediaController,
);

// GET /usage/:eventId tier + remaining capacity (public; needed by guests too)
router.get("/usage/:eventId", getEventUsageController);

router.get("/explore", getExploreMediaController);

// GET /item/:mediaId (public)
router.get("/item/:mediaId", getMediaByIdController);

// GET /:eventId/highlights (public)
router.get("/:eventId/highlights", getHighlightsController);

// GET /:eventId (public)
router.get("/:eventId", getGalleryController);

// DELETE / (auth required, bulk delete with body)
router.delete("/", requireAuth, deleteMultipleMediaController);

// DELETE /:mediaId (auth required)
router.delete("/:mediaId", requireAuth, deleteMediaController);

// PATCH /:mediaId/label (auth required)
router.patch("/:mediaId/label", requireAuth, setMediaLabelController);

// PATCH /:mediaId/highlight (host-only, enforced in service)
router.patch(
    "/:mediaId/highlight",
    requireAuth,
    updateMediaHighlightController,
);

export default router;
