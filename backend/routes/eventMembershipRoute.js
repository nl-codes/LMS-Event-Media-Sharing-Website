import express from "express";
import {
    getMyJoinedEvents,
    joinEventController,
} from "../controllers/eventMembershipController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/join", requireAuth, joinEventController);
router.get("/joined", requireAuth, getMyJoinedEvents);

export default router;
