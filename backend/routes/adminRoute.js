import express from "express";
import {
    loginAdminController,
    registerAdminController,
} from "../controllers/adminController.js";

const router = express.Router();

// Public routes (no auth required)
router.post("/signup", registerAdminController);
router.post("/login", loginAdminController);

export default router;
