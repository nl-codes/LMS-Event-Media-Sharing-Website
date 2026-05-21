import {
    createEvent,
    findAllEventsByHost,
    findEventById,
    findEventBySlug,
    finishEventByHost,
    getEventParticipants,
    listPublicEvents,
    removeEvent,
    updateEvent,
    updateEventPrivacy,
    updateEventStatus,
} from "../services/eventService.js";
import { Event } from "../models/eventModel.js";
import { Guest } from "../models/guestModel.js";
import { v4 as uuidv4 } from "uuid";
import { isNowBetween } from "../utils/timeline.js";

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

export const editEvent = async (req, res) => {
    try {
        const { id } = req.params;
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

export const requestUploadSignature = async (req, res) => {
    try {
        const { slug } = req.params;
        const event = await findEventBySlug(slug);

        // Check if event is live (Gatekeeper functionality)
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
