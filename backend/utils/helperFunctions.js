/**
 * @module utils/helperFunctions
 * @description Grab-bag of small helpers used across the backend: error
 * construction, Cloudinary URL parsing, sanitised admin user shapes, and
 * the bucket-unit picker for event analytics charts.
 */

/**
 * Build a plain Error decorated with `.statusCode` so controllers can
 * map service errors straight to HTTP responses.
 * @param {number} statusCode
 * @param {string} message
 * @returns {Error & { statusCode: number }}
 */
export function makeError(statusCode, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

/**
 * Parse a Cloudinary asset URL into its `public_id` so we can issue
 * destroy calls. Best-effort: returns `null` if the URL shape isn't
 * recognised, and callers must skip the delete in that case.
 *
 * Strategy:
 *  1. Match `/v<digits>/<folder/path>.<ext>` (the canonical shape).
 *  2. Fallback: anything after `/upload/`, with leading version stripped.
 *
 * @param {string} url
 * @returns {string|null}
 */
export const extractPublicIdFromUrl = (url) => {
    if (!url || typeof url !== "string") return null;

    try {
        // Canonical shape: `/v<version>/<folder/...>/<name>.<ext>`.
        const match = url.match(/\/v\d+\/(.+)\.[a-z]+$/i);

        if (match && match[1]) {
            return match[1];
        }

        // Fallback for URLs missing the version tag.
        const uploadParts = url.split("/upload/");
        if (uploadParts.length > 1) {
            return uploadParts[1].split(".")[0].replace(/^v\d+\//, "");
        }

        return null;
    } catch (error) {
        console.error("Error extracting Public ID:", error);
        return null;
    }
};

/**
 * Project a User into the shape admin dashboards expect. Superadmins see
 * a few extra moderation fields; regular admins see the safe subset.
 * @param {object} user
 * @param {string} [requesterRole]
 * @returns {object|null}
 */
export const safeUserForAdmin = (user, requesterRole) => {
    if (!user) return null;

    const userData = {
        _id: user._id,
        userName: user.userName,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
    };

    if (requesterRole === "superadmin") {
        userData.suspensionCount = user.suspensionCount || 0;
        userData.adminRequestStatus = user.adminRequestStatus;
    }

    return userData;
};

/**
 * Pick a chart bucket size ("minute" | "hour" | "day") so a series
 * spanning the event's full duration stays under ~10k points.
 * @param {{ startTime: Date|string, endTime: Date|string }} event
 * @returns {"minute"|"hour"|"day"}
 */
export const getEventBucketUnit = (event) => {
    const start = new Date(event.startTime).getTime();
    const end = new Date(event.endTime).getTime();
    const range = Math.max(1, end - start);
    const maxPoints = 10000;
    const msPerPoint = Math.ceil(range / maxPoints);

    if (msPerPoint <= 60 * 1000) return "minute";
    if (msPerPoint <= 60 * 60 * 1000) return "hour";
    return "day";
};
