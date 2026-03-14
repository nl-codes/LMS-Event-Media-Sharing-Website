import Event from "../models/eventModel.js";

export const createEvent = async (eventData) => {
    try {
        if (new Date(eventData.startTime) >= new Date(eventData.endTime)) {
            throw new Error("Start time must be before end time");
        }

        const event = new Event(eventData);
        await event.save();

        // Populate host information
        await event.populate("hostId", "username email");

        return event;
    } catch (error) {
        throw error;
    }
};
