import {
    uploadMedia,
    getGallery,
    deleteMedia,
    toggleLike,
    getHighlights,
    setMediaLabel,
} from "../services/mediaService.js";
import Media from "../models/mediaModel.js";
import { getIO } from "../config/socketConfig.js";

// Handles POST /media/upload
export const uploadMediaController = async (req, res) => {
    try {
        const eventId = req.body.eventId || req.query.eventId;
        const mediaType = req.body.mediaType || req.query.mediaType;

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

        if (!eventId || !mediaType || !req.file) {
            return res
                .status(400)
                .json({ success: false, message: "Missing required fields" });
        }
        const fileBuffer = req.file.buffer;
        const media = await uploadMedia(
            eventId,
            uploaderId,
            guestId,
            fileBuffer,
            mediaType,
        );

        const savedMedia = await Media.findById(media._id)
            .populate("uploaderId", "userName")
            .populate("guestId", "userName guest_id");

        const mediaPayload = savedMedia ? savedMedia.toObject() : media;

        const io = getIO();
        io.to(String(eventId)).emit("new_media", mediaPayload);

        res.status(201).json({ success: true, data: mediaPayload });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
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

// Handles DELETE /media/:mediaId
export const deleteMediaController = async (req, res) => {
    try {
        const { mediaId } = req.params;
        const requesterId = req.user?.id;
        const requesterRole = req.user?.role;
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

        const result = await deleteMedia(mediaId, requesterId, requesterRole);

        const io = getIO();
        io.to(String(mediaDoc.eventId)).emit("media_deleted", { mediaId });

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        res.status(403).json({ success: false, message: error.message });
    }
};

// Handles POST /media/:mediaId/like
export const toggleLikeController = async (req, res) => {
    try {
        const { mediaId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res
                .status(401)
                .json({ success: false, message: "Authentication required" });
        }
        const updatedMedia = await toggleLike(mediaId, userId);

        const io = getIO();
        io.to(String(updatedMedia.eventId)).emit("media_liked", {
            mediaId,
            likesCount: updatedMedia.likesCount,
        });

        res.status(200).json({ success: true, data: updatedMedia });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
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
