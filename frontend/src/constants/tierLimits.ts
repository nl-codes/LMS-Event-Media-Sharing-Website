export type TierKey = "free" | "premium" | "pro";

export type TierLimit = {
    maxFileSizeBytes: number;
    maxFiles: number;
    allowsVideo: boolean;
    maxVideoBytes: number;
    maxVideoSeconds: number;
};

const ONE_MB = 1024 * 1024;

export const TIER_LIMITS: Record<TierKey, TierLimit> = {
    free: {
        maxFileSizeBytes: 1 * ONE_MB,
        maxFiles: 100,
        allowsVideo: false,
        maxVideoBytes: 0,
        maxVideoSeconds: 0,
    },
    premium: {
        maxFileSizeBytes: 5 * ONE_MB,
        maxFiles: 200,
        allowsVideo: true,
        maxVideoBytes: 10 * ONE_MB,
        maxVideoSeconds: 15,
    },
    pro: {
        maxFileSizeBytes: 10 * ONE_MB,
        maxFiles: 500,
        allowsVideo: true,
        maxVideoBytes: 20 * ONE_MB,
        maxVideoSeconds: 60,
    },
};

export const DEFAULT_TIER: TierKey = "free";

export const getTierLimits = (tier: string | undefined | null): TierLimit =>
    TIER_LIMITS[
        (tier as TierKey) in TIER_LIMITS ? (tier as TierKey) : DEFAULT_TIER
    ];

export const formatBytes = (bytes: number): string => {
    if (bytes >= ONE_MB) return `${Math.round(bytes / ONE_MB)} MB`;
    if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${bytes} B`;
};
