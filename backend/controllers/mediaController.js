import {
    uploadMultipleMedia,
    getGallery,
    getMediaById,
    deleteMedia,
    deleteMultipleMedia,
    getHighlights,
    setMediaLabel,
    getEventUsage,
} from "../services/mediaService.js";
import Media from "../models/mediaModel.js";
import { getIO } from "../config/socketConfig.js";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { enqueueVideoJob } from "../queues/videoQueue.js";

const TMP_DIR = path.resolve("uploads/tmp");

const ensureTmpDir = async () => {
    await fs.mkdir(TMP_DIR, { recursive: true });
};

const writeVideoToTmp = async (file) => {
    await ensureTmpDir();
    const ext = path.extname(file.originalname) || ".bin";
    const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
    const filePath = path.join(TMP_DIR, filename);
    await fs.writeFile(filePath, file.buffer);
    return filePath;
};

// Handles POST /media/upload
export const uploadMediaController = async (req, res) => {
    try {
        const eventId = req.body.eventId || req.query.eventId;

        const uploaderId = req.user?.id || null;
        const guestId = req.guest?._id || null;

        if (!uploaderId && !guestId) {
            return res.status(401).json({
                success: false,
                message: "Authentication or guest verification required",
            });
        }

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

        const imageFiles = req.files.filter(
            (f) => !f.mimetype?.startsWith("video/"),
        );
        const videoFiles = req.files.filter((f) =>
            f.mimetype?.startsWith("video/"),
        );

        // Images: synchronous Cloudinary upload, immediate gallery emit.
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

            const io = getIO();
            mediaPayload.forEach((item) => {
                io.to(String(eventId)).emit("new_media", item);
            });
        }

        // Videos: persist to tmp, enqueue, return pending markers.
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

// Handles GET /media/usage/:eventId
export const getEventUsageController = async (req, res) => {
    try {
        const { eventId } = req.params;
        const usage = await getEventUsage(eventId);
        res.status(200).json({ success: true, data: usage });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

// Handles GET /media/:eventId
export const getGalleryController = async (req, res) => {
    try {
        const { eventId } = req.params;
        const gallery = await getGallery(eventId);
        res.status(200).json({ success: true, data: gallery });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

// Handles GET /media/item/:mediaId
export const getMediaByIdController = async (req, res) => {
    try {
        const { mediaId } = req.params;
        const media = await getMediaById(mediaId);
        res.status(200).json({ success: true, data: media });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

// Handles DELETE /media/:mediaId
export const deleteMediaController = async (req, res) => {
    try {
        const { mediaId } = req.params;
        const requesterId = req.user?.id;
        if (!requesterId) {
            return res
                .status(401)
                .json({ success: false, message: "Authentication required" });
        }

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

// Handles DELETE /media
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

// Handles GET /media/:eventId/highlights
export const getHighlightsController = async (req, res) => {
    try {
        const { eventId } = req.params;
        const highlights = await getHighlights(eventId);
        res.status(200).json({ success: true, data: highlights });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

// Handles PATCH /media/:mediaId/label
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
