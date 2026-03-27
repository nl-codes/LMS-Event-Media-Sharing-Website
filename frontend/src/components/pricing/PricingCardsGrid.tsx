import { PricingTier, TierKey } from "@/types/Pricing";
import { ArrowRight, Check, Zap } from "lucide-react";

type PricingCardsGridProps = {
    tiers: PricingTier[];
    onCheckout: (tier: TierKey) => void | Promise<void>;
};

function PricingCard({
    tier,
    onCheckout,
}: {
    tier: PricingTier;
    onCheckout: (tier: TierKey) => void | Promise<void>;
}) {
    const Icon = tier.icon;

    return (
        <article
            className={[
                "group relative flex h-full flex-col rounded-[2.5rem] border p-8 transition-all duration-500",
                tier.highlighted
                    ? "border-cusblue/20 bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_-12px_rgba(59,130,246,0.15)]"
                    : "border-black/5 bg-white/40 hover:border-black/10 hover:bg-white/60 shadow-sm",
            ].join(" ")}>
            {tier.highlighted ? (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-linear-to-r from-cusblue to-cusviolet px-5 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-white shadow-lg">
                    <Zap className="h-3 w-3 fill-current" />
                    Most Popular
                </div>
            ) : null}

            <div className="mb-8 flex items-center justify-between">
                <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tier.highlighted ? "bg-cusblue/10 text-cusblue" : "bg-black/5 text-slate-500"}`}>
                    <Icon className="h-6 w-6" />
                </div>
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                    {tier.name}
                </h2>
            </div>

            <div className="mb-1 flex items-baseline gap-1">
                <span className="text-5xl font-black tracking-tighter text-slate-900">
                    {tier.price}
                </span>
            </div>
            <p className="mb-6 text-xs font-bold uppercase tracking-wider text-slate-400">
                {tier.billing}
            </p>

            <p className="mb-8 min-h-12 text-[15px] leading-relaxed text-slate-600">
                {tier.tagline}
            </p>

            <div className="mb-8 h-px w-full bg-black/5" />

            <div className="mb-10 flex-1">
                <ul className="space-y-4">
                    {tier.features.map((feature) => (
                        <li
                            key={feature}
                            className="flex items-center gap-3 text-[14px]">
                            <div
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${tier.highlighted ? "bg-cusblue/10 text-cusblue" : "bg-black/5 text-slate-400"}`}>
                                <Check className="h-3 w-3" strokeWidth={4} />
                            </div>
                            <span className="font-medium tracking-tight text-slate-600">
                                {feature}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            <button
                type="button"
                onClick={() => {
                    void onCheckout(tier.key);
                }}
                className={[
                    "group/btn relative flex items-center justify-center gap-2 overflow-hidden rounded-2xl px-6 py-4 text-sm font-bold transition-all duration-300 active:scale-[0.98]",
                    tier.highlighted
                        ? "bg-linear-to-r from-cusblue to-cusviolet text-white shadow-md hover:brightness-110"
                        : "bg-slate-900 text-white hover:bg-black",
                ].join(" ")}>
                <span className="relative z-10">{tier.cta}</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
            </button>
        </article>
    );
}

export default function PricingCardsGrid({
    tiers,
    onCheckout,
}: PricingCardsGridProps) {
    return (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {tiers.map((tier) => (
                <PricingCard
                    key={tier.key}
                    tier={tier}
                    onCheckout={onCheckout}
                />
            ))}
        </section>
    );
}
