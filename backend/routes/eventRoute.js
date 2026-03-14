import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { registerEvent, getEventById } from "../controllers/eventController.js";

const router = express.Router();
// Protected routes (require authentication)
router.post("/", requireAuth, registerEvent);
router.get("/details/:id", requireAuth, getEventById);

export default router;
