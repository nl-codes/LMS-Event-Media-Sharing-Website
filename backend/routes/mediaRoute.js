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
    getEventUsageController,
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

// GET /item/:mediaId (public)
router.get("/item/:mediaId", getMediaByIdController);

// GET /:eventId (public)
router.get("/:eventId", getGalleryController);

// DELETE / (auth required, bulk delete with body)
router.delete("/", requireAuth, deleteMultipleMediaController);

// DELETE /:mediaId (auth required)
router.delete("/:mediaId", requireAuth, deleteMediaController);

// GET /:eventId/highlights (public)
router.get("/:eventId/highlights", getHighlightsController);

// PATCH /:mediaId/label (auth required)
router.patch("/:mediaId/label", requireAuth, setMediaLabelController);

export default router;
