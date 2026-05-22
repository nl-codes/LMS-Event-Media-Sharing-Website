/**
 * @module controllers/paymentController
 * @description Two Stripe flows live here, distinguished by
 * `session.metadata.purpose`:
 *
 *   - "event_upgrade" — upgrade an existing free event to a paid tier
 *     (sync confirm endpoint + webhook idempotent).
 *   - "event_create"  — create a paid event; the Event row is materialised
 *     only after Stripe confirms payment.
 *
 * Both flows route through {@link finalizePendingEventCheckout} /
 * {@link applyEventUpgrade} so the success-page redirect and the webhook
 * can race safely.
 */

import mongoose from "mongoose";
import { Event } from "../models/eventModel.js";
import { PendingEventCheckout } from "../models/pendingEventCheckoutModel.js";
import {
    constructStripeWebhookEvent,
    createEventCreateCheckoutSession,
    createStripeCheckoutSession,
    getStripeCheckoutSession,
    getTierUpgradeValues,
    normalizeTier,
} from "../services/stripeService.js";
import { calculateEventEndTime } from "../utils/eventDuration.js";
import { createEvent } from "../services/eventService.js";

/**
 * Apply the paid-tier grant to an existing Event row and recalculate
 * endTime against the new tier so the upload window matches what was
 * actually paid for.
 * @param {string} eventId
 * @param {string} tier
 * @returns {Promise<import("mongoose").Document|null>}
 */
const applyEventUpgrade = async (eventId, tier) => {
    const upgrade = getTierUpgradeValues(tier);
    const event = await Event.findById(eventId).select("startTime status");

    const updates = {
        isPremium: upgrade.isPremium,
        tier: upgrade.tier,
        expiresAt: upgrade.expiresAt,
        uploadLimit: upgrade.uploadLimit,
    };

    if (event) {
        updates.endTime = calculateEventEndTime(event.startTime, upgrade.tier);
    }

    return Event.findByIdAndUpdate(eventId, updates, { new: true });
};

