import {
    uploadMedia,
    getGallery,
    deleteMedia,
    toggleLike,
    getHighlights,
    setMediaLabel,
} from "../services/mediaService.js";

// Handles POST /media/upload
export const uploadMediaController = async (req, res) => {
    try {
        console.log(req.user);
        // Auth: userId from req.user (if present), else guestId from req.body
        const eventId = req.body.eventId || req.query.eventId;
        const mediaType = req.body.mediaType || req.query.mediaType;
        let uploaderId = null;
        let guestId = null;
        if (req.user && req.user.id) {
            uploaderId = req.user.id;
        } else if (req.body.guestId) {
            guestId = req.body.guestId;
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
        res.status(201).json({ success: true, data: media });
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
        const result = await deleteMedia(mediaId, requesterId, requesterRole);
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
        const media = await toggleLike(mediaId, userId);
        res.status(200).json({ success: true, data: media });
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
