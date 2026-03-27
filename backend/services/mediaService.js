import Media from "../models/mediaModel.js";
import { Event } from "../models/eventModel.js";
import cloudinary from "../config/cloudinaryConfig.js";
import { isNowBetween } from "../utils/timeline.js";

// Upload multiple files to Cloudinary and save them to DB
export const uploadMultipleMedia = async (
    eventId,
    uploaderId,
    guestId,
    files,
) => {
    // Check event exists and is currently accepting uploads.
    const event = await Event.findById(eventId);
    if (!event) throw new Error("Event not found");

    if (
        event.status !== "Active" ||
        !isNowBetween(event.startTime, event.endTime) ||
        event.status === "Completed" ||
        event.status === "Cancelled"
    ) {
        throw new Error("Event is not accepting uploads");
    }

    if (!Array.isArray(files) || files.length === 0) {
        throw new Error("No files provided");
    }

    const uploadedAssets = [];
    const createdMediaIds = [];

    const results = await Promise.all(
        files.map(async (file) => {
            try {
                const mediaType = file?.mimetype?.startsWith("video/")
                    ? "video"
                    : "image";

                const uploadResult = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        {
                            resource_type:
                                mediaType === "video" ? "video" : "image",
                            folder: `events/${eventId}`,
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        },
                    );
                    stream.end(file.buffer);
                });

                uploadedAssets.push({
                    publicId: uploadResult.public_id,
                    mediaType,
                });

                const mediaDoc = new Media({
                    eventId,
                    uploaderId: uploaderId || null,
                    guestId: guestId || null,
                    mediaUrl: uploadResult.secure_url,
                    publicId: uploadResult.public_id,
                    mediaType,
                });
                await mediaDoc.save();
                createdMediaIds.push(mediaDoc._id);

                return { success: true, media: mediaDoc };
            } catch (error) {
                return { success: false, error };
            }
        }),
    );

    const failedResult = results.find((result) => !result.success);
    if (failedResult) {
        await Promise.all(
            uploadedAssets.map((asset) =>
                cloudinary.uploader.destroy(asset.publicId, {
                    resource_type:
                        asset.mediaType === "video" ? "video" : "image",
                }),
            ),
        );

        if (createdMediaIds.length > 0) {
            await Media.deleteMany({ _id: { $in: createdMediaIds } });
        }

        throw new Error(
            failedResult.error?.message || "Failed to upload media",
        );
    }

    return results.map((result) => result.media);
};

// Get all media for an event
export const getGallery = async (eventId) => {
    return Media.find({ eventId })
        .sort({ createdAt: -1 })
        .populate("uploaderId", "userName")
        .populate("guestId", "userName guest_id");
};

// Delete a media item
export const deleteMedia = async (mediaId, requesterId) => {
    const media = await Media.findById(mediaId);
    if (!media) throw new Error("Media not found");

    const event = await Event.findById(media.eventId).select("hostId");
    if (!event) throw new Error("Event not found");

    const isUploader =
        media.uploaderId && media.uploaderId.toString() === requesterId;
    const isEventCreator = event.hostId.toString() === requesterId;

    // Only uploader or event creator can delete
    if (isUploader || isEventCreator) {
        // Delete from Cloudinary
        await cloudinary.uploader.destroy(media.publicId, {
            resource_type: media.mediaType === "video" ? "video" : "image",
        });
        await media.deleteOne();
        return { success: true, message: "Media deleted" };
    } else {
        throw new Error("Not authorized to delete this media");
    }
};

// Toggle like/unlike
export const toggleLike = async (mediaId, userId) => {
    if (!userId) throw new Error("Guests cannot like media");
    const media = await Media.findById(mediaId);
    if (!media) throw new Error("Media not found");
    const idx = media.likedBy.findIndex((id) => id.toString() === userId);
    if (idx !== -1) {
        // Unlike
        media.likedBy.splice(idx, 1);
        media.likesCount = Math.max(0, media.likesCount - 1);
    } else {
        // Like
        media.likedBy.push(userId);
        media.likesCount += 1;
    }
    await media.save();
    return media;
};

// Get highlights for an event
export const getHighlights = async (eventId) => {
    return Media.find({ eventId, isHighlight: true })
        .sort({ createdAt: -1 })
        .populate("uploaderId", "userName")
        .populate("guestId", "userName guest_id");
};

// Delete all media for an event (auto-deletion)
export const deleteAllMediaForEvent = async (eventId) => {
    const mediaList = await Media.find({ eventId });
    for (const media of mediaList) {
        await cloudinary.uploader.destroy(media.publicId, {
            resource_type: media.mediaType === "video" ? "video" : "image",
        });
    }
    await Media.deleteMany({ eventId });
    return { success: true, message: "All media deleted for event" };
};

// Set label on media (host only)
export const setMediaLabel = async (mediaId, label, hostId, eventId) => {
    // Verify hostId is the host of eventId
    const event = await Event.findById(eventId);
    if (!event) throw new Error("Event not found");
    if (event.hostId.toString() !== hostId) throw new Error("Not authorized");
    const media = await Media.findById(mediaId);
    if (!media) throw new Error("Media not found");
    media.label = label;
    await media.save();
    return media;
};
