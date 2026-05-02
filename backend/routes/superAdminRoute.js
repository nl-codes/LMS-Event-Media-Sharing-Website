import express from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import {
    superAdminApproveAdminController,
    superAdminListAdminsController,
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

export default router;
