import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { registerEvent } from "../controllers/eventController.js";

const router = express.Router();
// Protected routes (require authentication)
router.post("/", requireAuth, registerEvent);

export default router;
