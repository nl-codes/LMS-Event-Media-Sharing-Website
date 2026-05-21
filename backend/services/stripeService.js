import Stripe from "stripe";
import { getTierLimits } from "../constants/tierLimits.js";

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

export const getStripeCheckoutSession = async (sessionId) => {
    if (!sessionId) {
        throw new Error("sessionId is required");
    }

    const stripe = getStripeClient();
    return stripe.checkout.sessions.retrieve(sessionId);
};

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
