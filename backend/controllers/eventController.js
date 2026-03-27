import {
    createEvent,
    findAllEventsByHost,
    findEventById,
    findEventBySlug,
    removeEvent,
    updateEvent,
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
            endTime,
            isPremium,
        } = req.body;

        // Validation
        if (!eventName || !location || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message:
                    "Event name, location, start time, and end time are required",
            });
        }
        const eventData = {
            hostEmail: req.user.email,
            eventName,
            description,
            location,
            startTime,
            endTime,
            isPremium: isPremium || false,
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
        const updateData = req.body;

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

        const isActiveWindow =
            event.status === "Active" &&
            isNowBetween(event.startTime, event.endTime);

        if (!isActiveWindow) {
            return res.status(403).json({
                success: false,
                message: "Event is not accepting uploads right now",
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