/**
 * POST /payments/checkout
 *
 * Start an "event_upgrade" Stripe Checkout session for an event the
 * authenticated user hosts. Refuses if the event is already premium.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const createCheckoutSession = async (req, res) => {
    try {
        const { eventId, userId, lookupKey } = req.body;
        const authenticatedUserId = req.user?.id;

        if (!eventId || !lookupKey) {
            return res.status(400).json({
                success: false,
                message: "eventId and lookupKey are required",
            });
        }

        if (!authenticatedUserId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        if (userId && userId !== authenticatedUserId) {
            return res.status(403).json({
                success: false,
                message: "userId does not match authenticated user",
            });
        }

        const event = await Event.findById(eventId).select(
            "_id hostId isPremium",
        );
        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found",
            });
        }

        if (event.hostId.toString() !== authenticatedUserId) {
            return res.status(403).json({
                success: false,
                message: "Only the event host can upgrade this event",
            });
        }

        if (event.isPremium === true) {
            return res.status(403).json({
                success: false,
                message: "Event is already upgraded",
            });
        }

        const session = await createStripeCheckoutSession({
            eventId,
            userId: authenticatedUserId,
            lookupKey,
        });

        return res.status(200).json({
            success: true,
            data: {
                sessionId: session.id,
                url: session.url,
            },
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * POST /payments/event-checkout
 *
 * Pre-checkout entrypoint for paid event creation. The Event is NOT
 * created here — we persist the validated payload to PendingEventCheckout
 * keyed by the (yet-to-be-created) Stripe session id and hand back the
 * Checkout URL. The Event materialises later in
 * {@link finalizePendingEventCheckout} on payment success.
 *
 * Notable details:
 *  - `attachEventId` pre-mints an ObjectId so the thumbnail Cloudinary
 *    folder matches the eventual Event id.
 *  - We insert the pending row with a placeholder sessionId first, call
 *    Stripe, then patch in the real sessionId. If Stripe fails we roll
 *    back the row to avoid a dead pending record.
 *  - TTL on the pending row is sized just past Stripe's 24h session expiry.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const startEventCreateCheckout = async (req, res) => {
    try {
        const authenticatedUserId = req.user?.id;
        if (!authenticatedUserId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const { tier: rawTier } = req.body;
        let tier;
        try {
            tier = normalizeTier(rawTier);
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: err.message,
            });
        }

        const { eventName, description, location, startTime, privacy } =
            req.body;

        if (!eventName || !location || !startTime) {
            return res.status(400).json({
                success: false,
                message: "Event name, location, and start time are required",
            });
        }

        const parsedStart = new Date(startTime);
        if (Number.isNaN(parsedStart.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid start time",
            });
        }

        // attachEventId middleware pre-generated the id so the thumbnail
        // Cloudinary upload (if any) lives under the same events/<id> folder
        // that the final Event will use.
        const reservedEventId = req.generatedEventId;
        const thumbnail = req.file?.path || "";

        // Stripe sessions expire ~24h later; align the pending record TTL.
        const expiresAt = new Date(Date.now() + 25 * 60 * 60 * 1000);

        const pending = await PendingEventCheckout.create({
            hostId: authenticatedUserId,
            reservedEventId,
            // Temporary placeholder; replaced once Stripe returns a session id.
            sessionId: `pending-${new mongoose.Types.ObjectId().toString()}`,
            tier,
            eventData: {
                eventName,
                description: description || "",
                location,
                startTime: parsedStart,
                privacy: privacy === "public" ? "public" : "private",
                thumbnail,
            },
            status: "pending",
            expiresAt,
        });

        let session;
        try {
            session = await createEventCreateCheckoutSession({
                userId: authenticatedUserId,
                lookupKey: tier,
                pendingCheckoutId: pending._id,
            });
        } catch (err) {
            // Roll back the placeholder so we don't leave a dead pending row.
            await PendingEventCheckout.deleteOne({ _id: pending._id });
            throw err;
        }

        pending.sessionId = session.id;
        await pending.save();

        return res.status(200).json({
            success: true,
            data: {
                sessionId: session.id,
                url: session.url,
                pendingCheckoutId: String(pending._id),
            },
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Idempotent finaliser for the "event_create" flow. Creates the Event if
 * Stripe confirms payment and the pending record hasn't been materialised
 * yet; otherwise returns the existing event. Safe to call from both the
 * success-page confirm endpoint and the webhook (they can race).
 *
 * Verification layers (all required):
 *  - PendingEventCheckout exists and is owned by `expectedUserId`.
 *  - Stripe payment_status === "paid".
 *  - Stripe metadata.purpose === "event_create".
 *  - Stripe metadata.userId matches the pending row's host.
 *
 * @param {{ sessionId: string, expectedUserId?: string, stripeSession?: object }} input
 * @returns {Promise<{ event: object, pending: import("mongoose").Document, alreadyCompleted: boolean }>}
 * @throws {Error} 404 missing, 403 mismatch, 400 unpaid / wrong purpose / cancelled.
 */
const finalizePendingEventCheckout = async ({
    sessionId,
    expectedUserId,
    stripeSession,
}) => {
    const pending = await PendingEventCheckout.findOne({ sessionId });
    if (!pending) {
        const err = new Error("Pending event checkout not found");
        err.status = 404;
        throw err;
    }

    if (expectedUserId && pending.hostId.toString() !== expectedUserId) {
        const err = new Error("Session does not belong to authenticated user");
        err.status = 403;
        throw err;
    }

    // Already finalized — return the previously created event without doing
    // anything else. This makes both webhook + redirect-confirm safe to race.
    if (pending.status === "completed" && pending.createdEventId) {
        const event = await Event.findById(pending.createdEventId).populate(
            "hostId",
            "userName email",
        );
        return { event, pending, alreadyCompleted: true };
    }

    if (pending.status === "cancelled" || pending.status === "expired") {
        const err = new Error(
            `Pending event checkout is ${pending.status} and cannot be confirmed.`,
        );
        err.status = 400;
        throw err;
    }

    // Re-verify with Stripe — never trust client-provided session_id alone.
    const session =
        stripeSession || (await getStripeCheckoutSession(sessionId));
    if (session.payment_status !== "paid") {
        const err = new Error("Checkout session is not paid");
        err.status = 400;
        throw err;
    }

    const metadata = session.metadata || {};
    if (metadata.purpose !== "event_create") {
        const err = new Error("Stripe session is not an event-create checkout");
        err.status = 400;
        throw err;
    }
    if (metadata.userId && metadata.userId !== pending.hostId.toString()) {
        const err = new Error("Stripe session host mismatch");
        err.status = 403;
        throw err;
    }

    const upgrade = getTierUpgradeValues(pending.tier);
    const event = await createEvent({
        _id: pending.reservedEventId,
        hostId: pending.hostId,
        eventName: pending.eventData.eventName,
        description: pending.eventData.description,
        location: pending.eventData.location,
        startTime: pending.eventData.startTime,
        privacy: pending.eventData.privacy,
        thumbnail: pending.eventData.thumbnail,
        tier: pending.tier,
        isPremium: upgrade.isPremium,
        expiresAt: upgrade.expiresAt,
        uploadLimit: upgrade.uploadLimit,
    });

    pending.status = "completed";
    pending.createdEventId = event._id;
    await pending.save();

    return { event, pending, alreadyCompleted: false };
};

