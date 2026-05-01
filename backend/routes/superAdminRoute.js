import express from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { superAdminApproveAdminController } from "../controllers/superAdminController.js";

const router = express.Router();

router.post(
    "/approve-admin",
    requireAuth,
    requireRole("superadmin"),
    superAdminApproveAdminController,
);

export default router;
