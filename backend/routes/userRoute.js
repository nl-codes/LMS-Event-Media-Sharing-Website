import express from "express";
import {
    activateUser,
    forgotPassword,
    loginUser,
    reactivateUser,
    registerUser,
    resetPasswordController,
} from "../controllers/userController.js";

const router = express.Router();

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.get("/activate", activateUser);
router.post("/resend-activation", reactivateUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPasswordController);

export default router;
