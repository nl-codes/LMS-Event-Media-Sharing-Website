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
