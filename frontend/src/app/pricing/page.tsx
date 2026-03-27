"use client";

import PricingCardsGrid from "@/components/pricing/PricingCardsGrid";
import { useUser } from "@/context/UserContext";
import { PricingTier, TierKey } from "@/types/Pricing";
import { useRouter } from "next/navigation";
import { Sparkles, Zap } from "lucide-react";

export const PRICING_TIERS_CONST: PricingTier[] = [
    {
        key: "free",
        name: "Free",
        price: "$0",
        billing: "Always free",
        tagline:
            "Great for family gatherings, birthdays, and other small events.",
        features: [
            "Up to 100 uploads",
            "Unlimited guests",
            "Saved for 7 days",
            "Active for 24 hours",
        ],
        cta: "Start for Free",
        icon: Sparkles,
    },
    {
        key: "premium",
        name: "Premium",
        price: "$19.50",
        billing: "One-time fee",
        tagline: "Perfect for bachelor parties and mid-size college events.",
        features: [
            "Up to 500 uploads",
            "Unlimited guests",
            "Saved for 1 month",
            "High-Quality (HQ) uploads",
            "Download All feature",
        ],
        cta: "Upgrade to Premium",
        icon: Zap,
        highlighted: true,
    },
    {
        key: "pro",
        name: "Pro",
        price: "$49.50",
        billing: "One-time fee",
        tagline: "Best for large weddings, conferences, and public events.",
        features: [
            "Unlimited uploads",
            "Unlimited guests",
            "Saved for 1 year",
            "Active for 3 months",
            "Priority HQ processing",
        ],
        cta: "Go Pro",
        icon: Sparkles,
    },
];

export default function PricingPage() {
    const router = useRouter();
    const { user } = useUser();

    const handleCheckout = (tier: TierKey) => {
        if (!user) {
            router.push("/login");
            return;
        }

        if (tier === "free") {
            router.push("/home/events");
            return;
        }

        router.push("/home/events");
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

                <PricingCardsGrid
                    tiers={PRICING_TIERS_CONST}
                    onCheckout={handleCheckout}
                />

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
