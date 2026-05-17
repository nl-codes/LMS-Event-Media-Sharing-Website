import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { identifyUser } from "../middleware/identifyUser.js";
import multer from "multer";
import {
    uploadMediaController,
    getGalleryController,
    getMediaByIdController,
    deleteMediaController,
    deleteMultipleMediaController,
    getHighlightsController,
    setMediaLabelController,
} from "../controllers/mediaController.js";

// Use multer memory storage for file buffer
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// POST /upload (auth optional, guests allowed)
router.post(
    "/upload",
    identifyUser,
    upload.array("files", 10),
    uploadMediaController,
);

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
