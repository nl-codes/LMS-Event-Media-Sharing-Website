declare module "@stripe/stripe-js" {
    export type RedirectToCheckoutResult = {
        error?: {
            message?: string;
        };
    };

    export type Stripe = {
        redirectToCheckout(options: {
            sessionId: string;
        }): Promise<RedirectToCheckoutResult>;
    };

    export function loadStripe(publishableKey: string): Promise<Stripe | null>;
}
