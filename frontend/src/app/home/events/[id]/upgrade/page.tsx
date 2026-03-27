"use client";

import { PRICING_TIERS_CONST } from "@/app/pricing/page";
import PricingCardsGrid from "@/components/pricing/PricingCardsGrid";
import { initiateStripeCheckout } from "@/lib/stripe";
import { TierKey } from "@/types/Pricing";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

const tiers = PRICING_TIERS_CONST;

export default function PricingPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const lastHandledPaymentRef = useRef<string | null>(null);
    const eventId = typeof params?.id === "string" ? params.id : "";
    const paymentStatus = searchParams.get("payment");

    useEffect(() => {
        if (!paymentStatus || paymentStatus === lastHandledPaymentRef.current) {
            return;
        }

        if (paymentStatus === "cancel") {
            toast.error("Payment canceled. No changes were made.");
        }

        lastHandledPaymentRef.current = paymentStatus;
    }, [paymentStatus]);

    const handleCheckout = async (tier: TierKey) => {
        if (tier === "free") {
            router.push("/home/events");
            return;
        }

        if (!eventId) {
            toast.error("Missing event id");
            return;
        }

        try {
            await initiateStripeCheckout(eventId, tier);
        } catch (error) {
            console.error("Stripe checkout failed:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to start checkout",
            );
        }
    };

    return (
        <main className="min-h-screen bg-cuscream selection:bg-cusblue/20 px-4 py-4 text-slate-900 sm:px-8">
            <div className="relative z-10 mx-auto w-full max-w-6xl">
                <div className="mx-auto mb-20 max-w-3xl text-center">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-cusblue shadow-sm">
                        <Sparkles className="h-3.5 w-3.5" />
                        Simple Pricing
                    </div>
                    <h1 className="mb-6 text-5xl font-black tracking-tight text-slate-900 sm:text-7xl">
                        Event plans for <br />
                        <span className="bg-linear-to-r from-cusblue to-cusviolet bg-clip-text text-transparent">
                            every scale.
                        </span>
                    </h1>
                    <p className="mx-auto max-w-lg text-lg font-medium leading-relaxed text-slate-500">
                        Pay once and Access Forever. Start for free and upgrade
                        as your event grows.
                    </p>
                </div>

                <PricingCardsGrid tiers={tiers} onCheckout={handleCheckout} />

                <div className="mt-8 text-center">
                    <div className="inline-flex flex-col items-center gap-4">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
                            Secure payment via Stripe
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
