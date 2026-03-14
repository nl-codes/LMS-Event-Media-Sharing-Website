import * as eventService from "../services/eventService.js";

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
            hostId: req.user.id,
            eventName,
            description,
            location,
            startTime,
            endTime,
            isPremium: isPremium || false,
        };

        const event = await eventService.createEvent(eventData);

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
