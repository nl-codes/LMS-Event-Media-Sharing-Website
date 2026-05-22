import mongoose from "mongoose";
import Media from "../models/mediaModel.js";
import { Event } from "../models/eventModel.js";
import Interaction from "../models/interactionModel.js";
import cloudinary from "../config/cloudinaryConfig.js";
import { attachAvatars } from "../utils/attachAvatars.js";
import { getTierLimits } from "../constants/tierLimits.js";
import { compressImageBuffer } from "../utils/imageCompression.js";
import { isEventFinished } from "../utils/eventDuration.js";

/**
 * @module services/mediaService
 * @description Media CRUD, Cloudinary upload, gallery reads, and the
 * upload-gate (tier caps + event status). Every read decorates results
 * with `{ likesCount, likedBy }` via {@link attachLikeMetadata}.
 */

/**
 * Decorate Media doc(s) with aggregated likesCount + likedBy ids.
 * @param {object|object[]} mediaDocs
 * @returns {Promise<object|object[]>} Same shape, enriched.
 */
const attachLikeMetadata = async (mediaDocs) => {
    const docs = Array.isArray(mediaDocs) ? mediaDocs : [mediaDocs];
    if (docs.length === 0) return mediaDocs;

    const mediaIds = docs.map((media) => media._id);
    const likeGroups = await Interaction.aggregate([
        {
            $match: {
                media: { $in: mediaIds },
                type: "like",
            },
        },
        {
            $group: {
                _id: "$media",
                likesCount: { $sum: 1 },
                likedBy: { $addToSet: "$author" },
            },
        },
    ]);

    const likesByMediaId = new Map(
        likeGroups.map((item) => [
            String(item._id),
            {
                likesCount: item.likesCount,
                likedBy: item.likedBy.map(String),
            },
        ]),
    );

    const enriched = docs.map((media) => {
        const plain =
            typeof media.toObject === "function" ? media.toObject() : media;
        const likeMetadata = likesByMediaId.get(String(plain._id)) || {
            likesCount: 0,
            likedBy: [],
        };

        return {
            ...plain,
            ...likeMetadata,
        };
    });

    return Array.isArray(mediaDocs) ? enriched : enriched[0];
};

const ensureEventExists = async (eventId) => {
    if (!mongoose.isValidObjectId(eventId)) {
        throw new Error("Event not found");
    }

    const eventExists = await Event.exists({ _id: eventId });
    if (!eventExists) {
        throw new Error("Event not found");
    }
};

// Upload multiple files to Cloudinary and save them to DB
/**
 * Authoritative upload gate. Validates event status/window and tier cap,
 * then uploads each file to Cloudinary and persists Media rows.
 * @param {string} eventId
 * @param {string|null} uploaderId Registered uploader, or null for guests.
 * @param {string|null} guestId Guest uploader, or null for users.
 * @param {Array<{ buffer: Buffer, mimetype: string, originalname?: string }>} files
 * @returns {Promise<{ uploaded: object[], pending: object[], hasVideos: boolean }>}
 * @throws {Error} On bad event status, capacity overflow, or upload failure.
 */
