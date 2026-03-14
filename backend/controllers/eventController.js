import {
    createEvent,
    findAllEventsByHost,
    findEventById,
    findEventBySlug,
} from "../services/eventService.js";

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
