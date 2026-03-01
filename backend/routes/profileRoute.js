import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { addProfile } from "../controllers/profileController.js";
import { uploadUserProfile } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post(
    "/",
    requireAuth,
    uploadUserProfile.single("profilePicture"),
    addProfile,
);

export default router;
