import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
    addProfile,
    retrieveProfile,
    editProfile,
    removeProfile,
    retrievePublicProfile,
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
router.delete("/", requireAuth, removeProfile);
router.get("/:userId/public", requireAuth, retrievePublicProfile);

export default router;