export const uploadMultipleMedia = async (
    eventId,
    uploaderId,
    guestId,
    files,
) => {
    // Check event exists and is currently accepting uploads.
    const event = await Event.findById(eventId);
    if (!event) throw new Error("Event not found");

    const now = new Date();
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);

    if (event.status === "Cancelled") {
        throw new Error(
            "This event has been cancelled and is no longer accepting uploads.",
        );
    }

    if (event.status === "Completed" || now > end) {
        throw new Error(
            "This event has ended. The upload window is now closed.",
        );
    }

    if (now < start) {
        const timeString = start.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
        throw new Error(
            `This event hasn't started yet. Please come back at ${timeString} to upload.`,
        );
    }

    if (event.status !== "Active") {
        throw new Error("Uploads are currently disabled for this event.");
    }

    if (!Array.isArray(files) || files.length === 0) {
        throw new Error("No files provided");
    }

    const tierLimits = getTierLimits(event.tier);
    const existingCount = await Media.countDocuments({ eventId });
    if (existingCount + files.length > tierLimits.maxFiles) {
        const remaining = Math.max(tierLimits.maxFiles - existingCount, 0);
        const reason =
            remaining === 0
                ? `Storage limit reached for your tier (${event.tier}). Upgrade to upload more.`
                : `Upload exceeds your ${event.tier} tier limit (${tierLimits.maxFiles} files). You have ${remaining} slot${remaining === 1 ? "" : "s"} remaining.`;
        const err = new Error(reason);
        err.status = 403;
        throw err;
    }

    const uploadedAssets = [];
    const createdMediaIds = [];
    const isPublic = event.privacy === "public";

    const results = await Promise.all(
        files.map(async (file) => {
            try {
                const mediaType = file?.mimetype?.startsWith("video/")
                    ? "video"
                    : "image";

                let uploadBuffer = file.buffer;
                const uploadOptions = {
                    resource_type: mediaType === "video" ? "video" : "image",
                    folder: `events/${eventId}`,
                    bytes_limit: tierLimits.maxFileSizeBytes,
                };

                if (mediaType === "image") {
                    const result = await compressImageBuffer(
                        file.buffer,
                        file.mimetype,
                    );
                    uploadBuffer = result.buffer;
                    uploadOptions.format = "webp";
                }

                const uploadResult = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        uploadOptions,
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        },
                    );
                    stream.end(uploadBuffer);
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
                    isPublic,
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
/**
 * Gallery for an event (visible media only, newest first), decorated
 * with like metadata.
 * @param {string} eventId
 * @returns {Promise<object[]>}
 */
export const getGallery = async (eventId) => {
    await ensureEventExists(eventId);

    const media = await Media.find({ eventId, isHidden: { $ne: true } })
        .sort({ createdAt: -1 })
        .populate("uploaderId", "userName")
        .populate("guestId", "userName guest_id");

    const withLikes = await attachLikeMetadata(media);
    return attachAvatars(withLikes, ["uploaderId"]);
};

const MAX_EXPLORE_LIMIT = 50;
const DEFAULT_EXPLORE_LIMIT = 20;

const encodeCursor = (doc) =>
    `${new Date(doc.createdAt).toISOString()}__${doc._id}`;

const decodeCursor = (cursor) => {
    if (!cursor || typeof cursor !== "string") return null;
    const [iso, id] = cursor.split("__");
    if (!iso || !id) return null;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;
    return { createdAt: date, id };
};

/**
 * Public explore feed: paginated newest-first across all isPublic, non-hidden
 * media.
 * @param {{ cursor?: string, limit?: number }} [opts]
 * @returns {Promise<{ items: object[], nextCursor: string|null }>}
 */
export const getExploreMedia = async ({ cursor, limit } = {}) => {
    const cappedLimit = Math.min(
        Math.max(parseInt(limit, 10) || DEFAULT_EXPLORE_LIMIT, 1),
        MAX_EXPLORE_LIMIT,
    );

    const filter = { isPublic: true, isHidden: { $ne: true } };
    const decoded = decodeCursor(cursor);
    if (decoded) {
        // Tie-break on _id when createdAt matches the cursor.
        filter.$or = [
            { createdAt: { $lt: decoded.createdAt } },
            { createdAt: decoded.createdAt, _id: { $lt: decoded.id } },
        ];
    }

    // Fetch one extra so we can tell whether more exist without a count query.
    const docs = await Media.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .limit(cappedLimit + 1)
        .populate("uploaderId", "userName")
        .populate("guestId", "userName guest_id")
        .populate("eventId", "eventName uniqueSlug");

    const hasMore = docs.length > cappedLimit;
    const page = hasMore ? docs.slice(0, cappedLimit) : docs;
    const nextCursor =
        hasMore && page.length > 0 ? encodeCursor(page[page.length - 1]) : null;

    const withLikes = await attachLikeMetadata(page);
    const items = await attachAvatars(withLikes, ["uploaderId"]);

    return {
        items,
        limit: cappedLimit,
        hasMore,
        nextCursor,
    };
};

/**
 * Fetch a single Media doc with like metadata + uploader avatar attached.
 * @param {string} mediaId
 * @returns {Promise<object>}
 * @throws {Error} If missing.
 */
export const getMediaById = async (mediaId) => {
    const media = await Media.findById(mediaId)
        .populate("eventId", "eventName uniqueSlug")
        .populate("uploaderId", "userName")
        .populate("guestId", "userName guest_id");

    if (!media) throw new Error("Media not found");
    const withLikes = await attachLikeMetadata(media);
    return attachAvatars(withLikes, ["uploaderId"]);
};

// Delete a media item
/**
 * Delete a single Media doc + its Cloudinary asset. Allowed for the
 * uploader or the event host.
 * @param {string} mediaId
 * @param {string} requesterId
 * @returns {Promise<{ deletedId: string }>}
 * @throws {Error} 404 if missing, 403 if not uploader/host.
 */
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
        await Interaction.deleteMany({ media: mediaId });
        await media.deleteOne();
        return { success: true, message: "Media deleted" };
    } else {
        throw new Error("Not authorized to delete this media");
    }
};

