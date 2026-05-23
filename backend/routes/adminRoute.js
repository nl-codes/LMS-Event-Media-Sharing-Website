/**
 * @module routes/adminRoute
 * @description Mounted at `/admins`. Admin signup/login are public (no
 * session yet); everything else is gated by
 * `requireAuth + requireRole("admin")`. Superadmin endpoints live in
 * the separate `/superadmins` router.
 */

import express from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import {
    getEventDetailsController,
    getEventsListController,
    getUsersListController,
    loginAdminController,
    registerAdminController,
    suspendUserController,
    unsuspendUserController,
} from "../controllers/adminController.js";
import {
    getUserGrowthController,
    getEventGrowthController,
    getMediaGrowthController,
} from "../controllers/analyticsController.js";

const router = express.Router();

// Public routes (no auth required)
router.post("/signup", registerAdminController);
router.post("/login", loginAdminController);

router.get(
    "/list-users",
    requireAuth,
    requireRole("admin"),
    getUsersListController,
);

router.post(
    "/suspend-user",
    requireAuth,
    requireRole("admin"),
    suspendUserController,
);

router.post(
    "/unsuspend-user",
    requireAuth,
    requireRole("admin"),
    unsuspendUserController,
);

router.get(
    "/list-events",
    requireAuth,
    requireRole("admin"),
    getEventsListController,
);

router.get(
    "/event-details/:eventId",
    requireAuth,
    requireRole("admin"),
    getEventDetailsController,
);

router.get(
    "/analytics/users",
    requireAuth,
    requireRole("admin"),
    getUserGrowthController,
);

router.get(
    "/analytics/events",
    requireAuth,
    requireRole("admin"),
    getEventGrowthController,
);

router.get(
    "/analytics/media",
    requireAuth,
    requireRole("admin"),
    getMediaGrowthController,
);

export default router;
