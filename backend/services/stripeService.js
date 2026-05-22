import Stripe from "stripe";
import { getTierLimits } from "../constants/tierLimits.js";

/**
 * @module services/stripeService
 * @description Thin Stripe SDK wrapper. Two flows are supported, tagged
 * by `metadata.purpose`: "event_upgrade" (existing event → paid tier) and
 * "event_create" (paid event materialized only after payment).
 */

const getStripeClient = () => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        throw new Error("Missing STRIPE_SECRET_KEY");
    }

    return new Stripe(secretKey);
};

const TIER_PRICE_LOOKUP = {
    premium: "premium",
    pro: "pro",
};

const FALLBACK_TIER_AMOUNT = {
    premium: 1950,
    pro: 4950,
};

/**
 * Normalize and validate a payable tier identifier.
 * @param {string} lookupKey
 * @returns {"premium"|"pro"}
 * @throws {Error} If missing or not a payable tier.
 */
export const normalizeTier = (lookupKey) => {
    if (!lookupKey || typeof lookupKey !== "string") {
        throw new Error("lookupKey is required");
    }

    const normalized = lookupKey.trim().toLowerCase();
    if (!Object.keys(TIER_PRICE_LOOKUP).includes(normalized)) {
        throw new Error("Only premium and pro tiers are payable");
    }

    return normalized;
};

/**
 * Look up a Stripe Price by lookup_key.
 * @param {string} lookupKey
 * @returns {Promise<{ price: object, tier: "premium"|"pro" }>}
 * @throws {Error} If no active Price is configured for the tier.
 */
export const findStripePriceByLookupKey = async (lookupKey) => {
    const stripe = getStripeClient();
    const normalized = normalizeTier(lookupKey);

    const priceList = await stripe.prices.list({
        active: true,
        lookup_keys: [TIER_PRICE_LOOKUP[normalized]],
        limit: 1,
    });

    const price = priceList.data?.[0];
    if (!price) {
        throw new Error(`No Stripe price found for lookup key: ${normalized}`);
    }

    return { price, tier: normalized };
};

/**
 * Build a Stripe line item, preferring lookup_key Prices and falling back
 * to inline price_data (FALLBACK_TIER_AMOUNT) for dev setups.
 * @param {"premium"|"pro"} tier
 * @param {string} productLabel Shown to the buyer on the fallback path.
 * @returns {Promise<object>}
 */
const buildLineItem = async (tier, productLabel) => {
    try {
        const { price } = await findStripePriceByLookupKey(tier);
        return { price: price.id, quantity: 1 };
    } catch (error) {
        const message = String(error?.message || "");
        const notFoundLookup = message.includes("No Stripe price found");

        if (!notFoundLookup) {
            throw error;
        }

        return {
            price_data: {
                currency: "usd",
                unit_amount: FALLBACK_TIER_AMOUNT[tier],
                product_data: { name: productLabel },
            },
            quantity: 1,
        };
    }
};

/**
 * Create a Checkout Session for the "event_upgrade" flow (an existing
 * free event being upgraded to a paid tier).
 * @param {{ eventId: string, userId: string, lookupKey: string }} input
 * @returns {Promise<object>} The Stripe session.
 */
export const createStripeCheckoutSession = async ({
    eventId,
    userId,
    lookupKey,
}) => {
    const stripe = getStripeClient();
    const tier = normalizeTier(lookupKey);
    const frontendUrl = process.env.FRONTEND_URL;

    const lineItem = await buildLineItem(
        tier,
        tier === "premium" ? "Premium Upgrade" : "Pro Upgrade",
    );

    const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [lineItem],
        metadata: {
            purpose: "event_upgrade",
            eventId,
            userId,
            tier,
        },
        success_url: `${frontendUrl}/home/events/${eventId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/home/events/${eventId}/upgrade?payment=cancel`,
    });

    return session;
};

/**
 * Create a Checkout Session for the "event_create" flow. The Event row is
 * NOT written yet — the payload sits in PendingEventCheckout and is
 * materialized by the confirm endpoint / webhook on success.
 * @param {{ userId: string, lookupKey: string, pendingCheckoutId: string }} input
 * @returns {Promise<object>} The Stripe session.
 */
export const createEventCreateCheckoutSession = async ({
    userId,
    lookupKey,
    pendingCheckoutId,
}) => {
    const stripe = getStripeClient();
    const tier = normalizeTier(lookupKey);
    const frontendUrl = process.env.FRONTEND_URL;

    const lineItem = await buildLineItem(
        tier,
        tier === "premium" ? "Premium Event" : "Pro Event",
    );

    const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [lineItem],
        metadata: {
            purpose: "event_create",
            userId,
            tier,
            pendingCheckoutId: String(pendingCheckoutId),
        },
        success_url: `${frontendUrl}/home/events/create/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/home/events/create?payment=cancelled`,
    });

    return session;
};

/**
 * Re-fetch a Checkout Session from Stripe (used to verify payment_status
 * before any DB side-effect).
 * @param {string} sessionId
 * @returns {Promise<object>}
 * @throws {Error} If sessionId is missing.
 */
export const getStripeCheckoutSession = async (sessionId) => {
    if (!sessionId) {
        throw new Error("sessionId is required");
    }

    const stripe = getStripeClient();
    return stripe.checkout.sessions.retrieve(sessionId);
};

/**
 * Verify a webhook signature and parse the event payload.
 * @param {Buffer|string} rawBody Raw request body.
 * @param {string} signature `stripe-signature` header.
 * @returns {object} The verified Stripe event.
 * @throws {Error} On missing signature or verification failure.
 */
export const constructStripeWebhookEvent = (rawBody, signature) => {
    const stripe = getStripeClient();
    if (!signature) {
        throw new Error("Missing Stripe signature");
    }

    return stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
    );
};

/**
 * Single source of truth for the Event fields a paid tier grants:
 * isPremium, expiresAt (1 month premium / 1 year pro from now),
 * uploadLimit.
 * @param {string} tier
 * @returns {{ tier: "premium"|"pro", isPremium: true, expiresAt: Date, uploadLimit: number }}
 */
export const getTierUpgradeValues = (tier) => {
    const normalized = normalizeTier(tier);
    const now = new Date();

    if (normalized === "premium") {
        const expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        return {
            tier: "premium",
            isPremium: true,
            expiresAt,
            uploadLimit: getTierLimits("premium").maxFiles,
        };
    }

    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    return {
        tier: "pro",
        isPremium: true,
        expiresAt,
        uploadLimit: getTierLimits("pro").maxFiles,
    };
};
