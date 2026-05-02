import express from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import {
    superAdminApproveAdminController,
    superAdminListAdminsController,
    superAdminSuspendAdmin,
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

export default router;
