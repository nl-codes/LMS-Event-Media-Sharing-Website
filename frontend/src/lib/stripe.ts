import { backend_url } from "@/config/backend";
import { TierKey } from "@/types/Pricing";

type PaidTier = Exclude<TierKey, "free">;

type CheckoutSessionResponse = {
    success: boolean;
    message?: string;
    data?: {
        sessionId: string;
        url?: string;
    };
};

export async function initiateStripeCheckout(eventId: string, tier: PaidTier) {
    const response = await fetch(`${backend_url}/payments/checkout`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            eventId,
            lookupKey: tier,
        }),
    });

    const payload = (await response.json()) as CheckoutSessionResponse;

    if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to create checkout session");
    }

    if (payload.data?.url) {
        window.location.assign(payload.data.url);
        return;
    }

    throw new Error("Checkout URL missing from session response");
}
