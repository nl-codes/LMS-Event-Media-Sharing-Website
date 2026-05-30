import mongoose from "mongoose";
import { Event } from "../models/eventModel.js";
import { EventMembership } from "../models/eventMembershipModel.js";
import { Guest } from "../models/guestModel.js";
import { Profile } from "../models/profileModel.js";
import { User } from "../models/userModel.js";
import cloudinary from "../config/cloudinaryConfig.js";
import { extractPublicIdFromUrl } from "../utils/helperFunctions.js";
import { attachAvatars } from "../utils/attachAvatars.js";
import { calculateEventEndTime } from "../utils/eventDuration.js";
import { getMediaRetentionDeleteAt } from "../utils/mediaRetention.js";
import { enqueueEventPrivacyJob } from "../queues/eventPrivacyQueue.js";
import { enqueueEventCleanupJob } from "../queues/eventCleanupQueue.js";
import { enqueueMediaRetentionJob } from "../queues/mediaRetentionQueue.js";
import { triggerEventSync } from "../queues/eventSyncQueue.js";
import {
    createNotification,
    notifyEventEndedParticipants,
} from "./notificationService.js";

/**
 * @module services/eventService
 * @description Lifecycle + read/write for the Event aggregate. Invariants:
 * endTime is always server-derived; startTime is locked once the event has
 * started; tier/status flow through dedicated entrypoints only.
 */

/** BullMQ delays cap at ~2^31 ms (~24.8 days); past that, the periodic
 *  scanner picks it up instead. */
const MAX_DELAY_MS = 24 * 24 * 60 * 60 * 1000;

/**
 * Best-effort: enqueue the retention cleanup job with a delay equal to
 * `deleteAt - now`. Skipped if `deleteAt` is too far out for BullMQ.
 * @param {import("mongoose").Document} event
 * @returns {Promise<void>}
 */
const scheduleRetentionForEvent = async (event) => {
    try {
        const deleteAt = getMediaRetentionDeleteAt(event);
        if (!deleteAt) return;
        const delayMs = deleteAt.getTime() - Date.now();
        if (delayMs > MAX_DELAY_MS) return;
        await enqueueMediaRetentionJob(
            { eventId: String(event._id) },
            { delayMs: Math.max(0, delayMs) },
        );
    } catch (err) {
        console.warn(
            `[media-retention] failed to schedule retention for ${event?._id}:`,
            err.message,
        );
    }
};

/**
 * Persist a new Event. Derives endTime from tier+startTime and schedules
 * the media-retention job.
 * @param {object} eventData Must include startTime; tier defaults to "free".
 * @returns {Promise<import("mongoose").Document>} Saved event with host populated.
 * @throws {Error} If startTime is missing/invalid.
 */
export const createEvent = async (eventData) => {
    try {
        const start = new Date(eventData.startTime);
        if (Number.isNaN(start.getTime())) {
            throw new Error("Invalid start time");
        }

        const tier = eventData.tier || "free";
        const computedEndTime = calculateEventEndTime(start, tier);

        const event = new Event({
            ...eventData,
            tier,
            startTime: start,
            endTime: computedEndTime,
        });
        await event.save();

        await scheduleRetentionForEvent(event);

        // Populate host information
        await event.populate("hostId", "userName email");

        return event;
    } catch (error) {
        throw error;
    }
};

/**
 * Fetch an event by id with host populated + avatar hydrated.
 * @param {string} eventId
 * @returns {Promise<object>}
 * @throws {Error} 404 if missing/invalid id.
 */
export const findEventById = async (eventId) => {
    try {
        if (!mongoose.isValidObjectId(eventId)) {
            throw new Error("Event not found");
        }

        const event = await Event.findById(eventId).populate(
            "hostId",
            "userName email",
        );

        if (!event) {
            throw new Error("Event not found");
        }

        return attachAvatars(event, ["hostId"]);
    } catch (error) {
        throw error;
    }
};

/**
 * List events owned by a host, newest first.
 * @param {string} hostId
 * @returns {Promise<object[]>}
 */
export const findAllEventsByHost = async (hostId) => {
    try {
        const events = await Event.find({ hostId })
            .populate("hostId", "userName email")
            .sort({ createdAt: -1 });
        return attachAvatars(events, ["hostId"]);
    } catch (error) {
        throw error;
    }
};

/**
 * Resolve an event by its public uniqueSlug.
 * @param {string} slug
 * @returns {Promise<object>}
 * @throws {Error} 404 if missing.
 */
export const findEventBySlug = async (slug) => {
    try {
        const event = await Event.findOne({ uniqueSlug: slug }).populate(
            "hostId",
            "userName email",
        );

        if (!event) {
            throw new Error("Event not found");
        }

        return attachAvatars(event, ["hostId"]);
    } catch (error) {
        throw error;
    }
};