// Delete multiple media items (Host Or Uploader)
/**
 * Bulk delete with the same auth rules as {@link deleteMedia}.
 * @param {string[]} mediaIds
 * @param {string} requesterId
 * @returns {Promise<{ deletedIds: string[] }>}
 * @throws {Error} If a row in the set is not owned by the requester or host.
 */
export const deleteMultipleMedia = async (mediaIds, requesterId) => {
    if (!requesterId) throw new Error("Authentication required");

    if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
        throw new Error("mediaIds must be a non-empty array");
    }

    if (mediaIds.length > 20) {
        throw new Error("You can delete up to 20 media items at once");
    }

    const uniqueMediaIds = [...new Set(mediaIds.map(String))];

    const mediaDocs = await Media.find({ _id: { $in: uniqueMediaIds } }).select(
        "_id eventId publicId mediaType uploaderId",
    );

    if (mediaDocs.length !== uniqueMediaIds.length) {
        throw new Error("Some media items were not found");
    }

    const uniqueEventIds = [
        ...new Set(mediaDocs.map((m) => String(m.eventId))),
    ];

    const events = await Event.find({ _id: { $in: uniqueEventIds } }).select(
        "_id hostId",
    );

    if (events.length !== uniqueEventIds.length) {
        throw new Error("Some events were not found");
    }

    const eventHostMap = new Map(
        events.map((event) => [String(event._id), String(event.hostId)]),
    );

    for (const media of mediaDocs) {
        const hostId = eventHostMap.get(String(media.eventId));
        const uploaderId = media.uploaderId ? String(media.uploaderId) : null;
        const reqId = String(requesterId);

        const isHost = hostId === reqId;
        const isOwner = uploaderId === reqId;

        if (!isHost && !isOwner) {
            throw new Error("Not authorized to delete one or more media items");
        }
    }

    for (const media of mediaDocs) {
        try {
            await cloudinary.uploader.destroy(media.publicId, {
                resource_type: media.mediaType === "video" ? "video" : "image",
            });
        } catch (cloudErr) {
            console.error(
                `Failed to delete Cloudinary asset: ${media.publicId}`,
                cloudErr,
            );
            // Optionally continue to delete from DB even if Cloudinary fails
        }
    }

    // 4. Database Cleanup
    await Interaction.deleteMany({ media: { $in: uniqueMediaIds } });
    await Media.deleteMany({ _id: { $in: uniqueMediaIds } });

    return {
        success: true,
        message: `Successfully deleted ${mediaDocs.length} items`,
        deletedMedia: mediaDocs.map((media) => ({
            mediaId: String(media._id),
            eventId: String(media.eventId),
        })),
    };
};

// Get highlights for an event
/**
 * Highlight-marked media for an event, like-metadata-enriched.
 * @param {string} eventId
 * @returns {Promise<object[]>}
 */
export const getHighlights = async (eventId) => {
    await ensureEventExists(eventId);

    const highlights = await Media.find({ eventId, isHighlight: true })
        .sort({ createdAt: -1 })
        .populate("uploaderId", "userName")
        .populate("guestId", "userName guest_id");

    const withLikes = await attachLikeMetadata(highlights);
    return attachAvatars(withLikes, ["uploaderId"]);
};

