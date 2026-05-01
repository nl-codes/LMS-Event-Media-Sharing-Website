import express from "express";
import { registerAdminController } from "../controllers/adminController.js";

const router = express.Router();

// Public routes (no auth required)
router.post("/signup", registerAdminController);

export default router;
