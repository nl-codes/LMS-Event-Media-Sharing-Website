import { Event } from "../models/eventModel.js";
import { User } from "../models/userModel.js";

export const createEvent = async (eventData) => {
    try {
        if (new Date(eventData.startTime) >= new Date(eventData.endTime)) {
            throw new Error("Start time must be before end time");
        }
        const user = await User.findOne({ email: eventData.hostEmail }).select(
            "_id",
        );

        const finalEventData = {
            ...eventData,
            hostId: user._id,
        };

        const event = new Event(finalEventData);
        await event.save();

        // Populate host information
        await event.populate("hostId", "username email");

        return event;
    } catch (error) {
        throw error;
    }
};

export const findEventById = async (eventId) => {
    try {
        const event = await Event.findById(eventId).populate(
            "hostId",
            "username email",
        );

        if (!event) {
            throw new Error("Event not found");
        }

        return event;
    } catch (error) {
        throw error;
    }
};

export const findAllEventsByHost = async (hostId) => {
    try {
        const events = await Event.find({ hostId })
            .populate("hostId", "username email")
            .sort({ createdAt: -1 });
        return events;
    } catch (error) {
        throw error;
    }
};

export const findEventBySlug = async (slug) => {
    try {
        const event = await Event.findOne({ uniqueSlug: slug }).populate(
            "hostId",
            "userName email",
        );

        if (!event) {
            throw new Error("Event not found");
        }

        return event;
    } catch (error) {
        throw error;
    }
};

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

        // Validate times if being updated
        if (updateData.startTime || updateData.endTime) {
            const startTime = updateData.startTime
                ? new Date(updateData.startTime)
                : event.startTime;
            const endTime = updateData.endTime
                ? new Date(updateData.endTime)
                : event.endTime;

            if (startTime >= endTime) {
                throw new Error("Start time must be before end time");
            }
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            eventId,
            updateData,
            { new: true, runValidators: true },
        ).populate("hostId", "username email");

        return updatedEvent;
    } catch (error) {
        throw error;
    }
};

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

        const updatedEvent = await Event.findByIdAndUpdate(
            eventId,
            { status },
            { new: true, runValidators: true },
        ).populate("hostId", "username email");

        return updatedEvent;
    } catch (error) {
        throw error;
    }
};

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
        return { message: "Event deleted successfully" };
    } catch (error) {
        throw error;
    }
};
