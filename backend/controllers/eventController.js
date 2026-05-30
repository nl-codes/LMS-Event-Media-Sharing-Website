/**
 * @module controllers/eventController
 * @description HTTP layer for event CRUD, host actions (finish, status,
 * privacy), public discovery, guest join, and the upload-gate verification
 * endpoint. Validation and side-effects (queues, retention, slug) live in
 * {@link module:services/eventService}.
 */

import {
    createEvent,
    findAllEventsByHost,
    findEventById,
    findEventBySlug,
    finishEventByHost,
    getEventParticipants,
    listPublicEvents,
    removeEvent,
    searchEventInviteUsers,
    sendEventInvite,
    updateEvent,
    updateEventPrivacy,
    updateEventStatus,
} from "../services/eventService.js";
import { Event } from "../models/eventModel.js";
import { Guest } from "../models/guestModel.js";
import { v4 as uuidv4 } from "uuid";
import { isNowBetween } from "../utils/timeline.js";

/**
 * POST /events
 *
 * Create a (free-tier) event. `endTime` is intentionally NOT accepted — it
 * is derived from tier+startTime by the service. `attachEventId` middleware
 * pre-generates `req.generatedEventId` so the Cloudinary thumbnail folder
 * matches the eventual Event id.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const registerEvent = async (req, res) => {
    try {
        const {
            eventName,
            description,
            location,
            startTime,
            isPremium,
            privacy,
        } = req.body;
        const thumbnail = req.file?.path || "";

        if (!eventName || !location || !startTime) {
            return res.status(400).json({
                success: false,
                message: "Event name, location, and start time are required",
            });
        }
        const eventData = {
            _id: req.generatedEventId,
            hostId: req.user.id,
            eventName,
            description,
            location,
            startTime,
            isPremium: isPremium || false,
            thumbnail: thumbnail,
            privacy: privacy === "public" ? "public" : "private",
        };

        const event = await createEvent(eventData);

        res.status(201).json({
            success: true,
            message: "Event created successfully",
            data: event,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * GET /events/details/:id
 *
 * Authoritative event read (host populated + avatar attached + retention
 * virtuals).
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const getEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await findEventById(id);

        res.status(200).json({
            success: true,
            data: event,
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * GET /events/host-events
 *
 * Events owned by the authenticated user (host dashboard).
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const getHostEvents = async (req, res) => {
    try {
        const events = await findAllEventsByHost(req.user.id);

        res.status(200).json({
            success: true,
            total_events: events.length,
            data: events,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * GET /events/:slug
 *
 * Public-facing event resolver by short slug. Used by guest QR/share links.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const getEventBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const event = await findEventBySlug(slug);

        res.status(200).json({
            success: true,
            data: event,
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * PATCH /events/:id
 *
 * Host edit of mutable event fields. The service rejects any attempt to
 * change `endTime` (tier-derived) and locks `startTime` once the event has
 * started. A new thumbnail upload arrives via multer as `req.file`.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const editEvent = async (req, res) => {
    try {
        const { id } = req.params;
        // Merge multipart body + (optional) new thumbnail URL. The service
        // strips tier/status; we forward everything else.
        const updateData = {
            ...req.body,
            ...(req.file?.path ? { thumbnail: req.file.path } : {}),
        };

        const updatedEvent = await updateEvent(id, updateData, req.user.id);

        res.status(200).json({
            success: true,
            message: "Event updated successfully",
            data: updatedEvent,
        });
    } catch (error) {
        // Map service errors to HTTP codes by error-message substring. Not
        // ideal long-term, but matches the rest of this controller.
        const statusCode = error.message.includes("Unauthorized")
            ? 403
            : error.message.includes("not found")
              ? 404
              : 400;

        res.status(statusCode).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * PATCH /events/:id/finish
 *
 * Host-driven manual completion. Closes uploads and triggers the
 * event-sync tick (highlight + retention scans). Does NOT mutate
 * `endTime`.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const finishEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedEvent = await finishEventByHost(id, req.user.id);

        return res.status(200).json({
            success: true,
            message: "Event marked as completed",
            data: updatedEvent,
        });
    } catch (error) {
        const statusCode = error.message.includes("Unauthorized")
            ? 403
            : error.message.includes("not found")
              ? 404
              : 400;

        return res.status(statusCode).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * GET /events/:id/invite-users?search=...
 *
 * Host-only searchable registered-user list for event invites. Only userName
 * is exposed to the frontend.
 */