/**
 * Patch an event. Host-only; rejects endTime edits; drops tier/status;
 * lets startTime through only while the event hasn't started, and
 * recalculates endTime in that case.
 * @param {string} eventId
 * @param {object} updateData
 * @param {string} requesterId
 * @returns {Promise<object>} Updated event with host populated.
 * @throws {Error} On not-found, unauthorized, locked startTime, or endTime edit attempt.
 */
export const updateEvent = async (eventId, updateData, requesterId) => {
    try {
        const event = await Event.findById(eventId);

        if (!event) {
            throw new Error("Event not found");
        }

        // Check if user is the host
        if (event.hostId.toString() !== requesterId) {
            throw new Error(
                "Unauthorized: Only event host can update this event",
            );
        }

        if (Object.prototype.hasOwnProperty.call(updateData, "endTime")) {
            throw new Error(
                "Event end time is calculated by tier and cannot be edited.",
            );
        }

        const sanitized = { ...updateData };

        delete sanitized.endTime;
        delete sanitized.tier;
        delete sanitized.status;

        if (sanitized.startTime !== undefined) {
            const newStart = new Date(sanitized.startTime);
            if (Number.isNaN(newStart.getTime())) {
                throw new Error("Invalid start time");
            }

            const now = new Date();
            if (now >= event.startTime) {
                throw new Error(
                    "Start time cannot be edited after the event has started.",
                );
            }

            sanitized.startTime = newStart;
            sanitized.endTime = calculateEventEndTime(newStart, event.tier);
        }

        // Handle Image Update
        if (sanitized.thumbnail && event.thumbnail) {
            const publicId = extractPublicIdFromUrl(event.thumbnail);
            await cloudinary.uploader.destroy(publicId);
        }

        // Update and save the event
        const updatedEvent = await Event.findByIdAndUpdate(eventId, sanitized, {
            new: true,
            runValidators: true,
        }).populate("hostId", "userName email");

        return updatedEvent;
    } catch (error) {
        throw error;
    }
};

/**
 * Host-driven event completion: flips status to "Completed" and triggers
 * the event-sync tick (which runs the highlight/retention scans).
 * @param {string} eventId
 * @param {string} requesterId Must match event.hostId.
 * @returns {Promise<import("mongoose").Document>} The updated event with host populated.
 * @throws {Error} If missing, unauthorized, or already Completed/Cancelled.
 */
export const finishEventByHost = async (eventId, requesterId) => {
    const event = await Event.findById(eventId);

    if (!event) {
        const err = new Error("Event not found");
        throw err;
    }

    if (event.hostId.toString() !== requesterId) {
        throw new Error("Unauthorized: Only event host can finish this event");
    }

    if (event.status === "Completed") {
        throw new Error("Event is already completed.");
    }

    if (event.status === "Cancelled") {
        throw new Error("Cancelled events cannot be marked as completed.");
    }

    event.status = "Completed";
    await event.save();

    try {
        await notifyEventEndedParticipants(event);
    } catch (err) {
        console.warn(
            `[notification] failed to notify participants for ended event ${event._id}:`,
            err.message,
        );
    }

    try {
        await triggerEventSync();
    } catch (err) {
        console.warn(
            "[event-sync] failed to trigger after host finish:",
            err.message,
        );
    }

    await event.populate("hostId", "userName email");
    return event;
};

/**
 * Generic host-driven status update. Triggers an event-sync tick when
 * the new status is "Completed".
 * @param {string} eventId
 * @param {"Active"|"Completed"|"Cancelled"} status
 * @param {string} requesterId Must match event.hostId.
 * @returns {Promise<object>} Updated event with host populated.
 * @throws {Error} If missing or unauthorized.
 */
export const updateEventStatus = async (eventId, status, requesterId) => {
    try {
        const event = await Event.findById(eventId);

        if (!event) {
            throw new Error("Event not found");
        }

        // Check if user is the host
        if (event.hostId.toString() !== requesterId) {
            throw new Error(
                "Unauthorized: Only event host can update event status",
            );
        }

        const shouldNotifyParticipants =
            status === "Completed" && event.status !== "Completed";

        const updatedEvent = await Event.findByIdAndUpdate(
            eventId,
            { status },
            { new: true, runValidators: true },
        ).populate("hostId", "userName email");

        if (shouldNotifyParticipants) {
            try {
                await notifyEventEndedParticipants(updatedEvent);
            } catch (err) {
                console.warn(
                    `[notification] failed to notify participants for ended event ${eventId}:`,
                    err.message,
                );
            }
        }

        if (status === "Completed") {
            try {
                await triggerEventSync();
            } catch (err) {
                console.warn(
                    "[event-sync] failed to trigger after manual Complete:",
                    err.message,
                );
            }
        }

        return updatedEvent;
    } catch (error) {
        throw error;
    }
};