// Delete all media for an event (auto-deletion)
/**
 * Wipe every Media row for an event. Used by event cleanup; does NOT
 * touch Cloudinary (that's handled by the cleanup processor).
 * @param {string} eventId
 * @returns {Promise<{ deletedCount: number }>}
 */
export const deleteAllMediaForEvent = async (eventId) => {
    const mediaList = await Media.find({ eventId });
    for (const media of mediaList) {
        await cloudinary.uploader.destroy(media.publicId, {
            resource_type: media.mediaType === "video" ? "video" : "image",
        });
    }
    await Interaction.deleteMany({
        media: { $in: mediaList.map((media) => media._id) },
    });
    await Media.deleteMany({ eventId });
    return { success: true, message: "All media deleted for event" };
};

// Tier usage snapshot for an event (used by upload UI)
/**
 * Capacity snapshot for the upload UI: used / max files, per-tier video
 * + size limits.
 * @param {string} eventId
 * @returns {Promise<{ tier: string, used: number, maxFiles: number, remaining: number, maxFileSizeBytes: number, atCapacity: boolean, allowsVideo: boolean, maxVideoBytes: number, maxVideoSeconds: number }>}
 * @throws {Error} 404 if event missing.
 */
export const getEventUsage = async (eventId) => {
    if (!mongoose.isValidObjectId(eventId)) {
        throw new Error("Event not found");
    }

    const event = await Event.findById(eventId).select("tier");
    if (!event) throw new Error("Event not found");

    const tier = event.tier || "free";
    const limits = getTierLimits(tier);
    const used = await Media.countDocuments({ eventId });

    return {
        tier,
        used,
        maxFiles: limits.maxFiles,
        remaining: Math.max(limits.maxFiles - used, 0),
        maxFileSizeBytes: limits.maxFileSizeBytes,
        atCapacity: used >= limits.maxFiles,
        allowsVideo: limits.allowsVideo,
        maxVideoBytes: limits.maxVideoBytes,
        maxVideoSeconds: limits.maxVideoSeconds,
    };
};

/**
 * Host-only highlight toggle for image media. Requires the event to be
 * finished (status or endTime).
 * @param {string} mediaId
 * @param {boolean} isHighlight
 * @param {string} requesterId Must be event.hostId.
 * @returns {Promise<{ _id: string, isHighlight: boolean }>}
 * @throws {Error} 404 missing, 403 non-host, 400 if event live or media non-image.
 */
export const updateMediaHighlight = async (
    mediaId,
    isHighlight,
    requesterId,
) => {
    const media = await Media.findById(mediaId);
    if (!media) {
        const err = new Error("Media not found");
        err.status = 404;
        throw err;
    }

    const event = await Event.findById(media.eventId).select(
        "hostId endTime status",
    );
    if (!event) {
        const err = new Error("Event not found");
        err.status = 404;
        throw err;
    }

    if (event.hostId.toString() !== String(requesterId)) {
        const err = new Error("Only the event host can change highlights");
        err.status = 403;
        throw err;
    }

    // A host who manually finishes an event should be able to curate
    // highlights immediately — without waiting for the calculated endTime.
    if (!isEventFinished(event)) {
        const err = new Error(
            "Highlights can only be updated after the event has ended.",
        );
        err.status = 400;
        throw err;
    }

    const type = (media.mediaType || "").toLowerCase();
    if (type !== "image" && type !== "photo") {
        const err = new Error("Only images can be marked as highlights.");
        err.status = 400;
        throw err;
    }

    media.isHighlight = Boolean(isHighlight);
    await media.save();
    return { _id: String(media._id), isHighlight: media.isHighlight };
};

/**
 * Host-only caption/label on a media row.
 * @param {string} mediaId
 * @param {string} label
 * @param {string} hostId Must match Event.hostId for the parent event.
 * @param {string} eventId
 * @returns {Promise<import("mongoose").Document>} Updated media.
 * @throws {Error} If event/media missing or hostId mismatch.
 */
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