/**
 * POST /payments/event-checkout/confirm
 *
 * Success-page callback for the "event_create" flow. Verifies the session
 * via {@link finalizePendingEventCheckout} and returns the materialised
 * event. Safe to call multiple times.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const confirmEventCreateCheckout = async (req, res) => {
    try {
        const authenticatedUserId = req.user?.id;
        if (!authenticatedUserId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const { sessionId } = req.body;
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "sessionId is required",
            });
        }

        const { event } = await finalizePendingEventCheckout({
            sessionId,
            expectedUserId: authenticatedUserId,
        });

        return res.status(200).json({
            success: true,
            message: "Payment confirmed and event created",
            data: event,
        });
    } catch (error) {
        return res.status(error.status || 400).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * POST /webhooks/stripe
 *
 * Stripe webhook entrypoint. The raw-body mount in server.js is required
 * for signature verification. Dispatches `checkout.session.completed` by
 * `metadata.purpose`:
 *
 *  - "event_create" → idempotent finalize (failures logged + swallowed so
 *    Stripe doesn't retry forever on a permanent error).
 *  - "event_upgrade" (default) → apply the tier grant in-line.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const handleStripeWebhook = async (req, res) => {
    try {
        const signature = req.headers["stripe-signature"];
        const event = constructStripeWebhookEvent(req.body, signature);

        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            const metadata = session.metadata || {};
            // Default to "event_upgrade" for sessions created before the
            // purpose tag existed — older upgrade sessions still need to
            // finish materialising.
            const purpose = metadata.purpose || "event_upgrade";

            if (purpose === "event_create") {
                try {
                    await finalizePendingEventCheckout({
                        sessionId: session.id,
                        stripeSession: session,
                    });
                } catch (err) {
                    // Log + swallow so Stripe doesn't keep retrying a job
                    // that will never succeed (e.g. missing pending row).
                    console.warn(
                        `[stripe-webhook] event_create finalize failed for ${session.id}:`,
                        err.message,
                    );
                }
            } else {
                const { eventId, tier } = metadata;

                if (!eventId || !tier) {
                    return res.status(400).json({
                        success: false,
                        message: "Missing event metadata in checkout session",
                    });
                }

                await applyEventUpgrade(eventId, tier);
            }
        }

        return res.status(200).json({ received: true });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * POST /payments/confirm
 *
 * Success-page callback for the "event_upgrade" flow. Re-verifies the
 * session with Stripe (never trust the client-supplied session id alone)
 * and applies the grant. Rejects non-upgrade purposes so this endpoint
 * can't be tricked into finishing an event_create session.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const confirmCheckoutSession = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const authenticatedUserId = req.user?.id;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "sessionId is required",
            });
        }

        if (!authenticatedUserId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const session = await getStripeCheckoutSession(sessionId);

        if (session.payment_status !== "paid") {
            return res.status(400).json({
                success: false,
                message: "Checkout session is not paid",
            });
        }

        const metadata = session.metadata || {};
        const purpose = metadata.purpose || "event_upgrade";

        if (purpose !== "event_upgrade") {
            return res.status(400).json({
                success: false,
                message:
                    "This session is not an event upgrade. Use the matching confirm endpoint for its purpose.",
            });
        }

        const { eventId, tier, userId } = metadata;

        if (!eventId || !tier || !userId) {
            return res.status(400).json({
                success: false,
                message: "Missing event metadata in checkout session",
            });
        }

        if (userId !== authenticatedUserId) {
            return res.status(403).json({
                success: false,
                message: "Session does not belong to authenticated user",
            });
        }

        const event = await Event.findById(eventId).select("_id hostId");
        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found",
            });
        }

        if (event.hostId.toString() !== authenticatedUserId) {
            return res.status(403).json({
                success: false,
                message: "Only the event host can confirm this upgrade",
            });
        }

        const updatedEvent = await applyEventUpgrade(eventId, tier);

        return res.status(200).json({
            success: true,
            message: "Payment confirmed and event upgraded",
            data: updatedEvent,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