const assertEventHost = async (eventId, requesterId) => {
    if (!mongoose.isValidObjectId(eventId)) {
        throw new Error("Event not found");
    }

    const event = await Event.findById(eventId).select(
        "_id hostId eventName uniqueSlug",
    );

    if (!event) {
        throw new Error("Event not found");
    }

    if (event.hostId.toString() !== requesterId) {
        throw new Error("Unauthorized: Only event host can invite users");
    }

    return event;
};

/**
 * Host-only username search for active registered users who can be invited.
 * Email is intentionally omitted from the projection.
 * @param {string} eventId
 * @param {string} requesterId
 * @param {{ search?: string, limit?: number }} [opts]
 * @returns {Promise<Array<{ _id: string, userName: string, profilePicture: string }>>}
 */
export const searchEventInviteUsers = async (
    eventId,
    requesterId,
    { search = "", limit = 20 } = {},
) => {
    const event = await assertEventHost(eventId, requesterId);
    const cap = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
    const joinedUserIds = await EventMembership.distinct("userId", {
        eventId: event._id,
    });
    const filter = {
        status: "active",
        role: "user",
        _id: { $nin: [event.hostId, ...joinedUserIds] },
    };

    if (search && String(search).trim()) {
        const escaped = String(search)
            .trim()
            .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        filter.userName = new RegExp(escaped, "i");
    }

    const users = await User.find(filter)
        .select("_id userName")
        .sort({ userName: 1 })
        .limit(cap)
        .lean();

    const profiles = await Profile.find({
        user: { $in: users.map((user) => user._id) },
    })
        .select("user profilePicture")
        .lean();
    const profilePictureByUserId = new Map(
        profiles.map((profile) => [
            String(profile.user),
            profile.profilePicture || "",
        ]),
    );

    return users.map((user) => ({
        _id: user._id,
        userName: user.userName,
        profilePicture: profilePictureByUserId.get(String(user._id)) || "",
    }));
};

/**
 * Host sends a clickable in-app invite notification to a registered user.
 * @param {string} eventId
 * @param {string} requesterId
 * @param {string} recipientId
 * @returns {Promise<import("mongoose").Document|null>}
 */
export const sendEventInvite = async (eventId, requesterId, recipientId) => {
    const event = await assertEventHost(eventId, requesterId);

    if (!mongoose.isValidObjectId(recipientId)) {
        throw new Error("Invalid user id");
    }

    if (String(event.hostId) === String(recipientId)) {
        throw new Error("You cannot invite yourself to your own event.");
    }

    const existingMembership = await EventMembership.exists({
        eventId: event._id,
        userId: recipientId,
    });

    if (existingMembership) {
        throw new Error("User has already joined this event.");
    }

    const recipient = await User.findOne({
        _id: recipientId,
        status: "active",
        role: "user",
    }).select("_id");

    if (!recipient) {
        throw new Error("User not found");
    }

    return createNotification({
        recipientId: recipient._id,
        message: `You are invited to ${event.eventName}`,
        type: "event_invite",
        link: `/events/${event.uniqueSlug}`,
    });
};

/**
 * Delete an event and enqueue a cleanup job that wipes its Media,
 * Interactions, and Cloudinary folder.
 * @param {string} eventId
 * @param {string} requesterId Must match event.hostId.
 * @returns {Promise<{ message: string }>}
 * @throws {Error} If missing or unauthorized.
 */
export const removeEvent = async (eventId, requesterId) => {
    try {
        const event = await Event.findById(eventId);

        if (!event) {
            throw new Error("Event not found");
        }

        // Check if user is the host
        if (event.hostId.toString() !== requesterId) {
            throw new Error(
                "Unauthorized: Only event host can delete this event",
            );
        }

        await Event.findByIdAndDelete(eventId);

        try {
            await enqueueEventCleanupJob({ eventId: String(eventId) });
        } catch (err) {
            console.warn(
                `[cleanup] failed to enqueue cleanup for ${eventId}:`,
                err.message,
            );
        }

        return { message: "Event deleted successfully" };
    } catch (error) {
        throw error;
    }
};

const MAX_PUBLIC_EVENTS = 100;

/**
 * Public (logged-out) event listing.
 * @param {{ q?: string, limit?: number }} [opts]
 * @returns {Promise<object[]>} Up to MAX_PUBLIC_EVENTS events.
 */
