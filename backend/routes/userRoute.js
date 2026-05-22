/**
 * @module routes/userRoute
 * @description Mounted at `/users`. End-user auth lifecycle (signup,
 * login, activation, password reset, unsuspend appeal) plus the
 * `/me` session probe.
 */

import express from "express";
import {
    activateUser,
    forgotPassword,
    getMe,
    loginUser,
    logoutUser,
    reactivateUser,
    registerUser,
    resetPasswordController,
    submitUnsuspendAppeal,
} from "../controllers/userController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.get("/activate", activateUser);
router.post("/resend-activation", reactivateUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPasswordController);
router.post("/unsuspend-appeal", submitUnsuspendAppeal);

router.post("/logout", requireAuth, logoutUser);
router.get("/me", requireAuth, getMe);

export default router;
