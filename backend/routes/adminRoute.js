import express from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import {
    getEventsListController,
    getUsersListController,
    loginAdminController,
    registerAdminController,
    suspendUserController,
    unsuspendUserController,
} from "../controllers/adminController.js";

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

export default router;