export const listPublicEvents = async ({ q, limit } = {}) => {
    const cap = Math.min(
        Math.max(parseInt(limit, 10) || 50, 1),
        MAX_PUBLIC_EVENTS,
    );

    const filter = {
        privacy: "public",
        status: { $ne: "Cancelled" },
    };

    if (q && typeof q === "string" && q.trim()) {
        const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const rx = new RegExp(escaped, "i");
        filter.$or = [{ eventName: rx }, { location: rx }];
    }

    const events = await Event.find(filter)
        .select(
            "eventName description location startTime endTime uniqueSlug status thumbnail tier privacy participantCount",
        )
        .populate("hostId", "userName email")
        .sort({ startTime: -1 })
        .limit(cap)
        .lean();

    return attachAvatars(events, ["hostId"]);
};

/**
 * Host-only: merged list of every participant (registered members + guests)
 * in a single uniform shape for the frontend table.
 * @param {string} eventId
 * @param {string} requesterId Must match event.hostId.
 * @returns {Promise<Array<{ id: string, name: string, userName: string, type: "registered"|"guest", profilePicture: string, joinedAt: Date }>>}
 * @throws {Error} 404 if event missing, 403 if requester is not the host.
 */
export const getEventParticipants = async (eventId, requesterId) => {
    const event = await Event.findById(eventId).select("hostId");
    if (!event) {
        const err = new Error("Event not found");
        err.status = 404;
        throw err;
    }

    if (event.hostId.toString() !== requesterId) {
        const err = new Error("Only the event host can view participants");
        err.status = 403;
        throw err;
    }

    const [memberships, guests] = await Promise.all([
        EventMembership.find({ eventId })
            .select("userId joinedAt")
            .populate("userId", "userName")
            .sort({ joinedAt: -1 })
            .lean(),
        Guest.find({ eventId })
            .select("guest_id userName createdAt")
            .sort({ createdAt: -1 })
            .lean(),
    ]);

    const userIds = memberships
        .map((m) =>
            m.userId && typeof m.userId === "object" ? m.userId._id : null,
        )
        .filter(Boolean);

    const profiles = await Profile.find({ user: { $in: userIds } })
        .select("user firstName lastName profilePicture")
        .lean();
    const profileMap = new Map(
        profiles.map((p) => [
            String(p.user),
            {
                firstName: p.firstName || "",
                lastName: p.lastName || "",
                profilePicture: p.profilePicture || "",
            },
        ]),
    );

    const registered = memberships
        .filter((m) => m.userId && typeof m.userId === "object")
        .map((m) => {
            const {
                firstName = "",
                lastName = "",
                profilePicture = "",
            } = profileMap.get(String(m.userId._id)) || {};
            const fullName = `${firstName} ${lastName}`.trim();
            return {
                id: String(m.userId._id),
                name: fullName || m.userId.userName || "Unknown",
                userName: m.userId.userName || "",
                type: "registered",
                profilePicture,
                joinedAt: m.joinedAt,
            };
        });

    const guestEntries = guests.map((g) => ({
        id: g.guest_id,
        name: g.userName || "Guest",
        userName: g.userName || "",
        type: "guest",
        profilePicture: "",
        joinedAt: g.createdAt,
    }));

    return [...registered, ...guestEntries].sort(
        (a, b) => new Date(b.joinedAt) - new Date(a.joinedAt),
    );
};

/**
 * Toggle public/private. Persists the new privacy and enqueues the
 * event-privacy worker to cascade isPublic to each Media row.
 * @param {string} eventId
 * @param {"public"|"private"} privacy
 * @param {string} requesterId Must match event.hostId.
 * @returns {Promise<{ event: { _id: string, privacy: string }, jobId: string|null, targetIsPublic: boolean, queueError: string|null }>}
 * @throws {Error} 400 invalid privacy, 404 missing event, 403 unauthorized.
 */
export const updateEventPrivacy = async (eventId, privacy, requesterId) => {
    if (privacy !== "public" && privacy !== "private") {
        const err = new Error("privacy must be 'public' or 'private'");
        err.status = 400;
        throw err;
    }

    const event = await Event.findById(eventId).select("hostId privacy");
    if (!event) {
        const err = new Error("Event not found");
        err.status = 404;
        throw err;
    }

    if (event.hostId.toString() !== requesterId) {
        const err = new Error("Only the event host can change privacy");
        err.status = 403;
        throw err;
    }

    event.privacy = privacy;
    await event.save();

    const targetIsPublic = privacy === "public";

    let jobId = null;
    let queueError = null;
    try {
        const job = await enqueueEventPrivacyJob({
            eventId: String(event._id),
            privacy,
            targetIsPublic,
        });
        jobId = job.id;
    } catch (err) {
        queueError = err.message || "Failed to queue privacy sync";
        console.error(
            `Failed to enqueue privacy job for event ${event._id}:`,
            queueError,
        );
    }

    return {
        event: {
            _id: String(event._id),
            privacy: event.privacy,
        },
        jobId,
        targetIsPublic,
        queueError,
    };
};
