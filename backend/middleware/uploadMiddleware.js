/**
 * @module middleware/uploadMiddleware
 * @description Multer + Cloudinary upload plumbing. Three flavours:
 *
 *  - {@link uploadUserProfile}: single profile picture under `lms/profiles/`.
 *  - {@link uploadEventThumbnail}: single event cover under
 *    `events/<id>/thumbnail/`. Requires `attachEventId` upstream.
 *  - {@link uploadEventMedia}: memory-storage multi-file gallery upload
 *    capped at 10 files, gated by {@link validateUploadTierLimits} after
 *    multer buffers them.
 *
 * Plus {@link handleMulterErrors} which translates multer's
 * `LIMIT_FILE_SIZE` into a clean 413 response.
 */

import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinaryConfig.js";
import { Event } from "../models/eventModel.js";
import {
    TIER_LIMITS,
    formatBytes,
    getTierLimits,
} from "../constants/tierLimits.js";

const profileStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "lms/profiles",
        allowed_formats: ["jpg", "png", "jpeg", "webp"],
    },
});

const eventStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req) => {
        const eventId = req.generatedEventId;

        return {
            folder: `events/${eventId}/thumbnail`,
            allowed_formats: ["jpg", "png", "jpeg", "webp"],
        };
    },
});

const uploadUserProfile = multer({ storage: profileStorage });
const uploadEventThumbnail = multer({ storage: eventStorage });

// Hard ceiling for multer: the largest per-file cap across all tiers and across both image and video, so oversized files for any tier/medium are dropped before buffering completes.
const MAX_TIER_FILE_BYTES = Math.max(
    ...Object.values(TIER_LIMITS).flatMap((t) => [
        t.maxFileSizeBytes,
        t.maxVideoBytes || 0,
    ]),
);

const uploadEventMedia = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_TIER_FILE_BYTES, files: 10 },
});

/**
 * Per-file size + media-type enforcement against the event's tier.
 * Runs AFTER multer has buffered the files (memory storage), so it can
 * inspect actual byte length + mimetype rather than trusting client claims.
 * Populates `req.eventTier` and `req.tierLimits` for downstream handlers.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
const validateUploadTierLimits = async (req, res, next) => {
    try {
        const eventId = req.body.eventId || req.query.eventId;
        if (!eventId) {
            return res.status(400).json({
                success: false,
                message: "eventId is required",
            });
        }

        const event = await Event.findById(eventId).select("tier");
        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found",
            });
        }

        const limits = getTierLimits(event.tier);
        const files = req.files || [];

        for (const file of files) {
            const isVideo = file.mimetype?.startsWith("video/");

            if (isVideo) {
                if (!limits.allowsVideo) {
                    return res.status(403).json({
                        success: false,
                        message: `Video uploads are not available on the ${event.tier} tier. Upgrade to Premium for video support.`,
                    });
                }
                if (file.size > limits.maxVideoBytes) {
                    return res.status(413).json({
                        success: false,
                        message: `Video "${file.originalname}" exceeds the ${formatBytes(
                            limits.maxVideoBytes,
                        )} per-video limit for the ${event.tier} tier.`,
                    });
                }
                continue;
            }

            if (file.size > limits.maxFileSizeBytes) {
                return res.status(413).json({
                    success: false,
                    message: `File "${file.originalname}" exceeds the ${formatBytes(
                        limits.maxFileSizeBytes,
                    )} per-file limit for the ${event.tier} tier.`,
                });
            }
        }

        req.eventTier = event.tier;
        req.tierLimits = limits;
        next();
    } catch (err) {
        next(err);
    }
};

/**
 * Express error-handler middleware that translates multer's
 * `LIMIT_FILE_SIZE` into a 413 with a human-readable byte cap and
 * other MulterErrors into 400s. Pass-through for anything else.
 * @param {Error} err
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
const handleMulterErrors = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
                success: false,
                message: `One or more files exceed the maximum allowed size of ${formatBytes(
                    MAX_TIER_FILE_BYTES,
                )}.`,
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
    return next(err);
};

export {
    uploadUserProfile,
    uploadEventThumbnail,
    uploadEventMedia,
    validateUploadTierLimits,
    handleMulterErrors,
};
