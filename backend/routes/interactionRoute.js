/**
 * @module routes/interactionRoute
 * @description Mounted at `/interactions`. Comments + likes against
 * Media. Reads (`GET /:mediaId`) are public so guests can see comments;
 * mutations require auth — guests cannot interact.
 */

import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
    addCommentController,
    deleteCommentController,
    editCommentController,
    getInteractionsController,
    toggleLikeController,
} from "../controllers/interactionController.js";

const router = express.Router();

router.get("/:mediaId", getInteractionsController);
router.post("/toggle-like", requireAuth, toggleLikeController);
router.post("/", requireAuth, addCommentController);
router.put("/:id", requireAuth, editCommentController);
router.delete("/:id", requireAuth, deleteCommentController);

export default router;
