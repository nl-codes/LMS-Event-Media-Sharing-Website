import { backend_url } from "@/config/backend";
import type { Event } from "@/types/Event";
import { TierKey } from "@/types/Pricing";

type PaidTier = Exclude<TierKey, "free">;

type CheckoutSessionResponse = {
    success: boolean;
    message?: string;
    data?: {
        sessionId: string;
        url?: string;
        pendingCheckoutId?: string;
    };
};

type ConfirmCheckoutResponse = {
    success: boolean;
    message?: string;
};

type ConfirmEventCreateResponse = {
    success: boolean;
    message?: string;
    data?: Event;
};

export type EventCreateCheckoutPayload = {
    eventName: string;
    description?: string;
    location: string;
    startTime: string;
    privacy: "public" | "private";
    tier: PaidTier;
    thumbnail?: File | null;
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

export async function confirmStripeCheckoutSession(sessionId: string) {
    const response = await fetch(`${backend_url}/payments/confirm`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
    });

    const payload = (await response.json()) as ConfirmCheckoutResponse;

    if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to confirm payment");
    }
}

// Paid-tier event creation: posts the form (with optional thumbnail) and
// redirects to Stripe Checkout. No Event row is written server-side until
// confirmEventCreationCheckout reports success on return.
export async function startEventCreationCheckout(
    payload: EventCreateCheckoutPayload,
) {
    const formData = new FormData();
    formData.append("eventName", payload.eventName);
    formData.append("description", payload.description || "");
    formData.append("location", payload.location);
    formData.append("startTime", payload.startTime);
    formData.append("privacy", payload.privacy);
    formData.append("tier", payload.tier);
    if (payload.thumbnail instanceof File) {
        formData.append("thumbnail", payload.thumbnail);
    }

    const response = await fetch(`${backend_url}/payments/event-checkout`, {
        method: "POST",
        credentials: "include",
        body: formData,
    });

    const body = (await response.json()) as CheckoutSessionResponse;

    if (!response.ok || !body.success) {
        throw new Error(body.message || "Failed to start checkout");
    }

    if (body.data?.url) {
        window.location.assign(body.data.url);
        return;
    }

    throw new Error("Checkout URL missing from session response");
}

export async function confirmEventCreationCheckout(
    sessionId: string,
): Promise<Event> {
    const response = await fetch(
        `${backend_url}/payments/event-checkout/confirm`,
        {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ sessionId }),
        },
    );

    const payload = (await response.json()) as ConfirmEventCreateResponse;

    if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.message || "Failed to confirm event payment");
    }

    return payload.data;
}
