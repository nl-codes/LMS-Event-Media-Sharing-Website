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

// Any authenticated user can file a report
router.post("/", requireAuth, createReportController);

// A user can list their own flagged media
router.get("/flagged-media", requireAuth, getFlaggedMediaController);

// Admin moderation queue
router.get(
    "/",
    requireAuth,
    requireRole("admin", "superadmin"),
    listReportsController,
);

// Report detail (admins + reporters can view; service does not filter,
// frontend gates by role — keep simple here and allow any authenticated user)
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
