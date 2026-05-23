/**
 * @module routes/webhookRoutes
 * @description Mounted at `/webhooks`. Lives in a separate router from
 * the rest because it MUST be mounted BEFORE `express.json()` in
 * server.js — Stripe signature verification needs the unparsed raw
 * body, and the global JSON parser would consume it first.
 */

import express from "express";
import { handleStripeWebhook } from "../controllers/paymentController.js";

const router = express.Router();

// `express.raw` (not `express.json`) is the whole point of this router:
// it preserves the raw payload Stripe signs.
router.post(
    "/stripe",
    express.raw({ type: "application/json" }),
    handleStripeWebhook,
);

export default router;
