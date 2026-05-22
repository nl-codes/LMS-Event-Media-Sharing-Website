/**
 * @module routes/paymentRoute
 * @description Mounted at `/payments`. Two Stripe Checkout flows:
 *
 *  - `/checkout` + `/confirm`            → event_upgrade (existing event).
 *  - `/event-checkout` + `.../confirm`   → event_create (paid event,
 *    created only after payment succeeds).
 *
 * The Stripe webhook itself lives in {@link module:routes/webhookRoutes}
 * because it needs the raw request body for signature verification.
 */

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

// attachEventId MUST run before multer so the Cloudinary storage params
// have the reserved id (otherwise the thumbnail uploads to an
// `events/undefined/...` folder).
router.post(
    "/event-checkout",
    requireAuth,
    attachEventId,
    uploadEventThumbnail.single("thumbnail"),
    startEventCreateCheckout,
);
router.post("/event-checkout/confirm", requireAuth, confirmEventCreateCheckout);

export default router;
