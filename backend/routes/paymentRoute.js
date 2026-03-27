import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
    confirmCheckoutSession,
    createCheckoutSession,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/checkout", requireAuth, createCheckoutSession);
router.post("/confirm", requireAuth, confirmCheckoutSession);

export default router;
