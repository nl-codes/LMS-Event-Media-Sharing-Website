const ONE_MB = 1024 * 1024;

export const TIER_LIMITS = {
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

export const DEFAULT_TIER = "free";

export const getTierLimits = (tier) =>
    TIER_LIMITS[tier] || TIER_LIMITS[DEFAULT_TIER];

export const formatBytes = (bytes) => {
    if (bytes >= ONE_MB) return `${Math.round(bytes / ONE_MB)} MB`;
    if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${bytes} B`;
};
