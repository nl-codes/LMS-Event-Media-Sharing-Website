/**
 * @module routes/appealRoute
 * @description Mounted at `/appeals`. Admin/superadmin appeals queue
 * (counts + list + approve/reject). End-user submission is the public
 * `POST /users/unsuspend-appeal` route
 * {@link module:routes/userRoute}.
 */

import express from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import {
    approveAppealController,
    createEventAppealController,
    getAppealCountsController,
    listAppealsController,
    rejectAppealController,
} from "../controllers/appealController.js";

const router = express.Router();

router.get(
    "/counts",
    requireAuth,
    requireRole("admin", "superadmin"),
    getAppealCountsController,
);

router.get(
    "/",
    requireAuth,
    requireRole("admin", "superadmin"),
    listAppealsController,
);

router.post(
    "/events/:eventId",
    requireAuth,
    createEventAppealController,
);

router.post(
    "/:appealId/approve",
    requireAuth,
    requireRole("admin", "superadmin"),
    approveAppealController,
);

router.post(
    "/:appealId/reject",
    requireAuth,
    requireRole("admin", "superadmin"),
    rejectAppealController,
);

export default router;
