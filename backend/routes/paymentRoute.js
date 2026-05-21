import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { attachEventId } from "../middleware/utilsMiddleware.js";
import { uploadEventThumbnail } from "../middleware/uploadMiddleware.js";
import {
    confirmCheckoutSession,
    confirmEventCreateCheckout,
    createCheckoutSession,
    startEventCreateCheckout,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/checkout", requireAuth, createCheckoutSession);
router.post("/confirm", requireAuth, confirmCheckoutSession);

router.post(
    "/event-checkout",
    requireAuth,
    attachEventId,
    uploadEventThumbnail.single("thumbnail"),
    startEventCreateCheckout,
);
router.post("/event-checkout/confirm", requireAuth, confirmEventCreateCheckout);

export default router;
