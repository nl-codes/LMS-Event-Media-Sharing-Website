import { Event } from "../models/eventModel.js";
import {
    constructStripeWebhookEvent,
    createStripeCheckoutSession,
    getTierUpgradeValues,
} from "../services/stripeService.js";

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

export const handleStripeWebhook = async (req, res) => {
    try {
        const signature = req.headers["stripe-signature"];
        const event = constructStripeWebhookEvent(req.body, signature);

        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            const metadata = session.metadata || {};
            const { eventId, tier } = metadata;

            if (!eventId || !tier) {
                return res.status(400).json({
                    success: false,
                    message: "Missing event metadata in checkout session",
                });
            }

            const upgrade = getTierUpgradeValues(tier);

            await Event.findByIdAndUpdate(eventId, {
                isPremium: upgrade.isPremium,
                tier: upgrade.tier,
                expiresAt: upgrade.expiresAt,
                uploadLimit: upgrade.uploadLimit,
            });
        }

        return res.status(200).json({ received: true });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
