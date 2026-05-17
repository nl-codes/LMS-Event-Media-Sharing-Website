import express from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import {
    approveAppealController,
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
