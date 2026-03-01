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
} from "../controllers/userController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/signup", registerUser);
router.post("/login", loginUser);
router.get("/activate", activateUser);
router.post("/resend-activation", reactivateUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPasswordController);

// Protected routes
router.post("/logout", requireAuth, logoutUser);
router.get("/me", requireAuth, getMe);

export default router;
