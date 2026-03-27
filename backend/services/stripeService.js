import Stripe from "stripe";

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

export const createStripeCheckoutSession = async ({
    eventId,
    userId,
    lookupKey,
}) => {
    const stripe = getStripeClient();
    const tier = normalizeTier(lookupKey);
    const frontendUrl = process.env.FRONTEND_URL;

    let lineItem;

    try {
        const { price } = await findStripePriceByLookupKey(tier);
        lineItem = { price: price.id, quantity: 1 };
    } catch (error) {
        const message = String(error?.message || "");
        const notFoundLookup = message.includes("No Stripe price found");

        if (!notFoundLookup) {
            throw error;
        }

        lineItem = {
            price_data: {
                currency: "usd",
                unit_amount: FALLBACK_TIER_AMOUNT[tier],
                product_data: {
                    name:
                        tier === "premium" ? "Premium Upgrade" : "Pro Upgrade",
                },
            },
            quantity: 1,
        };
    }

    const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [lineItem],
        metadata: {
            eventId,
            userId,
            tier,
        },
        success_url: `${frontendUrl}/home/events/${eventId}?payment=success`,
        cancel_url: `${frontendUrl}/home/events/${eventId}/upgrade?payment=cancel`,
    });

    return session;
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
            uploadLimit: 500,
        };
    }

    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    return {
        tier: "pro",
        isPremium: true,
        expiresAt,
        uploadLimit: 10000,
    };
};
