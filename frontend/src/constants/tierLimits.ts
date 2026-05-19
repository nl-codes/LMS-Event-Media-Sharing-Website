export type TierKey = "free" | "premium" | "pro";

export type TierLimit = {
    maxFileSizeBytes: number;
    maxFiles: number;
};

export const TIER_LIMITS: Record<TierKey, TierLimit> = {
    free: {
        maxFileSizeBytes: 1 * 1024 * 1024,
        maxFiles: 100,
    },
    premium: {
        maxFileSizeBytes: 5 * 1024 * 1024,
        maxFiles: 200,
    },
    pro: {
        maxFileSizeBytes: 10 * 1024 * 1024,
        maxFiles: 500,
    },
};

export const DEFAULT_TIER: TierKey = "free";

export const getTierLimits = (tier: string | undefined | null): TierLimit =>
    TIER_LIMITS[
        (tier as TierKey) in TIER_LIMITS ? (tier as TierKey) : DEFAULT_TIER
    ];

export const formatBytes = (bytes: number): string => {
    if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
    if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${bytes} B`;
};
