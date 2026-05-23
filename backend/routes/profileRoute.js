/**
 * @module routes/profileRoute
 * @description Mounted at `/users/profile`. The caller's own Profile CRUD
 * plus the public "view another user" endpoint. Multipart uploads
 * (`profilePicture`) flow through {@link uploadUserProfile} (multer +
 * Cloudinary storage) BEFORE the controller by the time the controller
 * runs, `req.file.path` is already a Cloudinary URL.
 */

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
