/**
 * @module constants/tierLimits
 * @description Per-tier capacity caps. Single source of truth shared by
 * the upload gate (`mediaService`, `uploadMiddleware`) and the
 * post-upgrade Event.uploadLimit write in `stripeService.getTierUpgradeValues`.
 * Update both backend and frontend mirrors together when tweaking these.
 */

const ONE_MB = 1024 * 1024;

/**
 * Per-tier limits: max file count, per-file size, video allow/cap.
 * @type {Record<"free"|"premium"|"pro", { maxFileSizeBytes: number, maxFiles: number, allowsVideo: boolean, maxVideoBytes: number, maxVideoSeconds: number }>}
 */
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

/** Falls back to this when a tier key isn't recognised. */
export const DEFAULT_TIER = "free";

/**
 * Tier-name → limit lookup with a safe fallback to the free defaults.
 * @param {string} tier
 * @returns {(typeof TIER_LIMITS)[keyof typeof TIER_LIMITS]}
 */
export const getTierLimits = (tier) =>
    TIER_LIMITS[tier] || TIER_LIMITS[DEFAULT_TIER];

/**
 * Human-friendly byte size: "12 MB", "300 KB", etc. Used in
 * 413/upload-gate error messages.
 * @param {number} bytes
 * @returns {string}
 */
export const formatBytes = (bytes) => {
    if (bytes >= ONE_MB) return `${Math.round(bytes / ONE_MB)} MB`;
    if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${bytes} B`;
};
