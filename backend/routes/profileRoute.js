import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
    addProfile,
    retrieveProfile,
    editProfile,
} from "../controllers/profileController.js";
import { uploadUserProfile } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post(
    "/",
    requireAuth,
    uploadUserProfile.single("profilePicture"),
    addProfile,
);
router.get("/", requireAuth, retrieveProfile);
router.put(
    "/",
    requireAuth,
    uploadUserProfile.single("profilePicture"),
    editProfile,
);

export default router;
