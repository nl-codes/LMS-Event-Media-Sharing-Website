import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import multer from "multer";
import {
    uploadMediaController,
    getGalleryController,
    deleteMediaController,
    toggleLikeController,
    getHighlightsController,
    setMediaLabelController,
} from "../controllers/mediaController.js";

// Use multer memory storage for file buffer
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// POST /media/upload (auth optional, guests allowed)
router.post("/media/upload", upload.single("file"), uploadMediaController);

// GET /media/:eventId (public)
router.get("/media/:eventId", getGalleryController);

// DELETE /media/:mediaId (auth required)
router.delete("/media/:mediaId", requireAuth, deleteMediaController);

// POST /media/:mediaId/like (auth required)
router.post("/media/:mediaId/like", requireAuth, toggleLikeController);

// GET /media/:eventId/highlights (public)
router.get("/media/:eventId/highlights", getHighlightsController);

// PATCH /media/:mediaId/label (auth required)
router.patch("/media/:mediaId/label", requireAuth, setMediaLabelController);

export default router;