export const searchEventInviteUsersController = async (req, res) => {
    try {
        const { id } = req.params;
        const users = await searchEventInviteUsers(id, req.user.id, {
            search: req.query.search,
            limit: req.query.limit,
        });

        return res.status(200).json({
            success: true,
            data: users,
        });
    } catch (error) {
        const statusCode = error.message.includes("Unauthorized")
            ? 403
            : error.message.includes("not found")
              ? 404
              : 400;
        return res.status(statusCode).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * POST /events/:id/invite
 *
 * Host-only notification invite to a registered user.
 */
export const sendEventInviteController = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User id is required",
            });
        }

        const notification = await sendEventInvite(id, req.user.id, userId);

        return res.status(201).json({
            success: true,
            message: "Invite sent",
            data: notification,
        });
    } catch (error) {
        const statusCode = error.message.includes("Unauthorized")
            ? 403
            : error.message.includes("not found")
              ? 404
              : 400;
        return res.status(statusCode).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * PATCH /events/:id/status
 *
 * Generic status setter (Active/Completed/Cancelled). Use {@link finishEvent}
 * for the host "Finish Event" UI; this endpoint is the broader admin/edit
 * surface.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const editEventStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["Active", "Completed", "Cancelled"].includes(status)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid status. Must be Active, Completed, or Cancelled",
            });
        }

        const updatedEvent = await updateEventStatus(id, status, req.user.id);

        res.status(200).json({
            success: true,
            message: "Event status updated successfully",
            data: updatedEvent,
        });
    } catch (error) {
        const statusCode = error.message.includes("Unauthorized")
            ? 403
            : error.message.includes("not found")
              ? 404
              : 400;

        res.status(statusCode).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * DELETE /events/:id
 *
 * Host-driven delete. The Event row goes immediately; an event-cleanup job
 * is enqueued by the service to purge Media + Interactions + Cloudinary
 * folder asynchronously.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await removeEvent(id, req.user.id);

        res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        const statusCode = error.message.includes("Unauthorized")
            ? 403
            : error.message.includes("not found")
              ? 404
              : 500;

        res.status(statusCode).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * POST /events/:slug/upload-check
 *
 * Lightweight "may I upload?" probe used by the public gallery before
 * showing the upload button. Returns the live event state so the UI can
 * explain *why* uploads are closed when they are.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const requestUploadSignature = async (req, res) => {
    try {
        const { slug } = req.params;
        const event = await findEventBySlug(slug);

        // `isLive` is a model virtual that combines status, startTime and
        // endTime — the single source of truth for the upload gate.
        if (!event.isLive) {
            return res.status(403).json({
                success: false,
                message:
                    "Media upload not allowed. Event is not currently live.",
                eventStatus: {
                    status: event.status,
                    isLive: event.isLive,
                    isUpcoming: event.isUpcoming,
                    startTime: event.startTime,
                    endTime: event.endTime,
                },
            });
        }

        // If event is live, allow upload (return success)
        res.status(200).json({
            success: true,
            message: "Upload authorized",
            eventStatus: {
                status: event.status,
                isLive: event.isLive,
                eventName: event.eventName,
            },
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * GET /events/verify/:eventId
 *
 * Verbose verification endpoint used by the public gallery routes. Returns
 * different 403 messages so the UI can show a precise reason
 * (cancelled / finished / not started yet / inactive). On success, exposes
 * whether the caller is a registered user (sets `data.isRegistered`).
 *
 * The order of branches is deliberate — Cancelled and Completed must
 * win before the "not started yet" check or a finished event that hasn't
 * started would render a misleading "come back later" message.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const verifyEventAccess = async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found",
            });
        }

        const now = new Date();
        const startTime = new Date(event.startTime);
        const endTime = new Date(event.endTime);

        if (event.status === "Cancelled") {
            return res.status(403).json({
                success: false,
                message:
                    "This event has been cancelled and is no longer accepting uploads.",
            });
        }

        if (event.status === "Completed" || now > endTime) {
            return res.status(403).json({
                success: false,
                message:
                    "This event has already finished. The upload window is closed.",
            });
        }

        if (now < startTime) {
            return res.status(403).json({
                success: false,
                message:
                    "The event hasn't started yet. Uploads will open at " +
                    startTime.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }) +
                    ".",
            });
        }

        if (event.status !== "Active") {
            return res.status(403).json({
                success: false,
                message: "Uploads are currently disabled for this event.",
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                isRegistered: Boolean(req.user),
            },
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * POST /events/join-as-guest
 *
 * Anonymous join: mints a UUID guest identity scoped to the event and
 * persists a Guest row. The frontend stores `guest_id` in a per-event
 * scoped cookie; subsequent uploads carry that id via `identifyUser`
 * middleware.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const joinAsGuest = async (req, res) => {
    try {
        const { eventId, userName } = req.body;

        if (!eventId || !userName || !String(userName).trim()) {
            return res.status(400).json({
                success: false,
                message: "eventId and userName are required",
            });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found",
            });
        }

        // Active + within window — guests can't join finished/cancelled
        // events, no point handing out an identity that won't pass the
        // upload gate.
        const eventEndTime = new Date(event.endTime);
        const isActiveWindow =
            event.status === "Active" &&
            isNowBetween(event.startTime, eventEndTime);

        if (!isActiveWindow) {
            return res.status(403).json({
                success: false,
                message: "Event is not accepting uploads right now",
            });
        }

        const guest_id = uuidv4();
        const guest = await Guest.create({
            guest_id,
            userName: String(userName).trim(),
            eventId,
        });

        return res.status(201).json({
            success: true,
            message: "Guest access granted",
            data: {
                guest_id: guest.guest_id,
                userName: guest.userName,
                eventId: String(guest.eventId),
            },
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * GET /events/:id/participants
 *
 * Host-only merged participants list (registered members + guests). Host
 * check happens in the service.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const getEventParticipantsController = async (req, res) => {
    try {
        const { id } = req.params;
        const requesterId = req.user?.id;
        if (!requesterId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const participants = await getEventParticipants(id, requesterId);
        return res.status(200).json({
            success: true,
            data: participants,
        });
    } catch (error) {
        const status = error.status || 500;
        return res.status(status).json({
            success: false,
            message: error.message || "Failed to load participants",
        });
    }
};

/**
 * PATCH /events/:eventId/privacy
 *
 * Toggle public/private. Returns 202 because the row flip is synchronous
 * but the per-media `isPublic` cascade runs through the event-privacy
 * queue and may still be in flight when we respond.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const updateEventPrivacyController = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { privacy } = req.body;
        const requesterId = req.user?.id;
        if (!requesterId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const result = await updateEventPrivacy(eventId, privacy, requesterId);
        const message = result.queueError
            ? "Event privacy updated. Media visibility sync could not be queued, Please try toggling privacy again."
            : "Event privacy updated. Media visibility will be updated shortly.";
        // 202 Accepted: privacy field changed; bulk media sync is in flight.
        return res.status(202).json({
            success: true,
            message,
            data: result,
        });
    } catch (error) {
        const status = error.status || 500;
        return res.status(status).json({
            success: false,
            message: error.message || "Failed to update privacy",
        });
    }
};

/**
 * GET /events/public?q=...&limit=...
 *
 * Public discovery feed — no auth. Service caps the response size.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const listPublicEventsController = async (req, res) => {
    try {
        const { q, limit } = req.query;
        const events = await listPublicEvents({ q, limit });
        return res.status(200).json({
            success: true,
            count: events.length,
            data: events,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to load public events",
        });
    }
};
