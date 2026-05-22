/**
 * @module controllers/mediaController
 * @description HTTP layer for media upload, gallery reads, deletes, the
 * host highlight toggle, the explore feed, and event-capacity probes.
 * Images upload synchronously to Cloudinary; videos are persisted to a
 * tmp file and handed to the video queue for transcode + upload.
 */

import {
    uploadMultipleMedia,
    getGallery,
    getMediaById,
    deleteMedia,
    deleteMultipleMedia,
    getHighlights,
    setMediaLabel,
    updateMediaHighlight,
    getEventUsage,
    getExploreMedia,
} from "../services/mediaService.js";
import Media from "../models/mediaModel.js";
import { getIO } from "../config/socketConfig.js";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { enqueueVideoJob } from "../queues/videoQueue.js";
import { attachAvatars } from "../utils/attachAvatars.js";

const TMP_DIR = path.resolve("uploads/tmp");

/** Idempotent mkdir for the shared video staging dir. */
const ensureTmpDir = async () => {
    await fs.mkdir(TMP_DIR, { recursive: true });
};

/**
 * Spill an in-memory video buffer to disk for the video worker. Uses a
 * crypto-random name to avoid collisions across concurrent uploads.
 * @param {{ buffer: Buffer, originalname?: string }} file
 * @returns {Promise<string>} Absolute path to the staged file.
 */
const writeVideoToTmp = async (file) => {
    await ensureTmpDir();
    const ext = path.extname(file.originalname) || ".bin";
    const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
    const filePath = path.join(TMP_DIR, filename);
    await fs.writeFile(filePath, file.buffer);
    return filePath;
};

