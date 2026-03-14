import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { createEvent } from "../controllers/eventController.js";

const router = express.Router();
// Protected routes (require authentication)
router.post("/", requireAuth, createEvent);

export default router;
