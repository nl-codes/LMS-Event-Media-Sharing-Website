/**
 * @module routes/eventMembershipRoute
 * @description Mounted at `/event-memberships`. Registered-user
 * participation: idempotent join + "my joined events" listing. Guest
 * participation goes through {@link module:routes/eventRoute}
 * (`POST /events/join-as-guest`).
 */

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
