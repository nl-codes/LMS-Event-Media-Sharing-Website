/**
 * @module routes/reportRoute
 * @description Mounted at `/reports`. End users file reports + view
 * their own hidden media; admins and superadmins triage the queue.
 *
 * Order matters: the literal `/flagged-media` route comes BEFORE the
 * generic `/:reportId` catch so it isn't shadowed.
 */

import express from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import {
    createReportController,
    deleteReportController,
    dismissReportController,
    getFlaggedMediaController,
    getReportController,
    listReportsController,
    verifyReportController,
} from "../controllers/reportController.js";

const router = express.Router();

router.post("/", requireAuth, createReportController);

router.get("/flagged-media", requireAuth, getFlaggedMediaController);

router.get(
    "/",
    requireAuth,
    requireRole("admin", "superadmin"),
    listReportsController,
);

router.get("/:reportId", requireAuth, getReportController);

router.post(
    "/:reportId/verify",
    requireAuth,
    requireRole("admin", "superadmin"),
    verifyReportController,
);

router.post(
    "/:reportId/dismiss",
    requireAuth,
    requireRole("admin", "superadmin"),
    dismissReportController,
);

router.delete(
    "/:reportId",
    requireAuth,
    requireRole("admin", "superadmin"),
    deleteReportController,
);

export default router;
