export type TierKey = "free" | "premium" | "pro";

export type PricingTier = {
    key: TierKey;
    name: string;
    price: string;
    billing: string;
    tagline: string;
    features: string[];
    cta: string;
    icon: React.ComponentType<{ className?: string }>;
    highlighted?: boolean;
};
