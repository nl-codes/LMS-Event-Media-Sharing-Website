import express from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import {
    superAdminApproveAdminController,
    superAdminListAdminsController,
    superAdminSuspendAdmin,
    superAdminUnsuspendAdmin,
} from "../controllers/superAdminController.js";

const router = express.Router();

router.post(
    "/approve-admin",
    requireAuth,
    requireRole("superadmin"),
    superAdminApproveAdminController,
);

router.get(
    "/list-admin",
    requireAuth,
    requireRole("superadmin"),
    superAdminListAdminsController,
);

router.post(
    "/suspend-admin",
    requireAuth,
    requireRole("superadmin"),
    superAdminSuspendAdmin,
);

router.post(
    "/unsuspend-admin",
    requireAuth,
    requireRole("superadmin"),
    superAdminUnsuspendAdmin,
);

export default router;