/**
 * POST /media/upload
 *
 * Accepts mixed image + video uploads from a registered user or a guest
 * scoped to the same event. Branches:
 *
 *  - Images: synchronous Cloudinary upload + Media row, then the new docs
 *    are broadcast over socket.io so live gallery viewers refresh without
 *    a poll. Response code 201.
 *  - Videos: spilled to disk and handed to the video queue; the response
 *    carries "pending" placeholders the gallery can render until the
 *    worker emits `new_media` with the encoded result. Response code 202.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const uploadMediaController = async (req, res) => {
    try {
        const eventId = req.body.eventId || req.query.eventId;

        // Either an authenticated user OR an identified guest is required.
        const uploaderId = req.user?.id || null;
        const guestId = req.guest?._id || null;

        if (!uploaderId && !guestId) {
            return res.status(401).json({
                success: false,
                message: "Authentication or guest verification required",
            });
        }

        // Guests are scoped to a single event — block cross-event reuse
        // even if someone copies the guest cookie around.
        if (
            req.guest?.eventId &&
            eventId &&
            String(req.guest.eventId) !== String(eventId)
        ) {
            return res.status(403).json({
                success: false,
                message: "Guest identity is not valid for this event",
            });
        }

        if (!eventId || !req.files || req.files.length === 0) {
            return res
                .status(400)
                .json({ success: false, message: "Missing required fields" });
        }

        // Split by mimetype: images go through the synchronous path,
        // videos defer to the queue.
        const imageFiles = req.files.filter(
            (f) => !f.mimetype?.startsWith("video/"),
        );
        const videoFiles = req.files.filter((f) =>
            f.mimetype?.startsWith("video/"),
        );

        // ── Images: synchronous Cloudinary upload, immediate gallery emit.
        let mediaPayload = [];
        if (imageFiles.length > 0) {
            const mediaDocs = await uploadMultipleMedia(
                eventId,
                uploaderId,
                guestId,
                imageFiles,
            );

            const savedMedia = await Media.find({
                _id: { $in: mediaDocs.map((media) => media._id) },
            })
                .populate("uploaderId", "userName")
                .populate("guestId", "userName guest_id");

            const mediaMap = new Map(
                savedMedia.map((media) => [String(media._id), media]),
            );
            mediaPayload = mediaDocs.map((media) => {
                const populated = mediaMap.get(String(media._id));
                const plain = populated
                    ? populated.toObject()
                    : media.toObject();
                return {
                    ...plain,
                    likesCount: 0,
                    likedBy: [],
                };
            });
            mediaPayload = await attachAvatars(mediaPayload, ["uploaderId"]);

            const io = getIO();
            mediaPayload.forEach((item) => {
                io.to(String(eventId)).emit("new_media", item);
            });
        }

        // ── Videos: persist to tmp, enqueue, return pending markers so
        // the gallery can render a "processing" tile until the worker
        // emits the final `new_media` event.
        const pendingVideos = [];
        for (const file of videoFiles) {
            try {
                const inputPath = await writeVideoToTmp(file);
                const job = await enqueueVideoJob({
                    inputPath,
                    eventId,
                    uploaderId,
                    guestId,
                    originalName: file.originalname,
                });
                pendingVideos.push({
                    jobId: job.id,
                    originalName: file.originalname,
                    mediaType: "video",
                    status: "processing",
                });
            } catch (err) {
                console.error("Failed to enqueue video job:", err);
                return res.status(503).json({
                    success: false,
                    message:
                        "Video processing service is currently unavailable. Please try again shortly.",
                });
            }
        }

        // 202 when there's at least one video pending; 201 when everything
        // landed synchronously.
        const status = videoFiles.length > 0 ? 202 : 201;
        res.status(status).json({
            success: true,
            data: mediaPayload,
            pending: pendingVideos,
        });
    } catch (error) {
        const status = error.status || 400;
        res.status(status).json({ success: false, message: error.message });
    }
};

/**
 * GET /media/usage/:eventId
 *
 * Tier capacity snapshot used by the upload UI.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const getEventUsageController = async (req, res) => {
    try {
        const { eventId } = req.params;
        const usage = await getEventUsage(eventId);
        res.status(200).json({ success: true, data: usage });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

/**
 * GET /media/explore?cursor=...&limit=20
 *
 * Public explore feed (cursor-paginated, newest first across isPublic media).
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const getExploreMediaController = async (req, res) => {
    try {
        const { cursor, limit } = req.query;
        const result = await getExploreMedia({ cursor, limit });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to load explore feed",
        });
    }
};

/**
 * GET /media/:eventId
 *
 * Full event gallery (like-metadata enriched).
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const getGalleryController = async (req, res) => {
    try {
        const { eventId } = req.params;
        const gallery = await getGallery(eventId);
        res.status(200).json({ success: true, data: gallery });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

/**
 * GET /media/item/:mediaId
 *
 * Single-media view (used by the lightbox / media detail page).
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const getMediaByIdController = async (req, res) => {
    try {
        const { mediaId } = req.params;
        const media = await getMediaById(mediaId);
        res.status(200).json({ success: true, data: media });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

/**
 * DELETE /media/:mediaId
 *
 * Single-media delete (uploader or host). The eventId is read BEFORE the
 * service call so the socket emit can still fire after the row is gone.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const deleteMediaController = async (req, res) => {
    try {
        const { mediaId } = req.params;
        const requesterId = req.user?.id;
        if (!requesterId) {
            return res
                .status(401)
                .json({ success: false, message: "Authentication required" });
        }

        // Resolve eventId up front so we can still emit `media_deleted`
        // after the service drops the row.
        const mediaDoc = await Media.findById(mediaId).select("eventId");
        if (!mediaDoc) {
            return res
                .status(404)
                .json({ success: false, message: "Media not found" });
        }

        const result = await deleteMedia(mediaId, requesterId);

        const io = getIO();
        io.to(String(mediaDoc.eventId)).emit("media_deleted", { mediaId });

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        res.status(403).json({ success: false, message: error.message });
    }
};

/**
 * DELETE /media
 *
 * Bulk delete. Per-event socket emits happen for each removed row so any
 * live gallery viewer prunes their grid.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const deleteMultipleMediaController = async (req, res) => {
    try {
        const requesterId = req.user?.id;
        if (!requesterId) {
            return res
                .status(401)
                .json({ success: false, message: "Authentication required" });
        }

        const { mediaIds } = req.body;
        if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "mediaIds must be a non-empty array",
            });
        }

        const result = await deleteMultipleMedia(mediaIds, requesterId);

        const io = getIO();
        result.deletedMedia.forEach(({ eventId, mediaId }) => {
            io.to(String(eventId)).emit("media_deleted", { mediaId });
        });

        res.status(200).json({
            success: true,
            message: result.message,
            data: { deletedCount: result.deletedMedia.length },
        });
    } catch (error) {
        res.status(403).json({ success: false, message: error.message });
    }
};

/**
 * GET /media/:eventId/highlights
 *
 * Highlight-marked media for an event. For paid+ended events these are
 * either curated by the host or selected by the highlight worker.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const getHighlightsController = async (req, res) => {
    try {
        const { eventId } = req.params;
        const highlights = await getHighlights(eventId);
        res.status(200).json({ success: true, data: highlights });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

/**
 * PATCH /media/:mediaId/label
 *
 * Host-only caption update on a media row.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const setMediaLabelController = async (req, res) => {
    try {
        const { mediaId } = req.params;
        const { label, eventId } = req.body;
        const hostId = req.user?.id;
        if (!hostId) {
            return res
                .status(401)
                .json({ success: false, message: "Authentication required" });
        }
        if (!label || !eventId) {
            return res
                .status(400)
                .json({ success: false, message: "Missing label or eventId" });
        }
        const media = await setMediaLabel(mediaId, label, hostId, eventId);
        res.status(200).json({ success: true, data: media });
    } catch (error) {
        res.status(403).json({ success: false, message: error.message });
    }
};

/**
 * PATCH /media/:mediaId/highlight
 *
 * Host-only manual highlight toggle. The service rejects non-image media
 * and refuses while the event is still live.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const updateMediaHighlightController = async (req, res) => {
    try {
        const { mediaId } = req.params;
        const { isHighlight } = req.body;
        const requesterId = req.user?.id;
        if (!requesterId) {
            return res
                .status(401)
                .json({ success: false, message: "Authentication required" });
        }
        if (typeof isHighlight !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "isHighlight must be a boolean",
            });
        }
        const result = await updateMediaHighlight(
            mediaId,
            isHighlight,
            requesterId,
        );
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        const status = error.status || 500;
        return res.status(status).json({
            success: false,
            message: error.message || "Failed to update highlight",
        });
    }
};
